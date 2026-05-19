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
#   "ZOHO_FSM_ACCESS_TOKEN",
#   "ZOHO_FSM_REFRESH_TOKEN",
#   "ZOHO_CLIENT_ID",
#   "ZOHO_CLIENT_SECRET",
#   "ZOHO_FSM_REGION=com",
# ]
# ///

"""
Zoho FSM (Field Service Management) Integration Service
=========================================================
Manages work orders, appointments, technicians, and service requests
for Grab N\'Goza delivery/field operations.

Uses direct Zoho FSM REST API with OAuth 2.0 authentication.
Handles token refresh automatically.

API Docs: https://www.zoho.com/fsm/developer/help/api/

Supports:
- Work Orders: Create, update, list, get
- Appointments: Schedule, reschedule, cancel
- Service Requests: Create, update, list
- Technicians/Agents: List, get availability
"""

import os
import httpx
import structlog
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logger = structlog.get_logger()

# ─── Config ───

REGION = os.getenv("ZOHO_FSM_REGION", "com")
FSM_BASE_URL = f"https://fsm.zoho.{REGION}/fsm/v1"
ACCOUNTS_URL = f"https://accounts.zoho.{REGION}"

# In-memory token cache (refreshed automatically)
_token_cache: dict = {}


async def get_access_token() -> str:
    """Get valid access token, refreshing if needed."""
    if _token_cache.get("access_token"):
        return _token_cache["access_token"]

    # Try env var first
    token = os.getenv("ZOHO_FSM_ACCESS_TOKEN", "")
    if token:
        _token_cache["access_token"] = token
        return token

    # Refresh using refresh token
    return await refresh_access_token()


async def refresh_access_token() -> str:
    """Refresh the OAuth access token."""
    refresh_token = os.getenv("ZOHO_FSM_REFRESH_TOKEN", "")
    client_id = os.getenv("ZOHO_CLIENT_ID", "")
    client_secret = os.getenv("ZOHO_CLIENT_SECRET", "")

    if not all([refresh_token, client_id, client_secret]):
        raise HTTPException(status_code=500, detail="Missing Zoho OAuth credentials for FSM")

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
    logger.info("Zoho FSM token refreshed")
    return token


async def fsm_request(method: str, endpoint: str, json_body: dict | None = None, params: dict | None = None) -> dict:
    """Make authenticated request to Zoho FSM API."""
    token = await get_access_token()
    url = f"{FSM_BASE_URL}/{endpoint.lstrip('/')}"

    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method=method,
            url=url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=json_body,
            params=params,
            timeout=30.0,
        )

        # If 401, try refreshing token once
        if resp.status_code == 401:
            logger.warn("FSM token expired, refreshing...")
            _token_cache.clear()
            token = await refresh_access_token()
            resp = await client.request(
                method=method,
                url=url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=json_body,
                params=params,
                timeout=30.0,
            )

        resp.raise_for_status()
        return resp.json()


# ─── Pydantic Models ───

class CreateWorkOrderInput(BaseModel):
    subject: str = Field(..., description="Work order subject/title")
    description: str = Field("", description="Detailed description")
    priority: str = Field("Medium", description="Priority: Low, Medium, High, Urgent")
    scheduled_start: str | None = Field(None, description="ISO datetime for scheduled start")
    scheduled_end: str | None = Field(None, description="ISO datetime for scheduled end")
    contact_id: str | None = Field(None, description="Zoho CRM contact ID to link")
    custom_fields: dict = Field(default_factory=dict, description="Additional custom fields")

class UpdateWorkOrderInput(BaseModel):
    work_order_id: str = Field(..., description="Work order ID to update")
    status: str | None = Field(None, description="New status")
    priority: str | None = Field(None, description="New priority")
    description: str | None = Field(None, description="Updated description")
    custom_fields: dict = Field(default_factory=dict, description="Custom field updates")

class CreateAppointmentInput(BaseModel):
    work_order_id: str = Field(..., description="Work order ID to schedule")
    scheduled_start: str = Field(..., description="ISO datetime for appointment start")
    scheduled_end: str = Field(..., description="ISO datetime for appointment end")
    technician_id: str | None = Field(None, description="Assigned technician ID")
    notes: str = Field("", description="Appointment notes")

class CreateServiceRequestInput(BaseModel):
    subject: str = Field(..., description="Service request subject")
    description: str = Field("", description="Request description")
    contact_email: str | None = Field(None, description="Customer email")
    priority: str = Field("Medium", description="Priority level")

class ListParams(BaseModel):
    page: int = Field(1, description="Page number")
    per_page: int = Field(20, description="Records per page (max 200)")
    sort_by: str | None = Field(None, description="Field to sort by")
    sort_order: str = Field("desc", description="asc or desc")


# ─── FastAPI App ───

app = FastAPI(title="Zoho FSM Integration")


# ─── Work Orders ───

@app.post("/work-orders/create")
async def create_work_order(input_data: CreateWorkOrderInput):
    """Create a new work order in Zoho FSM."""
    logger.info("Creating work order", subject=input_data.subject)

    wo_data = {
        "Subject": input_data.subject,
        "Description": input_data.description,
        "Priority": input_data.priority,
    }

    if input_data.scheduled_start:
        wo_data["Scheduled_Start_Time"] = input_data.scheduled_start
    if input_data.scheduled_end:
        wo_data["Scheduled_End_Time"] = input_data.scheduled_end
    if input_data.contact_id:
        wo_data["Contact"] = {"id": input_data.contact_id}

    wo_data.update(input_data.custom_fields)

    result = await fsm_request("POST", "/Work_Orders", json_body={"data": [wo_data]})

    data = result.get("data", [])
    if data:
        wo = data[0]
        logger.info("Work order created", id=wo.get("id"), status=wo.get("status"))
        return {
            "success": True,
            "work_order_id": wo.get("id"),
            "details": wo.get("details", wo),
        }

    return {"success": False, "error": "No data returned", "raw": result}


@app.get("/work-orders")
async def list_work_orders(page: int = 1, per_page: int = 20):
    """List work orders from Zoho FSM."""
    logger.info("Listing work orders", page=page)

    result = await fsm_request(
        "GET", "/Work_Orders",
        params={"page": page, "per_page": per_page}
    )

    data = result.get("data", [])
    info = result.get("info", {})

    return {
        "success": True,
        "work_orders": data,
        "page": info.get("page", page),
        "total": info.get("count", len(data)),
        "has_more": info.get("more_records", False),
    }


@app.get("/work-orders/{work_order_id}")
async def get_work_order(work_order_id: str):
    """Get a specific work order by ID."""
    result = await fsm_request("GET", f"/Work_Orders/{work_order_id}")
    data = result.get("data", [])

    if data:
        return {"success": True, "work_order": data[0]}
    return {"success": False, "error": "Work order not found"}


@app.put("/work-orders/update")
async def update_work_order(input_data: UpdateWorkOrderInput):
    """Update an existing work order."""
    logger.info("Updating work order", id=input_data.work_order_id)

    update_data: dict = {}
    if input_data.status:
        update_data["Status"] = input_data.status
    if input_data.priority:
        update_data["Priority"] = input_data.priority
    if input_data.description:
        update_data["Description"] = input_data.description
    update_data.update(input_data.custom_fields)

    result = await fsm_request(
        "PUT", f"/Work_Orders/{input_data.work_order_id}",
        json_body={"data": [update_data]}
    )

    data = result.get("data", [])
    if data:
        return {"success": True, "work_order": data[0]}
    return {"success": False, "error": "Update failed", "raw": result}


# ─── Appointments ───

@app.post("/appointments/create")
async def create_appointment(input_data: CreateAppointmentInput):
    """Schedule a new appointment for a work order."""
    logger.info("Creating appointment", work_order=input_data.work_order_id)

    appt_data = {
        "Work_Order": {"id": input_data.work_order_id},
        "Scheduled_Start_Time": input_data.scheduled_start,
        "Scheduled_End_Time": input_data.scheduled_end,
    }

    if input_data.technician_id:
        appt_data["Technician"] = {"id": input_data.technician_id}
    if input_data.notes:
        appt_data["Description"] = input_data.notes

    result = await fsm_request("POST", "/Appointments", json_body={"data": [appt_data]})

    data = result.get("data", [])
    if data:
        appt = data[0]
        return {
            "success": True,
            "appointment_id": appt.get("id"),
            "details": appt.get("details", appt),
        }
    return {"success": False, "error": "No data returned", "raw": result}


@app.get("/appointments")
async def list_appointments(page: int = 1, per_page: int = 20):
    """List all appointments."""
    result = await fsm_request(
        "GET", "/Appointments",
        params={"page": page, "per_page": per_page}
    )

    return {
        "success": True,
        "appointments": result.get("data", []),
        "info": result.get("info", {}),
    }


# ─── Service Requests ───

@app.post("/service-requests/create")
async def create_service_request(input_data: CreateServiceRequestInput):
    """Create a new service request."""
    logger.info("Creating service request", subject=input_data.subject)

    sr_data = {
        "Subject": input_data.subject,
        "Description": input_data.description,
        "Priority": input_data.priority,
    }

    if input_data.contact_email:
        sr_data["Contact_Email"] = input_data.contact_email

    result = await fsm_request("POST", "/Service_Requests", json_body={"data": [sr_data]})

    data = result.get("data", [])
    if data:
        sr = data[0]
        return {
            "success": True,
            "service_request_id": sr.get("id"),
            "details": sr.get("details", sr),
        }
    return {"success": False, "error": "No data returned", "raw": result}


@app.get("/service-requests")
async def list_service_requests(page: int = 1, per_page: int = 20):
    """List service requests."""
    result = await fsm_request(
        "GET", "/Service_Requests",
        params={"page": page, "per_page": per_page}
    )

    return {
        "success": True,
        "service_requests": result.get("data", []),
        "info": result.get("info", {}),
    }


# ─── Technicians ───

@app.get("/technicians")
async def list_technicians(page: int = 1, per_page: int = 20):
    """List all technicians/field agents."""
    result = await fsm_request(
        "GET", "/Technicians",
        params={"page": page, "per_page": per_page}
    )

    return {
        "success": True,
        "technicians": result.get("data", []),
        "info": result.get("info", {}),
    }
