import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from '../firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReturnStatus = "pending" | "approved" | "rejected" | "refunded";

export type ReturnItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variant?: string;
  returnQty: number;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  userId: string;
  email: string;
  items: ReturnItem[];
  reason: string;
  notes?: string;
  status: ReturnStatus;
  refundAmount: number;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  adminNotes?: string;
};

// ── Customer queries ──────────────────────────────────────────────────────────

/** All returns for a given user */
export async function getReturnsByUser(userId: string): Promise<ReturnRequest[]> {
  const q = query(
    collection(db, "returns"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
}

/** Single return by id (used in order detail) */
export async function getReturn(returnId: string): Promise<ReturnRequest | null> {
  const snap = await getDoc(doc(db, "returns", returnId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ReturnRequest) : null;
}

/** Return linked to a specific order */
export async function getReturnByOrder(orderId: string): Promise<ReturnRequest | null> {
  const q = query(collection(db, "returns"), where("orderId", "==", orderId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ReturnRequest;
}

// ── Admin queries ─────────────────────────────────────────────────────────────

/** All pending returns — admin dashboard */
export async function getPendingReturns(): Promise<ReturnRequest[]> {
  const q = query(
    collection(db, "returns"),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
}

/** All returns (any status) — admin full list */
export async function getAllReturns(): Promise<ReturnRequest[]> {
  const q = query(collection(db, "returns"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
}

// ── Admin actions ─────────────────────────────────────────────────────────────

/** Approve a return — marks return + order */
export async function approveReturn(returnId: string, orderId: string, adminNotes?: string) {
  await updateDoc(doc(db, "returns", returnId), {
    status:     "approved",
    adminNotes: adminNotes ?? "",
    resolvedAt: Timestamp.now(),
  });
  await updateDoc(doc(db, "orders", orderId), { status: "returned" });
}

/** Reject a return */
export async function rejectReturn(returnId: string, adminNotes?: string) {
  await updateDoc(doc(db, "returns", returnId), {
    status:     "rejected",
    adminNotes: adminNotes ?? "",
    resolvedAt: Timestamp.now(),
  });
}

/** Mark a return as refunded (after manual payment) */
export async function markRefunded(returnId: string) {
  await updateDoc(doc(db, "returns", returnId), {
    status:     "refunded",
    resolvedAt: Timestamp.now(),
  });
}

// ── Eligibility check (mirrors server-side rule) ─────────────────────────────

export function isOrderReturnable(order: any): boolean {
  if (!["completed", "ready"].includes(order?.status)) return false;
  const placed = order?.date?.toDate?.() ?? new Date(order?.date);
  const daysSince = (Date.now() - placed.getTime()) / 86_400_000;
  return daysSince <= 30;
}

// ── Status display helpers ────────────────────────────────────────────────────

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending:  "Under review",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded",
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  pending:  "bg-yellow-50 text-yellow-700",
  approved: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
  refunded: "bg-green-50 text-green-700",
};
