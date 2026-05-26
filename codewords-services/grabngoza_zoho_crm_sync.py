# /// script
# requires-python = "==3.11.*"
# dependencies = [
#   "codewords-client==0.4.6",
#   "composio==0.11.2",
#   "fastapi==0.116.1"
# ]
# [tool.env-checker]
# env_vars = [
#   "PORT=8000",
#   "LOGLEVEL=INFO",
#   "CODEWORDS_API_KEY",
#   "CODEWORDS_RUNTIME_URI"
# ]
# ///

import asyncio
from typing import Optional

from composio import Composio
from codewords_client import logger, run_service
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="Grab & Go → Zoho CRM Customer Sync",
    description="Upserts order customers into Zoho CRM Contacts by email (create or update).",
    version="1.0.0",
)

_composio_client = None

def get_composio() -> Composio:
    global _composio_client
    if _composio_client is None:
        _composio_client = Composio()
    return _composio_client

async def zoho_crm_exec(slug: str, arguments: dict) -> dict:
    result = await asyncio.to_thread(
        get_composio().tools.execute,
        slug=slug, arguments=arguments, dangerously_skip_version_check=True,
    )
    if not result.get("successful"):
        raise RuntimeError(f"Zoho {slug} failed: {result.get('error')}")
    return result.get("data", {})

class CustomerInput(BaseModel):
    orderId: str
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postalCode: Optional[str] = None
    country: str = "South Africa"
    orderTotal: float = 0
    itemCount: int = 0
    deliveryMethod: Optional[str] = None

class CrmSyncResponse(BaseModel):
    success: bool
    action: str
    zohoContactId: Optional[str] = None
    email: str
    steps: list[str] = []

@app.post("/", response_model=CrmSyncResponse)
async def sync_customer_to_crm(request: CustomerInput) -> CrmSyncResponse:
    """Upsert a Grab & Go customer into Zoho CRM Contacts."""
    logger.info("STEPLOG START search_contact")
    # Search existing
    search_result = await zoho_crm_exec("ZOHO_SEARCH_ZOHO_RECORDS", {
        "module_api_name": "Contacts",
        "email": request.email,
        "fields": "id,First_Name,Last_Name,Email,Phone",
        "per_page": 5,
    })
    records = search_result.get("data", [])

    logger.info("STEPLOG START build_fields")
    fields: dict = {
        "First_Name": request.firstName, "Last_Name": request.lastName,
        "Email": request.email, "Mailing_Country": request.country,
        "Description": (f"Latest order: {request.orderId} | "
                        f"R{request.orderTotal:.2f} | {request.itemCount} items | "
                        f"{request.deliveryMethod or ''} | Source: Grab & Go eCommerce"),
    }
    if request.phone: fields["Phone"] = request.phone
    if request.address: fields["Mailing_Street"] = request.address
    if request.city: fields["Mailing_City"] = request.city
    if request.province: fields["Mailing_State"] = request.province
    if request.postalCode: fields["Mailing_Zip"] = request.postalCode

    if records:
        contact_id = str(records[0].get("id", ""))
        logger.info("STEPLOG START update_contact")
        # FIX: id must be embedded inside the data record
        upd = await zoho_crm_exec("ZOHO_UPDATE_ZOHO_RECORD", {
            "module_api_name": "Contacts",
            "data": [{**fields, "id": contact_id}],
        })
        upd_records = upd.get("data", [])
        if upd_records and upd_records[0].get("status") == "success":
            return CrmSyncResponse(success=True, action="updated",
                zohoContactId=str(upd_records[0].get("details", {}).get("id", contact_id)),
                email=request.email, steps=["Found existing", f"Updated {contact_id}"])
        raise RuntimeError(f"Update failed: {upd_records}")

    logger.info("STEPLOG START create_contact")
    crt = await zoho_crm_exec("ZOHO_CREATE_ZOHO_RECORD", {
        "module_api_name": "Contacts", "data": [fields],
    })
    crt_records = crt.get("data", [])
    if crt_records and crt_records[0].get("status") == "success":
        new_id = str(crt_records[0].get("details", {}).get("id", ""))
        return CrmSyncResponse(success=True, action="created",
            zohoContactId=new_id, email=request.email,
            steps=["No existing contact", f"Created {new_id}"])
    raise RuntimeError(f"Create failed: {crt_records}")

if __name__ == "__main__":
    run_service(app)
