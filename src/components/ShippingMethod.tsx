// src/components/ShippingMethod.tsx
import React, { useEffect, useMemo, useState } from 'react';

export type ShipLogicRate = {
  rate_id: string;
  carrier: string;
  service: string;
  price: number;
  currency?: string;
  eta?: string;
  // any other fields returned by ShipLogic
  [k: string]: any;
};

export type BobGoPickupPoint = {
  id: string;
  name: string;
  address?: string;
  lat?: number | string;
  lng?: number | string;
  // any other fields
  [k: string]: any;
};

type Props = {
  /** Pre-fetched rates (optional). If not provided, component will fetch from /api/shipping/rates */
  initialRates?: ShipLogicRate[] | null;
  /** Pre-fetched pickup points (optional). If not provided, component will fetch from /api/shipping/pickup-points */
  initialPickupPoints?: BobGoPickupPoint[] | null;
  /** Selected rate id (controlled) */
  selectedRateId?: string | null;
  /** Selected pickup point id (controlled) */
  selectedPickupPointId?: string | null;
  /** Called when user selects a rate */
  onSelectRate?: (rate: ShipLogicRate) => void;
  /** Called when user selects a pickup point */
  onSelectPickupPoint?: (point: BobGoPickupPoint) => void;
  /** Optional query params used when fetching from the API */
  fetchParams?: { to?: string; from?: string; weight?: string; lat?: string; lng?: string; radius?: string };
  /** Toggle automatic fetching if initial props are not provided */
  autoFetch?: boolean;
};

export default function ShippingMethod({
  initialRates = null,
  initialPickupPoints = null,
  selectedRateId = null,
  selectedPickupPointId = null,
  onSelectRate,
  onSelectPickupPoint,
  fetchParams = {},
  autoFetch = true,
}: Props) {
  const [rates, setRates] = useState<ShipLogicRate[] | null>(initialRates);
  const [pickupPoints, setPickupPoints] = useState<BobGoPickupPoint[] | null>(initialPickupPoints);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : '';

  const ratesUrl = useMemo(() => {
    if (!apiBase) return '';
    const params = new URLSearchParams();
    if (fetchParams.to) params.set('to', fetchParams.to);
    if (fetchParams.from) params.set('from', fetchParams.from);
    if (fetchParams.weight) params.set('weight', fetchParams.weight);
    return `${apiBase.replace(/\/$/, '')}/api/shipping/rates?${params.toString()}`;
  }, [apiBase, fetchParams.to, fetchParams.from, fetchParams.weight]);

  const pointsUrl = useMemo(() => {
    if (!apiBase) return '';
    const params = new URLSearchParams();
    if (fetchParams.lat) params.set('lat', fetchParams.lat);
    if (fetchParams.lng) params.set('lng', fetchParams.lng);
    if (fetchParams.radius) params.set('radius', fetchParams.radius);
    return `${apiBase.replace(/\/$/, '')}/api/shipping/pickup-points?${params.toString()}`;
  }, [apiBase, fetchParams.lat, fetchParams.lng, fetchParams.radius]);

  useEffect(() => {
    if (!autoFetch) return;

    if (!rates && ratesUrl) {
      setLoadingRates(true);
      fetch(ratesUrl)
        .then(async (r) => {
          if (!r.ok) throw new Error(`Rates fetch failed: ${r.status}`);
          const json = await r.json();
          // Expecting { success: true, rates: [...] } or raw array
          const data = json?.rates ?? json;
          setRates(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Rates fetch error', err);
          setError(String(err?.message ?? err));
        })
        .finally(() => setLoadingRates(false));
    }

    if (!pickupPoints && pointsUrl) {
      setLoadingPoints(true);
      fetch(pointsUrl)
        .then(async (r) => {
          if (!r.ok) throw new Error(`Pickup points fetch failed: ${r.status}`);
          const json = await r.json();
          const data = json?.points ?? json;
          setPickupPoints(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Pickup points fetch error', err);
          setError(String(err?.message ?? err));
        })
        .finally(() => setLoadingPoints(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, ratesUrl, pointsUrl]);

  function handleSelectRate(rate: ShipLogicRate) {
    if (onSelectRate) onSelectRate(rate);
    else setRates((prev) =>
      prev ? prev.map((r) => ({ ...r })) : prev
    );
  }

  function handleSelectPickup(point: BobGoPickupPoint) {
    if (onSelectPickupPoint) onSelectPickupPoint(point);
    else setPickupPoints((prev) =>
      prev ? prev.map((p) => ({ ...p })) : prev
    );
  }

  return (
    <div className="shipping-method-root" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h3>Shipping options</h3>

      {error && (
        <div style={{ color: 'crimson', marginBottom: 8 }}>
          Error: {error}
        </div>
      )}

      <section style={{ marginBottom: 16 }}>
        <h4>Rates</h4>
        {loadingRates && <div>Loading rates…</div>}
        {!loadingRates && (!rates || rates.length === 0) && <div>No rates available</div>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rates?.map((rate) => {
            const isSelected = selectedRateId === rate.rate_id;
            return (
              <li
                key={rate.rate_id}
                style={{
                  border: isSelected ? '2px solid #0070f3' : '1px solid #ddd',
                  padding: 8,
                  marginBottom: 8,
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{rate.carrier} — {rate.service}</div>
                  <div style={{ color: '#555' }}>{rate.currency ?? 'ZAR'} {rate.price}</div>
                  {rate.eta && <div style={{ color: '#666', fontSize: 12 }}>ETA: {rate.eta}</div>}
                </div>
                <div>
                  <button
                    onClick={() => handleSelectRate(rate)}
                    aria-pressed={isSelected}
                    style={{
                      background: isSelected ? '#0070f3' : '#fff',
                      color: isSelected ? '#fff' : '#0070f3',
                      border: '1px solid #0070f3',
                      padding: '6px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h4>Pickup points</h4>
        {loadingPoints && <div>Loading pickup points…</div>}
        {!loadingPoints && (!pickupPoints || pickupPoints.length === 0) && <div>No pickup points available</div>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pickupPoints?.map((point) => {
            const isSelected = selectedPickupPointId === point.id;
            return (
              <li
                key={point.id}
                style={{
                  border: isSelected ? '2px solid #0070f3' : '1px solid #ddd',
                  padding: 8,
                  marginBottom: 8,
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{point.name}</div>
                  {point.address && <div style={{ color: '#555' }}>{point.address}</div>}
                </div>
                <div>
                  <button
                    onClick={() => handleSelectPickup(point)}
                    aria-pressed={isSelected}
                    style={{
                      background: isSelected ? '#0070f3' : '#fff',
                      color: isSelected ? '#fff' : '#0070f3',
                      border: '1px solid #0070f3',
                      padding: '6px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
