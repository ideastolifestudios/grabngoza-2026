import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { CartItem } from "@/context/CartContext";
import type { Address } from "./types";

export interface CreateOrderInput {
  items: CartItem[];
  customerEmail: string;
  customerName: string;
  phone: string;
  shippingAddress: Address;
  totalPrice: number;
  shippingCost: number;
  paymentReference: string;
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const orderRef = await addDoc(collection(db, "orders"), {
    items: input.items.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      productSlug: i.product.slug,
      productImage: i.product.image,
      price: i.product.price,
      size: i.size,
      quantity: i.quantity,
      lineTotal: i.product.price * i.quantity,
    })),
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    phone: input.phone,
    shippingAddress: input.shippingAddress,
    subtotal: input.totalPrice,
    shippingCost: input.shippingCost,
    total: input.totalPrice + input.shippingCost,
    paymentReference: input.paymentReference,
    status: "paid",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return orderRef.id;
}

export async function markCartConverted(cartId: string) {
  try {
    await updateDoc(doc(db, "carts", cartId), { converted: true, updatedAt: serverTimestamp() });
  } catch {}
}