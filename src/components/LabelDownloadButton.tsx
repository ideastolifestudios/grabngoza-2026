import React, { useState } from "react";
import { Download, Loader2, AlertCircle, Package } from "lucide-react";
import { Order } from "../types";

const LabelDownloadButton = ({ order }: { order: Order }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    setStatus('loading');
    setErrorMsg(null);

    // If we already have a direct label URL stored, open it immediately
    const directUrl = (order as any).labelUrl || (order as any).waybillUrl || (order as any).waybill_url;
    if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
      window.open(directUrl, '_blank');
      setStatus('idle');
      return;
    }

    const shipmentId = (order as any).shipmentId || (order as any).bobgoShipmentId;
    if (!shipmentId) {
      setErrorMsg('No shipment ID on this order — dispatch it first to generate a label.');
      setStatus('error');
      return;
    }

    const MAX_ATTEMPTS = 6;
    const DELAY_MS = 5000; // 5s between attempts — ShipLogic label generation is async
    const labelEndpoint = `/api/shipping?action=label&shipmentId=${shipmentId}`;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(labelEndpoint);

        if (res.status === 202) {
          // Server says label not ready yet — wait and retry
          if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, DELAY_MS));
          continue;
        }

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/pdf') || contentType.includes('application/octet')) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `label-${shipmentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setStatus('idle');
            return;
          } else {
            const data = await res.json();
            if (data.url || data.labelUrl) {
              window.open(data.url || data.labelUrl, '_blank');
              setStatus('idle');
              return;
            }
          }
        }
        // Non-ok, non-202 — wait and retry
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      } catch {
        if (attempt === MAX_ATTEMPTS) break;
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    setErrorMsg('Label not ready yet — shipment may still be processing. Try again in a minute.');
    setStatus('error');
  };

  return (
    <div className="w-full space-y-1">
      <button
        onClick={handleDownload}
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-black text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-wait"
      >
        {status === 'loading' ? (
          <><Loader2 size={12} className="animate-spin" /> Generating Label...</>
        ) : (
          <><Package size={12} /> Download Shipping Label</>
        )}
      </button>
      {status === 'error' && errorMsg && (
        <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest text-center leading-tight">{errorMsg}</p>
      )}
    </div>
  );
};
export default LabelDownloadButton;
