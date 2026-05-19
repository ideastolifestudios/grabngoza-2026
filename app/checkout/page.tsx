"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Lock } from "lucide-react";
import Link from "next/link";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import { useCart } from "@/context/CartContext";
import { useYoco } from "@/hooks/useYoco";

type FormData = {
  firstName: string; lastName: string; email: string; phone: string;
  line1: string; line2: string; city: string; province: string; postalCode: string;
};

const EMPTY_FORM: FormData = {
  firstName: "", lastName: "", email: "", phone: "",
  line1: "", line2: "", city: "", province: "", postalCode: "",
};

const SHIPPING_THRESHOLD = 1000;

function validate(data: FormData): Partial<Record<keyof FormData, string>> {
  const errors: Partial<Record<keyof FormData, string>> = {};
  if (!data.firstName.trim()) errors.firstName = "Required";
  if (!data.lastName.trim()) errors.lastName = "Required";
  if (!data.email.includes("@")) errors.email = "Valid email required";
  if (data.phone.length < 10) errors.phone = "Valid phone required";
  if (!data.line1.trim()) errors.line1 = "Required";
  if (!data.city.trim()) errors.city = "Required";
  if (!data.province) errors.province = "Select a province";
  if (!/^\d{4}$/.test(data.postalCode)) errors.postalCode = "4-digit code";
  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, persistCartForRecovery } = useCart();
  const { ready, loading: yocoLoading, error: yocoError, initiatePayment } = useYoco();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const shippingCost = totalPrice >= SHIPPING_THRESHOLD ? 0 : 80;
  const orderTotal = totalPrice + shippingCost;

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      // Persist cart for abandoned cart recovery
      await persistCartForRecovery(form.email);

      // Initiate Yoco payment popup
      const token = await initiatePayment(
        orderTotal * 100, // ZAR to cents
        `Grab & Go Order — ${items.length} item${items.length !== 1 ? "s" : ""}`
      );

      // Call our API route to charge + create order
      const cartId = typeof window !== "undefined"
        ? localStorage.getItem("grabngoza_cart_id") || ""
        : "";

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cart-id": cartId },
        body: JSON.stringify({
          token,
          amountInCents: orderTotal * 100,
          customerEmail: form.email,
          customerName: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          shippingAddress: {
            firstName: form.firstName, lastName: form.lastName,
            line1: form.line1, line2: form.line2,
            city: form.city, province: form.province,
            postalCode: form.postalCode, country: "ZA",
          },
          items: items.map((i) => ({
            productId: i.product.id, productName: i.product.name,
            productImage: i.product.image, price: i.product.price,
            size: i.size, quantity: i.quantity,
          })),
          shippingCost,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      clearCart();
      router.push(`/order-confirmation/${data.orderId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg !== "Payment was cancelled") setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={48} className="text-brand-muted mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold uppercase mb-3">Your cart is empty</h1>
        <Link href="/collections/all" className="bg-brand-primary text-white text-[11px] tracking-[0.18em] uppercase font-bold px-8 py-4 inline-block hover:bg-brand-accent transition-colors">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-14">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 mb-6 w-fit">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" rx="4" fill="#104431" fillOpacity="0.1"/><path d="M10 12h2l2.5 10h7l2.5-10H26" stroke="#104431" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 8c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#104431" strokeWidth="1.5" strokeLinecap="round"/><circle cx="15" cy="26" r="1.5" fill="#104431"/><circle cx="23" cy="26" r="1.5" fill="#104431"/></svg>
          <span className="text-brand-primary font-extrabold text-sm tracking-widest uppercase">Grab &amp; Go</span>
        </Link>
        <h1 className="text-[32px] font-extrabold uppercase tracking-tight text-brand-text">Checkout</h1>
        <p className="text-brand-muted text-sm mt-1">All prices in South African Rand (ZAR)</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          {/* Left — Form */}
          <div className="space-y-8">
            <CheckoutForm data={form} onChange={handleFieldChange} errors={errors} />

            {/* Error */}
            {(apiError || yocoError) && (
              <div className="bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-red-700 text-sm font-medium">{apiError || yocoError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || yocoLoading || !ready}
              className="w-full flex items-center justify-center gap-3 bg-brand-accent text-white text-[12px] tracking-[0.2em] uppercase font-bold py-5 hover:bg-brand-primary transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Lock size={14} />
              {submitting || yocoLoading
                ? "Processing..."
                : !ready
                ? "Loading payment system..."
                : `Pay Securely — R${orderTotal.toLocaleString("en-ZA")}`}
            </button>

            <p className="text-center text-[10px] text-brand-muted tracking-wide">
              By placing your order you agree to our{" "}
              <Link href="/legal#terms" className="underline hover:text-brand-primary">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/legal#privacy" className="underline hover:text-brand-primary">Privacy Policy</Link>.
            </p>
          </div>

          {/* Right — Order summary */}
          <OrderSummary items={items} totalPrice={totalPrice} />
        </div>
      </form>
    </div>
  );
}