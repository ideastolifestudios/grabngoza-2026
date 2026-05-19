// src/utils/buildShipmentRequest.ts
// ─────────────────────────────────────────────────────────────────────────────
// Call this at the end of checkout (after payment succeeds) to create the
// actual shipment in ShipLogic via /api/shipping/create-shipment.
//
// Usage:
//   import { createShipment } from "../utils/buildShipmentRequest";
//   const result = await createShipment({ order, selectedShipping });
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ShipLogicAddress,
  ShipLogicShipmentRequest,
  ShipLogicShipmentResponse,
  SelectedShipping,
  ShipLogicCustomsItem,
} from "../types/shipping";

// Your store dispatch address — keep in sync with ShippingMethod.tsx
const STORE_ADDRESS: ShipLogicAddress = {
  type: "business",
  company: "Grab & Go",
  street_address: "YOUR STREET ADDRESS",  // ← fill in
  local_area: "YOUR SUBURB",              // ← fill in
  city: "YOUR CITY",                       // ← fill in
  code: "YOUR POSTAL CODE",               // ← fill in
  zone: "Gauteng",                         // ← fill in
  country: "ZA",
};

const STORE_CONTACT = {
  name: "Grab & Go Dispatch",
  mobile_number: "+27XXXXXXXXX",  // ← fill in
  email: "dispatch@grabngoza.co.za", // ← fill in
};

// ── Order shape expected from your checkout ───────────────────────────────────
export interface CheckoutOrder {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress: ShipLogicAddress;
  items: Array<{
    name: string;
    quantity: number;
    price: number;      // per unit ZAR
    weightKg: number;
  }>;
  totalValue: number;
  weightKg: number;
}

// ── Build the request payload ─────────────────────────────────────────────────
function buildPayload(
  order: CheckoutOrder,
  selectedShipping: SelectedShipping
): ShipLogicShipmentRequest {
  const isInternational = order.deliveryAddress.country !== "ZA";
  const isBobGo = selectedShipping.mode === "bobgo_pickup";
  const pickupPoint = selectedShipping.pickup_point;

  // For Bob Go pickup, the "delivery" address is the pickup point
  const deliveryAddress: ShipLogicAddress = isBobGo && pickupPoint
    ? {
        type: "business",
        company: pickupPoint.name,
        street_address: pickupPoint.address,
        local_area: pickupPoint.suburb,
        city: pickupPoint.city,
        code: pickupPoint.postal_code,
        zone: pickupPoint.province,
        country: "ZA",
      }
    : order.deliveryAddress;

  const parcel = {
    submitted_length_cm: 35,
    submitted_width_cm: 25,
    submitted_height_cm: 5,
    submitted_weight_kg: Math.max(order.weightKg, 0.1),
  };

  const base: ShipLogicShipmentRequest = {
    collection_address: STORE_ADDRESS,
    delivery_address: deliveryAddress,
    collection_contact: STORE_CONTACT,
    delivery_contact: {
      name: order.customer.name,
      mobile_number: order.customer.phone,
      email: order.customer.email,
    },
    parcels: [parcel],
    service_level_code: selectedShipping.rate!.service_level.code,
    declared_value: order.totalValue,
  };

  if (isBobGo && pickupPoint) {
    base.special_instructions_delivery =
      `PUDO pickup: ${pickupPoint.name}, ${pickupPoint.address}. ` +
      `Hours: ${pickupPoint.operating_hours ?? "See store"}`;
  }

  // International: add customs declaration
  if (isInternational) {
    const customsItems: ShipLogicCustomsItem[] = order.items.map((item) => ({
      description: item.name,
      quantity: item.quantity,
      value: item.price,
      weight_kg: item.weightKg,
      origin_country: "ZA",
    }));

    base.customs = {
      description: "Clothing / Fashion Apparel",
      incoterm: "DDU",
      contents_type: "sale_of_goods",
      items: customsItems,
    };
  }

  return base;
}

// ── Public function ───────────────────────────────────────────────────────────
export async function createShipment(
  order: CheckoutOrder,
  selectedShipping: SelectedShipping
): Promise<ShipLogicShipmentResponse> {
  if (!selectedShipping.rate) {
    throw new Error("No shipping rate selected");
  }

  const payload = buildPayload(order, selectedShipping);

  const res = await fetch("/api/shipping/create-shipment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<ShipLogicShipmentResponse>;
}
