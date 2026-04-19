// api/shipping/create-shipment.ts
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/shipping/create-shipment
//
// Books the shipment with ShipLogic after checkout is confirmed.
//
// For Bob Go pickup point delivery: set delivery_address to the pickup point
// address and add special_instructions_delivery: "PUDO pickup: <point_name>"
//
// For international: include the `customs` field in the body.
// ─────────────────────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SHIPLOGIC_API_URL =
  process.env.SHIPLOGIC_BASE_URL || "https://api.shiplogic.com";
const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SHIPLOGIC_API_KEY) {
    return res.status(500).json({ error: "ShipLogic not configured" });
  }

  try {
    const { order, serviceLevel, parcelDetails, customs } = req.body;

    if (!order) {
      return res.status(400).json({ error: "Order required" });
    }

    // Calculate parcel from order items if not provided
    const parcel = parcelDetails || (() => {
      const totalWeight = (order.items || []).reduce(
        (sum: number, item: any) => {
          const weight = item.weight || 0.5;
          return sum + weight * (item.quantity || 1);
        },
        0
      );
      const totalItems = (order.items || []).reduce(
        (sum: number, item: any) => sum + (item.quantity || 1),
        0
      );
      return {
        submitted_length_cm: Math.min(10 + totalItems * 5, 60),
        submitted_width_cm: Math.min(10 + totalItems * 3, 40),
        submitted_height_cm: Math.min(5 + totalItems * 3, 30),
        submitted_weight_kg: Math.max(totalWeight, 0.5),
      };
    })();

    // International shipments require customs
    const isInternational =
      order.country && order.country !== "ZA";

    if (isInternational && !customs) {
      return res.status(400).json({
        error:
          "International shipments require a `customs` field with items, incoterm, and contents_type",
      });
    }

    const payload: Record<string, unknown> = {
      collection_address: {
        type: "business",
        company: "IDEAS TO LIFE STUDIOS",
        street_address: process.env.BUSINESS_ADDRESS || "1104 Tugela Street",
        local_area: process.env.BUSINESS_LOCAL_AREA || "Klipfontein View",
        city: process.env.BUSINESS_CITY || "Midrand",
        zone: process.env.BUSINESS_PROVINCE || "Gauteng",
        country: "ZA",
        code: process.env.BUSINESS_POSTAL_CODE || "1685",
      },
      delivery_address: {
        type: "residential",
        company: `${order.firstName} ${order.lastName}`,
        street_address: order.address,
        local_area: order.city,
        city: order.city,
        zone: order.province,
        country: order.country || "ZA",
        code: order.postalCode,
      },
      collection_contact: {
        name: "Ideas to Life Studios",
        mobile_number: process.env.BUSINESS_PHONE || "",
        email: process.env.BUSINESS_EMAIL || "",
      },
      delivery_contact: {
        name: `${order.firstName} ${order.lastName}`,
        mobile_number: order.phone || "",
        email: order.email || "",
      },
      parcels: [parcel],
      service_level_id: 184277,
      reference: `GNG-${order.id || Date.now()}`,
      declared_value: order.declaredValue ?? 0,
    };

    // Optional special instructions (used for Bob Go PUDO pickup points)
    if (req.body.special_instructions_collection) {
      payload.special_instructions_collection =
        req.body.special_instructions_collection;
    }
    if (req.body.special_instructions_delivery) {
      payload.special_instructions_delivery =
        req.body.special_instructions_delivery;
    }

    // Attach customs for international shipments
    if (isInternational) {
      payload.customs = customs;
    }

    const response = await fetch(`${SHIPLOGIC_API_URL}/shipments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SHIPLOGIC_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("ShipLogic non-JSON response:", responseText);
      return res
        .status(500)
        .json({ error: "ShipLogic error", details: responseText });
    }

    if (!response.ok) {
      console.error("ShipLogic shipment error:", JSON.stringify(data));
      return res
        .status(response.status)
        .json({ error: "Failed to create shipment", details: data });
    }

    console.log("ShipLogic raw response:", JSON.stringify(data));

    return res.status(200).json({
      success: true,
      shipmentId: data.id || data.shipment_id || null,
      trackingNumber:
        data.tracking_reference ||
        data.short_tracking_reference ||
        data.tracking_number ||
        null,
      trackingRef: data.custom_tracking_reference || data.reference || null,
      waybill_url: data.waybill_url ?? null,
      status: data.status,
      raw: data,
    });
  } catch (err: any) {
    console.error("Create shipment error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create shipment" });
  }
}