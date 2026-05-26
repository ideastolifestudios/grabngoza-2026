# Grab & Go Operations Standard Operating Procedure (SOP)

## 1. Daily Operations Flow
### Morning Readiness Check (08:00 - 09:00)
- **Checkout Integrity**: Perform a test "Quick Add" and navigate to checkout to ensure the UI and Yoco SDK load correctly.
- **Payment Gateway**: Check Yoco Dashboard for any service alerts.
- **Stock Sync**: Verify that "Exclusive Drops" stock levels reflect recent sales.
- **Support Inbox**: Review Help Desk submissions and social DMs.
- **System Health**: Check Sentry for any overnight frontend exceptions.

## 2. Order Fulfillment SOP
### Stage 1: Verification
- Confirm payment status in Yoco/Firestore.
- If EFT, verify funds in bank before marking as 'confirmed'.

### Stage 2: Processing
- Print picking list.
- Reserve stock in physical inventory.
- Inspect item for "Premium Quality" (no loose threads, clean packaging).

### Stage 3: Shipping
- Generate tracking via Bob Go / The Courier Guy.
- Update Order Status to 'shipped' in Admin Dashboard.
- Automated email with tracking link will be triggered to customer.

## 3. Customer Support SOP
### Response Timelines (SLA)
- **General Inquiry**: 24 Hours.
- **Damaged/Wrong Item**: 4 Hours (High Priority).
- **Refund Request**: 48 Hours.

### Canned Responses
- **Order Delay**: "We're perfecting your drop. Your order is currently being processed and will be with you shortly. Thank you for your patience."
- **Return Initiation**: "To maintain our premium standards, please ensure the item is in original condition. We've initiated your return request..."

## 4. Escalation Rules
- Technical issues (Checkouts failing) -> Senior Architect.
- Payment disputes -> Finance/Founder.
- Logistics failures (Lost parcels) -> Logistics Partner Lead.
