# /// script
# requires-python = "==3.11.*"
# dependencies = [
#   "fastapi==0.115.8",
#   "pydantic==2.10.6",
#   "structlog==25.1.0",
#   "httpx==0.28.1",
# ]
# [tool.env-checker]
# env_vars = [
#   "PORT=8000",
#   "ZOHO_CLIENT_ID",
#   "ZOHO_CLIENT_SECRET",
#   "ZOHO_CAMPAIGNS_REFRESH_TOKEN",
#   "ZOHO_CAMPAIGNS_REGION=com",
# ]
# ///

"""
Zoho Campaigns Integration Service (Standalone)
=================================================
Zero CodeWords dependency. Uses direct Zoho Campaigns REST API v1.1.
Works anywhere: local, VPS, Docker, Vercel (Python runtime), CodeWords.

OAuth 2.0 with automatic token refresh.
Reuse the same Zoho connected app (client_id/secret) from CRM/Inventory.
Just add scope: ZohoCampaigns.campaign.ALL,ZohoCampaigns.contact.ALL

API Docs: https://www.zoho.com/campaigns/help/developers/
Base URL: https://campaigns.zoho.{region}/api/v1.1

Endpoints:
  POST /create-campaign     — Create email campaign
  POST /add-contact         — Add contact to mailing list
  POST /bulk-sync           — Bulk add contacts
  GET  /mailing-lists       — List all mailing lists
  GET  /campaign-stats/{id} — Get campaign performance stats
"""

import os
import httpx
import structlog
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logger = structlog.get_logger()

# ─── Config ───

REGION = os.getenv("ZOHO_CAMPAIGNS_REGION", "com")
CAMPAIGNS_BASE = f"https://campaigns.zoho.{REGION}/api/v1.1"
ACCOUNTS_URL = f"https://accounts.zoho.{REGION}"

_token_cache: dict = {}


async def get_access_token() -> str:
    """Get valid access token, refreshing if needed."""
    if _token_cache.get("access_token"):
        return _token_cache["access_token"]
    return await refresh_access_token()


async def refresh_access_token() -> str:
    """Refresh OAuth access token using refresh token."""
    refresh_token = os.getenv("ZOHO_CAMPAIGNS_REFRESH_TOKEN", "")
    client_id = os.getenv("ZOHO_CLIENT_ID", "")
    client_secret = os.getenv("ZOHO_CLIENT_SECRET", "")

    if not all([refresh_token, client_id, client_secret]):
        raise HTTPException(
            status_code=500,
            detail="Missing Zoho OAuth credentials (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_CAMPAIGNS_REFRESH_TOKEN)"
        )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{ACCOUNTS_URL}/oauth/v2/token",
            params={
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    token = data.get("access_token")
    if not token:
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {data}")

    _token_cache["access_token"] = token
    logger.info("Zoho Campaigns token refreshed")
    return token


async def campaigns_request(
    method: str,
    path: str,
    data: dict | None = None,
    params: dict | None = None,
) -> dict:
    """Authenticated request to Zoho Campaigns API."""
    token = await get_access_token()
    url = f"{CAMPAIGNS_BASE}/{path.lstrip('/')}"

    headers = {"Authorization": f"Zoho-oauthtoken {token}"}

    async with httpx.AsyncClient() as client:
        if method.upper() == "GET":
            resp = await client.get(url, headers=headers, params=params, timeout=30.0)
        else:
            resp = await client.post(url, headers=headers, data=data, params=params, timeout=30.0)

        # Token expired → refresh once and retry
        if resp.status_code == 401:
            logger.warn("Campaigns token expired, refreshing...")
            _token_cache.clear()
            token = await refresh_access_token()
            headers["Authorization"] = f"Zoho-oauthtoken {token}"

            if method.upper() == "GET":
                resp = await client.get(url, headers=headers, params=params, timeout=30.0)
            else:
                resp = await client.post(url, headers=headers, data=data, params=params, timeout=30.0)

        resp.raise_for_status()

        # Zoho Campaigns API returns JSON with status codes in body
        try:
            return resp.json()
        except Exception:
            return {"raw_text": resp.text, "status_code": resp.status_code}


# ─── Pydantic Models ───

class CreateCampaignInput(BaseModel):
    campaign_name: str = Field(..., description="Name for the campaign")
    from_email: str = Field(..., description="Sender email address")
    subject: str = Field(..., description="Email subject line")
    content_url: str = Field("", description="URL to HTML content (optional if using template)")
    list_key: str = Field(..., description="Mailing list key/ID to target")
    topic_id: str | None = Field(None, description="Optional topic ID")

class AddContactInput(BaseModel):
    email: str = Field(..., description="Contact email address")
    first_name: str = Field("", description="Contact first name")
    last_name: str = Field("", description="Contact last name")
    list_key: str = Field(..., description="Mailing list key/ID")

class BulkSyncInput(BaseModel):
    contacts: list[dict] = Field(..., description="List of dicts with: email, first_name, last_name")
    list_key: str = Field(..., description="Target mailing list key/ID")


# ─── FastAPI App ───

app = FastAPI(title="Zoho Campaigns Integration (Standalone)")


@app.post("/create-campaign")
async def create_campaign(input_data: CreateCampaignInput):
    """Create a new email campaign via Zoho Campaigns API."""
    logger.info("Creating campaign", name=input_data.campaign_name)

    payload = {
        "campaignname": input_data.campaign_name,
        "from_email": input_data.from_email,
        "subject": input_data.subject,
        "listkey": input_data.list_key,
    }

    if input_data.content_url:
        payload["content_url"] = input_data.content_url
    if input_data.topic_id:
        payload["topicId"] = input_data.topic_id

    result = await campaigns_request("POST", "json/campaign/create", data=payload)

    status = result.get("status", "")
    logger.info("Campaign created", status=status, result=result)

    return {
        "success": status == "success",
        "campaign_key": result.get("campaign_key", ""),
        "message": result.get("message", ""),
        "raw": result,
    }


@app.post("/add-contact")
async def add_contact(input_data: AddContactInput):
    """Add a single contact to a mailing list."""
    logger.info("Adding contact", email=input_data.email)

    # Zoho Campaigns expects contactinfo as: email,,First Name,Last Name
    contact_info = f"{input_data.email},,{input_data.first_name},{input_data.last_name}"

    result = await campaigns_request(
        "POST",
        "json/listsubscribe",
        data={
            "resfmt": "JSON",
            "listkey": input_data.list_key,
            "contactinfo": contact_info,
        },
    )

    status = result.get("status", "")
    return {
        "success": status == "success",
        "message": result.get("message", ""),
        "raw": result,
    }


@app.post("/bulk-sync")
async def bulk_sync_contacts(input_data: BulkSyncInput):
    """Bulk-add contacts to a mailing list."""
    logger.info("Bulk syncing", count=len(input_data.contacts))

    results = []
    errors = []

    for contact in input_data.contacts:
        email = contact.get("email", "")
        if not email:
            errors.append({"error": "Missing email", "contact": contact})
            continue

        first = contact.get("first_name", "")
        last = contact.get("last_name", "")
        contact_info = f"{email},,{first},{last}"

        try:
            result = await campaigns_request(
                "POST",
                "json/listsubscribe",
                data={
                    "resfmt": "JSON",
                    "listkey": input_data.list_key,
                    "contactinfo": contact_info,
                },
            )
            results.append({"email": email, "success": True, "result": result})
        except Exception as e:
            logger.error("Bulk add failed", email=email, error=str(e))
            errors.append({"email": email, "error": str(e)})

    return {
        "success": len(errors) == 0,
        "total": len(input_data.contacts),
        "added": len(results),
        "failed": len(errors),
        "results": results[:5],  # First 5 for brevity
        "errors": errors,
    }


@app.get("/mailing-lists")
async def get_mailing_lists():
    """Retrieve all mailing lists from Zoho Campaigns."""
    result = await campaigns_request(
        "POST",
        "json/getmailinglists",
        data={
            "resfmt": "JSON",
            "sort": "asc",
            "range": 100,
        },
    )

    lists = result.get("list_of_details", [])
    return {
        "success": True,
        "mailing_lists": [
            {
                "list_key": ml.get("listkey", ""),
                "list_name": ml.get("listname", ""),
                "count": ml.get("count", 0),
            }
            for ml in lists
        ] if isinstance(lists, list) else [],
        "raw": result,
    }


@app.get("/campaign-stats/{campaign_key}")
async def get_campaign_stats(campaign_key: str):
    """Get performance stats for a specific campaign."""
    result = await campaigns_request(
        "POST",
        "json/campaign/reports",
        data={
            "resfmt": "JSON",
            "campaignkey": campaign_key,
        },
    )

    return {
        "success": True,
        "campaign_key": campaign_key,
        "stats": result,
    }
