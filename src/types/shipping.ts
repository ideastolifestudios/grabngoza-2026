// ─── ShipLogic Shared Types ───────────────────────────────────────────────────
// Used across: API routes, ShippingMethod component, checkout flow

export type ShippingCountry = "ZA" | string; // ZA = domestic, other = international

// ── Address ──────────────────────────────────────────────────────────────────
export interface ShipLogicAddress {
  type: "residential" | "business";
  company?: string;
  street_address: string;
  local_area: string;
  city: string;
  code: string;               // Postal code
  zone?: string;              // Province / state
  country: ShippingCountry;
  lat?: number;
  lng?: number;
}

// ── Parcel ───────────────────────────────────────────────────────────────────
export interface ShipLogicParcel {
  submitted_length_cm: number;
  submitted_width_cm: number;
  submitted_height_cm: number;
  submitted_weight_kg: number;
}

// ── Rate Request ─────────────────────────────────────────────────────────────
export interface ShipLogicRateRequest {
  collection_address: ShipLogicAddress;
  delivery_address: ShipLogicAddress;
  parcels: ShipLogicParcel[];
  declared_value?: number;
}

// ── Rate Response ─────────────────────────────────────────────────────────────
export interface ShipLogicRate {
  rate_id: string;
  service_level: {
    code: string;
    name: string;
    description?: string;
  };
  courier: {
    code: string;
    name: string;
    logo_url?: string;
  };
  price_breakdown: {
    base_rate: number;
    fuel_surcharge: number;
    insurance?: number;
    total: number;
    currency: string;
  };
  estimated_delivery_date: string | null;
  transit_days: number | null;
}

export interface ShipLogicRateResponse {
  rates: ShipLogicRate[];
}

// ── Bob Go Pickup Point ────────────────────────────────────────────────────────
export interface BobGoPickupPoint {
  id: string;
  name: string;
  address: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  lat: number;
  lng: number;
  operating_hours?: string;
  type: "locker" | "counter" | "pudo";
}

export interface BobGoPickupPointsResponse {
  pickup_points: BobGoPickupPoint[];
}

// ── Shipment Create ───────────────────────────────────────────────────────────
export interface ShipLogicContact {
  name: string;
  mobile_number: string;
  email: string;
}

export interface ShipLogicShipmentRequest {
  collection_address: ShipLogicAddress;
  delivery_address: ShipLogicAddress;
  collection_contact: ShipLogicContact;
  delivery_contact: ShipLogicContact;
  parcels: ShipLogicParcel[];
  service_level_code: string;   // from selected rate
  declared_value?: number;
  special_instructions_collection?: string;
  special_instructions_delivery?: string;
  // International only
  customs?: ShipLogicCustoms;
}

// ── Customs (International) ──────────────────────────────────────────────────
export interface ShipLogicCustomsItem {
  description: string;
  hs_code?: string;
  quantity: number;
  value: number;            // per unit, ZAR
  weight_kg: number;
  origin_country: string;  // ISO 2-letter e.g. "ZA"
}

export interface ShipLogicCustoms {
  description: string;
  incoterm: "DDU" | "DDP";
  contents_type: "gift" | "sale_of_goods" | "sample" | "return" | "other";
  items: ShipLogicCustomsItem[];
}

// ── Shipment Response ─────────────────────────────────────────────────────────
export interface ShipLogicShipmentResponse {
  id: string;
  tracking_reference: string;
  waybill_url?: string;
  status: string;
  collection_address: ShipLogicAddress;
  delivery_address: ShipLogicAddress;
}

// ── Checkout shipping state (used in React) ───────────────────────────────────
export type ShippingMode = "domestic" | "bobgo_pickup" | "international";

export interface SelectedShipping {
  mode: ShippingMode;
  rate: ShipLogicRate | null;
  pickup_point?: BobGoPickupPoint;   // only for bobgo_pickup mode
}
