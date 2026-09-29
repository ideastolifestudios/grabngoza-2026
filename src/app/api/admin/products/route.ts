import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Product, ProductStatus, BulkActionType } from "@/types/product";

/**
 * GET: Product Search & Filtering
 * Supports: ?search=... &category=... &status=... &tag=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const category = searchParams.get("category");
    const status = searchParams.get("status") as ProductStatus | null;
    const tag = searchParams.get("tag");

    let query: FirebaseFirestore.Query = adminDb.collection("products");

    if (category) query = query.where("category", "==", category);
    if (status) query = query.where("status", "==", status);
    if (tag) query = query.where("tags", "array-contains", tag);

    const snapshot = await query.get();
    let products = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Product)
    );

    // In-memory search filter for SKU or Name matching
    if (search) {
      products = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search) ||
          p.tags?.some((t) => t.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error: any) {
    console.error("[API/Admin/Products] GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Add New Product OR Duplicate Existing Product
 * Set body parameter `duplicateFromId` to clone an existing product.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { duplicateFromId, ...productData } = body;
    const now = new Date().toISOString();

    // Handle Product Duplication
    if (duplicateFromId) {
      const sourceDoc = await adminDb.collection("products").doc(duplicateFromId).get();
      if (!sourceDoc.exists) {
        return NextResponse.json({ error: "Source product not found for duplication" }, { status: 404 });
      }

      const sourceData = sourceDoc.data() as Product;
      const duplicatedProduct: Omit<Product, "id"> = {
        ...sourceData,
        name: `${sourceData.name} (Copy)`,
        sku: `${sourceData.sku}-COPY-${Date.now().toString().slice(-4)}`,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };

      const newRef = await adminDb.collection("products").add(duplicatedProduct);
      return NextResponse.json({ success: true, id: newRef.id, product: duplicatedProduct }, { status: 201 });
    }

    // Handle New Product Creation
    const newProduct: Omit<Product, "id"> = {
      name: productData.name || "Untitled Product",
      sku: productData.sku || `SKU-${Date.now()}`,
      category: productData.category || "Uncategorized",
      description: productData.description || "",
      price: Number(productData.price) || 0,
      salePrice: productData.salePrice ? Number(productData.salePrice) : undefined,
      images: Array.isArray(productData.images) ? productData.images : [],
      videos: Array.isArray(productData.videos) ? productData.videos : [],
      tags: Array.isArray(productData.tags) ? productData.tags : [],
      variants: Array.isArray(productData.variants) ? productData.variants : [],
      weight: productData.weight || null,
      dimensions: productData.dimensions || null,
      seo: {
        title: productData.seo?.title || productData.name || "",
        description: productData.seo?.description || productData.description || "",
        keywords: productData.seo?.keywords || [],
      },
      customSchema: productData.customSchema || null,
      status: (productData.status as ProductStatus) || "draft",
      scheduledAt: productData.scheduledAt || null,
      stockQuantity: Number(productData.stockQuantity) || 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection("products").add(newProduct);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error("[API/Admin/Products] POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT: Edit Single Product OR Perform Bulk Actions
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, bulkAction, productIds, updates } = body;
    const now = new Date().toISOString();

    // Handle Bulk Operations (publish, unpublish, archive, delete)
    if (bulkAction && Array.isArray(productIds) && productIds.length > 0) {
      const batch = adminDb.batch();

      productIds.forEach((prodId: string) => {
        const ref = adminDb.collection("products").doc(prodId);
        if (bulkAction === "delete") {
          batch.delete(ref);
        } else {
          let newStatus: ProductStatus = "published";
          if (bulkAction === "unpublish") newStatus = "draft";
          if (bulkAction === "archive") newStatus = "archived";

          batch.update(ref, { status: newStatus, updatedAt: now });
        }
      });

      await batch.commit();
      return NextResponse.json({ success: true, message: `Bulk ${bulkAction} completed for ${productIds.length} products.` });
    }

    // Handle Single Product Edit
    if (!id) {
      return NextResponse.json({ error: "Product ID is required for editing." }, { status: 400 });
    }

    const productRef = adminDb.collection("products").doc(id);
    await productRef.update({
      ...updates,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("[API/Admin/Products] PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Archive or Hard Delete Product
 * Use ?hard=true query parameter to permanently delete; defaults to archiving.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const hardDelete = searchParams.get("hard") === "true";

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const ref = adminDb.collection("products").doc(id);

    if (hardDelete) {
      await ref.delete();
      return NextResponse.json({ success: true, message: "Product permanently deleted." });
    } else {
      await ref.update({ status: "archived", updatedAt: new Date().toISOString() });
      return NextResponse.json({ success: true, message: "Product archived." });
    }
  } catch (error: any) {
    console.error("[API/Admin/Products] DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
