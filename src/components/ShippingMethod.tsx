// src/components/ShippingMethod.tsx
// ─────────────────────────────────────────────────────────────────────────────
// DROP-IN REPLACEMENT for your existing ShippingMethod component.
//
// Props:
//   cartTotal        – number (ZAR), used to derive parcel value
//   cartWeightKg     – number, total order weight
//   deliveryAddress  – ShipLogicAddress (from checkout form)
//   onSelect         – (selection: SelectedShipping) => void
//   onCreateShipment – optional, called after payment to book with ShipLogic
//
// Flow:
//   1. On mount / deliveryAddress change → fetch rates via /api/shipping/rates
//   2. If domestic: show rate cards (standard + express options)
//   3. Tab "Bob Go Pickup": fetch nearby points, let user pick one, then show
//      rates filtered to Bob Go service levels
//   4. If delivery country ≠ ZA: show international rates + customs notice
//   5. Emits SelectedShipping up via onSelect whenever selection changes
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type {
  ShipLogicAddress,
  ShipLogicRate,
  BobGoPickupPoint,
  SelectedShipping,
  ShippingMode,
} from "../types/shipping";
import { useShippingRates, usePickupPoints } from "../hooks/useShipping";

// ── Your store's dispatch address (collection point) ─────────────────────────
// TODO: move to env / config
const STORE_ADDRESS: ShipLogicAddress = {
  type: "business",
  company: "Grab & Go",
  street_address: "YOUR STREET ADDRESS",   // ← fill in
  local_area: "YOUR SUBURB",               // ← fill in
  city: "YOUR CITY",                        // ← fill in
  code: "YOUR POSTAL CODE",                // ← fill in
  zone: "Gauteng",                          // ← fill in
  country: "ZA",
};

// ── Default parcel dimensions (clothing) ──────────────────────────────────────
// Adjust per your actual packaging
const PARCEL_DIMENSIONS = {
  submitted_length_cm: 35,
  submitted_width_cm: 25,
  submitted_height_cm: 5,
};

interface ShippingMethodProps {
  cartTotal: number;
  cartWeightKg: number;
  deliveryAddress: ShipLogicAddress;
  onSelect: (selection: SelectedShipping) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(amount: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function courierLogo(courierCode: string) {
  const logos: Record<string, string> = {
    bobgo: "🚲",
    dhl: "✈️",
    fastway: "⚡",
    aramex: "🌍",
    dawn_wing: "🌅",
  };
  return logos[courierCode?.toLowerCase()] ?? "📦";
}

// ── Sub-component: Rate Card ─────────────────────────────────────────────────
function RateCard({
  rate,
  selected,
  onSelect,
}: {
  rate: ShipLogicRate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-4 ${
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white hover:border-gray-400"
      }`}
    >
      <span className="text-2xl">{courierLogo(rate.courier?.code)}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {rate.service_level?.name ?? rate.courier?.name}
        </p>
        <p className={`text-xs mt-0.5 ${selected ? "text-gray-300" : "text-gray-500"}`}>
          {rate.transit_days != null
            ? `${rate.transit_days} business day${rate.transit_days !== 1 ? "s" : ""}`
            : rate.estimated_delivery_date
            ? `Est. ${new Date(rate.estimated_delivery_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`
            : "Estimated delivery varies"}
        </p>
      </div>
      <span className="font-bold text-sm shrink-0">
        {formatPrice(
          rate.price_breakdown?.total ?? 0,
          rate.price_breakdown?.currency ?? "ZAR"
        )}
      </span>
    </button>
  );
}

// ── Sub-component: Pickup Point Card ─────────────────────────────────────────
function PickupCard({
  point,
  selected,
  onSelect,
}: {
  point: BobGoPickupPoint;
  selected: boolean;
  onSelect: () => void;
}) {
  const typeLabel = point.type === "locker" ? "🔒 Locker" : "🏪 Counter";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white hover:border-gray-400"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{point.name}</p>
          <p className={`text-xs mt-0.5 truncate ${selected ? "text-gray-300" : "text-gray-500"}`}>
            {point.address}, {point.suburb}
          </p>
          {point.operating_hours && (
            <p className={`text-xs mt-1 ${selected ? "text-gray-400" : "text-gray-400"}`}>
              {point.operating_hours}
            </p>
          )}
        </div>
        <span className={`text-xs shrink-0 font-medium ${selected ? "text-gray-300" : "text-gray-500"}`}>
          {typeLabel}
        </span>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ShippingMethod({
  cartTotal,
  cartWeightKg,
  deliveryAddress,
  onSelect,
}: ShippingMethodProps) {
  const isInternational = deliveryAddress?.country && deliveryAddress.country !== "ZA";
  const defaultTab: ShippingMode = isInternational ? "international" : "domestic";

  const [activeTab, setActiveTab] = useState<ShippingMode>(defaultTab);
  const [selectedRate, setSelectedRate] = useState<ShipLogicRate | null>(null);
  const [selectedPickupPoint, setSelectedPickupPoint] =
    useState<BobGoPickupPoint | null>(null);

  const {
    rates: allRates,
    loading: ratesLoading,
    error: ratesError,
    fetchRates,
  } = useShippingRates();

  const {
    pickupPoints,
    loading: pickupLoading,
    error: pickupError,
    fetchPickupPoints,
  } = usePickupPoints();

  // ── Fetch rates whenever delivery address changes ──────────────────────────
  useEffect(() => {
    if (!deliveryAddress?.street_address) return;
    const parcel = {
      ...PARCEL_DIMENSIONS,
      submitted_weight_kg: Math.max(cartWeightKg, 0.1),
    };
    fetchRates({
      collection_address: STORE_ADDRESS,
      delivery_address: deliveryAddress,
      parcels: [parcel],
      declared_value: cartTotal,
    });
  }, [deliveryAddress, cartTotal, cartWeightKg, fetchRates]);

  // ── Fetch pickup points when switching to that tab ─────────────────────────
  useEffect(() => {
    if (activeTab === "bobgo_pickup") {
      fetchPickupPoints(deliveryAddress?.code, deliveryAddress?.city);
    }
  }, [activeTab, deliveryAddress, fetchPickupPoints]);

  // ── Filter rates by type ───────────────────────────────────────────────────
  const domesticRates = allRates.filter(
    (r) => !r.courier?.code?.toLowerCase().includes("dhl") && !r.service_level?.code?.toLowerCase().includes("intl")
  );

  const bobGoRates = allRates.filter(
    (r) =>
      r.courier?.code?.toLowerCase().includes("bobgo") ||
      r.service_level?.code?.toLowerCase().includes("bobgo") ||
      r.courier?.name?.toLowerCase().includes("bob go") ||
      r.courier?.name?.toLowerCase().includes("pudo")
  );

  // If no explicit Bob Go rates, allow any domestic rate for PUDO delivery
  const pickupRates = bobGoRates.length > 0 ? bobGoRates : domesticRates.slice(0, 2);

  const internationalRates = allRates.filter(
    (r) =>
      r.courier?.code?.toLowerCase().includes("dhl") ||
      r.service_level?.code?.toLowerCase().includes("intl") ||
      r.service_level?.code?.toLowerCase().includes("international")
  );

  // ── Emit selection upward ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedRate) return;
    onSelect({
      mode: activeTab,
      rate: selectedRate,
      pickup_point: activeTab === "bobgo_pickup" ? (selectedPickupPoint ?? undefined) : undefined,
    });
  }, [selectedRate, selectedPickupPoint, activeTab, onSelect]);

  // ── Reset rate when switching tabs ────────────────────────────────────────
  useEffect(() => {
    setSelectedRate(null);
    setSelectedPickupPoint(null);
  }, [activeTab]);

  // ── Tabs (only shown for domestic customers) ──────────────────────────────
  const tabs: { key: ShippingMode; label: string }[] = isInternational
    ? [{ key: "international", label: "✈️ International" }]
    : [
        { key: "domestic", label: "📦 Home Delivery" },
        { key: "bobgo_pickup", label: "🚲 Bob Go Pickup" },
      ];

  const renderRateList = (rates: ShipLogicRate[]) => {
    if (ratesLoading)
      return (
        <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
          Getting the best rates for you…
        </div>
      );
    if (ratesError)
      return (
        <div className="py-4 px-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {ratesError} — please try again or contact support.
        </div>
      );
    if (!rates.length)
      return (
        <div className="py-6 text-center text-gray-400 text-sm">
          No shipping options available for this address.
        </div>
      );
    return (
      <div className="flex flex-col gap-3">
        {rates.map((rate) => (
          <RateCard
            key={rate.rate_id}
            rate={rate}
            selected={selectedRate?.rate_id === rate.rate_id}
            onSelect={() => setSelectedRate(rate)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="shipping-method">
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Domestic: standard rate cards ───────────────────────────────── */}
      {activeTab === "domestic" && renderRateList(domesticRates)}

      {/* ── International ────────────────────────────────────────────────── */}
      {activeTab === "international" && (
        <div>
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
            <strong>Customs & duties:</strong> International orders may be
            subject to import taxes in the destination country. These are the
            buyer's responsibility. We ship DDU (Delivered Duty Unpaid) by
            default unless otherwise agreed.
          </div>
          {renderRateList(internationalRates.length ? internationalRates : domesticRates)}
        </div>
      )}

      {/* ── Bob Go Pickup ─────────────────────────────────────────────────── */}
      {activeTab === "bobgo_pickup" && (
        <div className="flex flex-col gap-5">
          {/* 1. Choose a pickup point */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              1. Choose a pickup point near you
            </p>
            {pickupLoading && (
              <div className="py-6 text-center text-gray-400 text-sm animate-pulse">
                Finding nearby pickup points…
              </div>
            )}
            {pickupError && (
              <div className="py-4 px-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {pickupError}
              </div>
            )}
            {!pickupLoading && !pickupError && (
              <div className="flex flex-col gap-3">
                {pickupPoints.map((point) => (
                  <PickupCard
                    key={point.id}
                    point={point}
                    selected={selectedPickupPoint?.id === point.id}
                    onSelect={() => setSelectedPickupPoint(point)}
                  />
                ))}
                {pickupPoints.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No pickup points found near {deliveryAddress?.city ?? "your area"}.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Choose shipping speed (only after a point is selected) */}
          {selectedPickupPoint && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                2. Choose delivery speed to pickup point
              </p>
              {renderRateList(pickupRates)}
            </div>
          )}
        </div>
      )}

      {/* ── Selected summary ─────────────────────────────────────────────── */}
      {selectedRate && (
        <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Selected shipping</p>
            <p className="text-sm font-semibold">
              {selectedRate.service_level?.name ?? selectedRate.courier?.name}
              {selectedPickupPoint ? ` → ${selectedPickupPoint.name}` : ""}
            </p>
          </div>
          <span className="font-bold text-sm">
            {formatPrice(
              selectedRate.price_breakdown?.total ?? 0,
              selectedRate.price_breakdown?.currency ?? "ZAR"
            )}
          </span>
        </div>
      )}
    </div>
  );
}
