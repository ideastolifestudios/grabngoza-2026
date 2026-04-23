import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReturnReason =
  | "wrong_item"
  | "damaged"
  | "not_as_described"
  | "changed_mind"
  | "sizing";

type ReturnItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variant?: string;
  returnQty: number;
};

type ReturnRequest = {
  orderId: string;
  userId: string;
  email: string;
  items: ReturnItem[];
  reason: ReturnReason;
  notes: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  refundAmount: number;
  createdAt: ReturnType<typeof serverTimestamp>;
};

// ── Reason labels ─────────────────────────────────────────────────────────────

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: "wrong_item",       label: "Wrong item received" },
  { value: "damaged",          label: "Item arrived damaged" },
  { value: "not_as_described", label: "Not as described" },
  { value: "sizing",           label: "Sizing issue" },
  { value: "changed_mind",     label: "Changed my mind" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isReturnable(order: any): boolean {
  const placed = order?.date?.toDate?.() ?? new Date(order?.date);
  const daysSince = (Date.now() - placed.getTime()) / 86_400_000;
  return daysSince <= 30 && ["completed", "ready"].includes(order?.status);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReturnRequestPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [order,     setOrder]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason,  setReason]  = useState<ReturnReason>("wrong_item");
  const [notes,   setNotes]   = useState("");

  // ── Fetch order ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "orders", orderId));
        if (!snap.exists()) { setError("Order not found."); return; }
        const data = snap.data();
        // Gate: only owner or admin
        if (data.userId !== user?.uid && data.email !== user?.email) {
          setError("You don't have access to this order."); return;
        }
        if (!isReturnable(data)) {
          setError("This order is not eligible for a return. Returns are accepted within 30 days of a completed order.");
          return;
        }
        setOrder({ id: snap.id, ...data });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, user]);

  // ── Item qty selector ────────────────────────────────────────────────────────
  function setItemQty(productId: string, qty: number) {
    setSelectedItems(prev =>
      qty === 0 ? (({ [productId]: _, ...rest }) => rest)(prev) : { ...prev, [productId]: qty }
    );
  }

  // ── Refund total ─────────────────────────────────────────────────────────────
  const refundAmount = order?.items?.reduce((sum: number, item: any) => {
    const qty = selectedItems[item.productId] ?? 0;
    return sum + item.price * qty;
  }, 0) ?? 0;

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!Object.keys(selectedItems).length) {
      setError("Select at least one item to return."); return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const returnItems: ReturnItem[] = order.items
        .filter((i: any) => selectedItems[i.productId])
        .map((i: any) => ({ ...i, returnQty: selectedItems[i.productId] }));

      const returnDoc: ReturnRequest = {
        orderId:      order.id,
        userId:       user!.uid,
        email:        order.email,
        items:        returnItems,
        reason,
        notes,
        status:       "pending",
        refundAmount,
        createdAt:    serverTimestamp(),
      };

      // Write return request
      await addDoc(collection(db, "returns"), returnDoc);

      // Update order status → returned
      await updateDoc(doc(db, "orders", order.id), { status: "returned" });

      // Notify — best-effort (non-blocking)
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:      order.email,
          subject: `Return request received — Order #${order.id}`,
          html: `
            <h2>We've received your return request</h2>
            <p>Hi ${order.firstName}, your return for order <strong>#${order.id}</strong>
            (R${refundAmount.toFixed(2)}) is under review.</p>
            <p>We'll get back to you within 2–3 business days.</p>
          `,
        }),
      }).catch(() => {});

      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#06402B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => navigate("/orders")}
          className="text-[#06402B] underline text-sm"
        >
          Back to orders
        </button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 bg-[#06402B] rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Return request submitted</h2>
        <p className="text-gray-500 text-sm">
          We'll review it and email you within 2–3 business days.
          Estimated refund: <strong>R{refundAmount.toFixed(2)}</strong>
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="mt-4 w-full bg-[#06402B] text-white py-3 rounded-xl font-medium"
        >
          Back to orders
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-xl mx-auto px-4 pt-8">

        {/* Header */}
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Return request</h1>
        <p className="text-sm text-gray-500 mb-8">Order #{order.id} · {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Item selector */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">Select items to return</p>
            </div>
            {order.items?.map((item: any) => (
              <div key={item.productId} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                  <p className="text-xs text-gray-500">R{item.price.toFixed(2)} × {item.quantity}</p>
                </div>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                  value={selectedItems[item.productId] ?? 0}
                  onChange={e => setItemQty(item.productId, parseInt(e.target.value))}
                >
                  {Array.from({ length: item.quantity + 1 }, (_, i) => (
                    <option key={i} value={i}>{i === 0 ? "None" : i}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Reason for return</p>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[#06402B]"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="notes">
              Additional notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tell us more about the issue..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#06402B]"
            />
          </div>

          {/* Refund preview */}
          {refundAmount > 0 && (
            <div className="bg-[#06402B]/5 border border-[#06402B]/20 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-[#06402B] font-medium">Estimated refund</span>
              <span className="text-lg font-semibold text-[#06402B]">R{refundAmount.toFixed(2)}</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || refundAmount === 0}
            className="w-full bg-[#06402B] text-white py-4 rounded-2xl font-medium text-sm
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : "Submit return request"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Returns accepted within 30 days of delivery. Refunds processed within 5–7 business days.
          </p>
        </form>
      </div>
    </div>
  );
}
