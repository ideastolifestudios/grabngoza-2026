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
from datetime import date
from typing import Optional

from composio import Composio
from codewords_client import logger, run_service
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="Grab & Go → Zoho Inventory Sync",
    description="Syncs paid eCommerce orders to Zoho Inventory as sales orders.",
    version="1.0.0",
)

_composio_client = None

def get_composio() -> Composio:
    global _composio_client
    if _composio_client is None:
        _composio_client = Composio()
    return _composio_client

async def zoho_exec(slug: str, arguments: dict) -> dict:
    """Execute a Zoho Inventory tool via Composio and return data."""
    result = await asyncio.to_thread(
        get_composio().tools.execute,
        slug=slug,
        arguments=arguments,
        dangerously_skip_version_check=True,
    )
    if not result.get("successful"):
        raise RuntimeError(f"Zoho {slug} failed: {result.get('error', 'Unknown error')}")
    return result.get("data", {})

class OrderItem(BaseModel):
    name: str
    price: float
    quantity: int = 1
    sku: Optional[str] = None
    selectedVariants: Optional[dict] = None

class OrderAddress(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postalCode: Optional[str] = None
    country: str = "South Africa"

class OrderInput(BaseModel):
    orderId: str
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    items: list[OrderItem]
    total: float
    shippingCost: float = 0
    shippingAddress: Optional[OrderAddress] = None
    deliveryMethod: Optional[str] = None
    trackingNumber: Optional[str] = None

class SyncResponse(BaseModel):
    success: bool
    orderId: str
    zohoCustomerId: Optional[str] = None
    zohoSalesOrderId: Optional[str] = None
    zohoItemsCreated: int = 0
    steps: list[str] = []
    errors: list[str] = []

async def find_or_create_zoho_contact(first_name, last_name, email, phone):
    contacts_data = await zoho_exec("ZOHO_INVENTORY_LIST_CONTACTS", {"per_page": 200})
    contacts = contacts_data.get("contacts", [])
    full_name = f"{first_name} {last_name}".lower()
    for c in contacts:
        ce = c.get("email", "").lower()
        cn = c.get("contact_name", "").lower()
        if (ce and ce == email.lower()) or cn == full_name:
            return str(c["contact_id"])
    result = await zoho_exec("ZOHO_INVENTORY_CREATE_CONTACT", {
        "contact_name": f"{first_name} {last_name}",
        "contact_type": "customer",
        "contact_persons": [{"first_name": first_name, "last_name": last_name,
                              "email": email, "phone": phone or "", "is_primary_contact": True}],
    })
    return str(result.get("contact", {}).get("contact_id", ""))

async def find_or_create_zoho_item(item: OrderItem):
    data = await zoho_exec("ZOHO_INVENTORY_LIST_ITEMS", {"per_page": 200})
    for zi in data.get("items", []):
        if item.sku and zi.get("sku", "").lower() == item.sku.lower():
            return str(zi["item_id"])
        if zi.get("name", "").lower() == item.name.lower():
            return str(zi["item_id"])
    args = {"name": item.name, "rate": item.price, "item_type": "inventory",
            "product_type": "goods", "unit": "pcs"}
    if item.sku:
        args["sku"] = item.sku
    result = await zoho_exec("ZOHO_INVENTORY_CREATE_ITEM", args)
    return str(result.get("item", {}).get("item_id", ""))

async def create_zoho_sales_order(customer_id, order, item_id_map):
    line_items = [{"item_id": item_id_map[i.name], "quantity": i.quantity, "rate": i.price}
                  for i in order.items if item_id_map.get(i.name)]
    if not line_items:
        raise RuntimeError("No valid line items for sales order")
    so_args = {
        "customer_id": customer_id, "line_items": line_items,
        "reference_number": order.orderId[:20],
        "date": date.today().isoformat(),
        "notes": f"Grab & Go order {order.orderId}",
    }
    if order.shippingCost > 0:
        so_args["shipping_charge"] = order.shippingCost
    if order.shippingAddress:
        a = order.shippingAddress
        so_args["shipping_address"] = {"address": a.address or "", "city": a.city or "",
                                        "state": a.province or "", "zip": a.postalCode or "",
                                        "country": a.country}
    result = await zoho_exec("ZOHO_INVENTORY_CREATE_SALES_ORDER", so_args)
    return str(result.get("salesorder", {}).get("salesorder_id", ""))

@app.post("/", response_model=SyncResponse)
async def sync_order_to_zoho(request: OrderInput) -> SyncResponse:
    """Sync a paid Grab & Go order to Zoho Inventory."""
    logger.info("STEPLOG START sync_contact")
    resp = SyncResponse(success=False, orderId=request.orderId)
    cid = await find_or_create_zoho_contact(request.firstName, request.lastName, request.email, request.phone)
    resp.zohoCustomerId = cid
    resp.steps.append(f"Contact: {cid}")

    logger.info("STEPLOG START sync_items")
    item_id_map: dict[str, str] = {}
    for item in request.items:
        try:
            item_id_map[item.name] = await find_or_create_zoho_item(item)
            resp.zohoItemsCreated += 1
        except RuntimeError as e:
            resp.errors.append(f"Item '{item.name}': {e}")
    resp.steps.append(f"Items: {len(item_id_map)}/{len(request.items)}")

    logger.info("STEPLOG START create_sales_order")
    so_id = await create_zoho_sales_order(cid, request, item_id_map)
    resp.zohoSalesOrderId = so_id
    resp.steps.append(f"SO: {so_id}")
    resp.success = True
    return resp

if __name__ == "__main__":
    run_service(app)
