// src/hooks/useShipping.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fetches ShipLogic rates and Bob Go pickup points.
// Import this in your ShippingMethod component.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import type {
  ShipLogicRateRequest,
  ShipLogicRate,
  BobGoPickupPoint,
  ShippingMode,
} from "../types/shipping";

// ── Rates ─────────────────────────────────────────────────────────────────────
interface UseRatesState {
  rates: ShipLogicRate[];
  loading: boolean;
  error: string | null;
}

export function useShippingRates() {
  const [state, setState] = useState<UseRatesState>({
    rates: [],
    loading: false,
    error: null,
  });

  const fetchRates = useCallback(async (payload: ShipLogicRateRequest) => {
    setState({ rates: [], loading: true, error: null });
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data: { rates: ShipLogicRate[] } = await res.json();

      // Sort cheapest first
      const sorted = [...(data.rates ?? [])].sort(
        (a, b) =>
          a.price_breakdown.total - b.price_breakdown.total
      );

      setState({ rates: sorted, loading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch rates";
      setState({ rates: [], loading: false, error: msg });
    }
  }, []);

  return { ...state, fetchRates };
}

// ── Pickup Points (Bob Go) ────────────────────────────────────────────────────
interface UsePickupPointsState {
  pickupPoints: BobGoPickupPoint[];
  loading: boolean;
  error: string | null;
}

export function usePickupPoints() {
  const [state, setState] = useState<UsePickupPointsState>({
    pickupPoints: [],
    loading: false,
    error: null,
  });

  const fetchPickupPoints = useCallback(
    async (postalCode?: string, city?: string) => {
      setState({ pickupPoints: [], loading: true, error: null });
      try {
        const params = new URLSearchParams();
        if (postalCode) params.set("postal_code", postalCode);
        if (city) params.set("city", city);

        const res = await fetch(
          `/api/shipping/pickup-points?${params.toString()}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: { pickup_points: BobGoPickupPoint[] } = await res.json();
        setState({
          pickupPoints: data.pickup_points ?? [],
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to fetch pickup points";
        setState({ pickupPoints: [], loading: false, error: msg });
      }
    },
    []
  );

  return { ...state, fetchPickupPoints };
}

// ── Detect shipping mode from delivery country ────────────────────────────────
export function getShippingMode(deliveryCountry: string): ShippingMode {
  if (deliveryCountry === "ZA") return "domestic";
  return "international";
}
