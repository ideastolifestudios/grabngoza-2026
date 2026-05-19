"use client";
import { useId } from "react";

interface FormData {
  firstName: string; lastName: string; email: string; phone: string;
  line1: string; line2: string; city: string; province: string; postalCode: string;
}

interface Props {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const SA_PROVINCES = [
  "Eastern Cape","Free State","Gauteng","KwaZulu-Natal",
  "Limpopo","Mpumalanga","Northern Cape","North West","Western Cape",
];

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.2em] uppercase font-bold text-brand-text mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

const inputClass = (error?: string) =>
  `w-full border ${error ? "border-red-400" : "border-brand-border"} px-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary transition-colors duration-200 bg-white`;

export default function CheckoutForm({ data, onChange, errors }: Props) {
  const id = useId();

  return (
    <div className="space-y-6">
      {/* Contact */}
      <div>
        <h2 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-primary mb-4 pb-2 border-b border-brand-border">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required error={errors.firstName}>
            <input id={`${id}-firstName`} type="text" value={data.firstName} onChange={(e) => onChange("firstName", e.target.value)} placeholder="Sipho" className={inputClass(errors.firstName)} />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <input id={`${id}-lastName`} type="text" value={data.lastName} onChange={(e) => onChange("lastName", e.target.value)} placeholder="Ndlovu" className={inputClass(errors.lastName)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field label="Email" required error={errors.email}>
            <input id={`${id}-email`} type="email" value={data.email} onChange={(e) => onChange("email", e.target.value)} placeholder="sipho@email.com" className={inputClass(errors.email)} />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input id={`${id}-phone`} type="tel" value={data.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="071 234 5678" className={inputClass(errors.phone)} />
          </Field>
        </div>
      </div>

      {/* Shipping address */}
      <div>
        <h2 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-primary mb-4 pb-2 border-b border-brand-border">
          Shipping Address
        </h2>
        <div className="space-y-4">
          <Field label="Street Address" required error={errors.line1}>
            <input id={`${id}-line1`} type="text" value={data.line1} onChange={(e) => onChange("line1", e.target.value)} placeholder="123 Culture Street" className={inputClass(errors.line1)} />
          </Field>
          <Field label="Apartment / Unit (optional)" error={errors.line2}>
            <input id={`${id}-line2`} type="text" value={data.line2} onChange={(e) => onChange("line2", e.target.value)} placeholder="Apt 4B" className={inputClass()} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" required error={errors.city}>
              <input id={`${id}-city`} type="text" value={data.city} onChange={(e) => onChange("city", e.target.value)} placeholder="Johannesburg" className={inputClass(errors.city)} />
            </Field>
            <Field label="Postal Code" required error={errors.postalCode}>
              <input id={`${id}-postalCode`} type="text" value={data.postalCode} onChange={(e) => onChange("postalCode", e.target.value)} placeholder="2001" className={inputClass(errors.postalCode)} maxLength={4} />
            </Field>
          </div>
          <Field label="Province" required error={errors.province}>
            <select
              id={`${id}-province`}
              value={data.province}
              onChange={(e) => onChange("province", e.target.value)}
              className={`${inputClass(errors.province)} cursor-pointer appearance-none`}
              style={{ backgroundImage: "url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23104431' strokeWidth='1.5' fill='none'/%3E%3C/svg%3E")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
            >
              <option value="">Select province</option>
              {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </div>
  );
}