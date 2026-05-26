# Phase 3 — Zoho Campaigns + FSM API Reference
# Grab & Go eCommerce — Backend Integration Guide

## ZOHO CAMPAIGNS API
Base URL: https://campaigns.zoho.{dc}/api/v1.1
Auth:     Zoho-oauthtoken {access_token}   (same token as CRM/Inventory)
Scopes needed: ZohoCampaigns.emails.ALL, ZohoCampaigns.contacts.ALL

### Key Endpoints

#### 1. Add/Update Subscriber (add customer to mailing list)
POST /json/listsubscribe
Body (x-www-form-urlencoded):
  resfmt=JSON
  listkey={YOUR_LISTKEY}       <- get from Campaigns UI → Lists → click list
  contactinfo={"Contact Email":"customer@example.com","First Name":"Reba","Last Name":"Masie","Phone":"0768088390"}

Response: { "status": "success", "message": "Contact added" }

#### 2. List all mailing lists (get listkeys)
GET /json/getmailinglists?resfmt=JSON&range=200

#### 3. Send Transactional Email via Campaigns
POST /json/sendmail
Body (x-www-form-urlencoded):
  resfmt=JSON
  from_email=orders@grabandgo.co.za
  to_email=customer@example.com
  subject=Order Confirmed — #ORDERID
  content=<html>...</html>

#### 4. Trigger Email Campaign to Segment
POST /json/runinstantcampaign
Body: resfmt=JSON&campaignkey={key}&scheduledtime=now

#### 5. Automation — Add contact to workflow/trigger sequence
POST /json/addautoresponder
Body: resfmt=JSON&triggername={name}&resfmt=JSON&...

### Env Vars to add to Vercel:
  ZOHO_CAMPAIGNS_LIST_KEY=  <- from Zoho Campaigns dashboard
  # Uses same ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN

---

## ZOHO FSM API (Field Service Management)
Base URL: https://fsm.zoho.{dc}/api/v1
Auth:     Zoho-oauthtoken {access_token}
Scopes:   ZohoFSM.fullaccess.all

### Key Endpoints

#### 1. Create Service Appointment (e.g. delivery, setup, repair visit)
POST /serviceappointments
Body (JSON):
{
  "serviceappointment": {
    "Subject": "Delivery — Order #001N9BBY8",
    "ServiceTerritory": { "Name": "Johannesburg" },
    "EarliestStartTime": "2026-05-20T09:00:00",
    "DueDate": "2026-05-20T17:00:00",
    "Status": "Scheduled",
    "Description": "Grab & Go delivery",
    "ServiceAppointmentContact": { "Email": "customer@example.com" },
    "Address": {
      "Street": "1 Main Road",
      "City": "Sandton",
      "State": "Gauteng",
      "PostalCode": "2196",
      "Country": "South Africa"
    }
  }
}

Response: { "serviceappointment": { "Id": "SA-0001", ... } }

#### 2. List Service Appointments
GET /serviceappointments?page=1&per_page=20

#### 3. Update Appointment Status (e.g. mark as Dispatched)
PATCH /serviceappointments/{Id}
Body: { "serviceappointment": { "Status": "Dispatched" } }

#### 4. Create Work Order (for custom/repair jobs)
POST /workorders
Body: { "workorder": { "Subject": "...", "Status": "New", ... } }

#### 5. Assign Technician to Appointment
PUT /serviceappointments/{Id}/servicecrew
Body: { "servicecrew": [{ "ServiceResource": { "Name": "Tech Name" } }] }

#### 6. Get Real-Time Location of Field Agent (if FSM mobile app in use)
GET /servicecrew/{Id}/location

### Env Vars to add to Vercel:
  # Uses same ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN
  ZOHO_FSM_ORG_ID=  <- from FSM Settings → Company Details

---

## HOW TO GET YOUR ZOHO REFRESH TOKEN (one-time setup)
Run these steps in a browser or use the helper script below:

1. Go to: https://api-console.zoho.com
2. Click "Self Client" → Generate Code
3. Scopes to paste (all-in-one):
   ZohoInventory.contacts.ALL,ZohoInventory.items.ALL,ZohoInventory.salesorders.ALL,
   ZohoInventory.packages.ALL,ZohoInventory.invoices.ALL,ZohoInventory.settings.READ,
   ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,
   ZohoCampaigns.emails.ALL,ZohoCampaigns.contacts.ALL,
   ZohoFSM.fullaccess.all
4. Duration: 3 minutes
5. Copy the code → run curl below to exchange for refresh token

curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://www.zoho.com/crm/oauth_callback.html" \
  -d "code=YOUR_AUTH_CODE"

# Save the refresh_token from the response → add to Vercel as ZOHO_REFRESH_TOKEN
