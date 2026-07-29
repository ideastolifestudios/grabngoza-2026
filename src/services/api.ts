import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  Timestamp,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, CartItem, User, Category, Brand } from '../types';

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    const path = 'products';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      console.log(`Firestore query for ${path} returned ${querySnapshot.size} documents`);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  saveProduct: async (product: Partial<Product>): Promise<Product> => {
    const path = `products/${product.id || 'new'}`;
    try {
      if (product.id) {
        const docRef = doc(db, 'products', product.id);
        await setDoc(docRef, product, { merge: true });
        return { ...product } as Product;
      } else {
        const docRef = await addDoc(collection(db, 'products'), product);
        const newProduct = { ...product, id: docRef.id } as Product;
        await updateDoc(docRef, { id: docRef.id });
        return newProduct;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },
  deleteProduct: async (id: string): Promise<void> => {
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },
};

export const brandService = {
  getBrands: async (): Promise<Brand[]> => {
    const path = 'brands';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      console.log(`Firestore query for ${path} returned ${querySnapshot.size} documents`);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  saveBrand: async (brand: Partial<Brand>): Promise<Brand> => {
    const path = `brands/${brand.id || 'new'}`;
    try {
      if (brand.id) {
        const docRef = doc(db, 'brands', brand.id);
        await setDoc(docRef, brand, { merge: true });
        return { ...brand } as Brand;
      } else {
        const docRef = await addDoc(collection(db, 'brands'), brand);
        const newBrand = { ...brand, id: docRef.id } as Brand;
        await updateDoc(docRef, { id: docRef.id });
        return newBrand;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },
  deleteBrand: async (id: string): Promise<void> => {
    const path = `brands/${id}`;
    try {
      await deleteDoc(doc(db, 'brands', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },
};

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const path = 'orders';
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      const ordersRef = collection(db, path);
      const q = query(ordersRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
        } as Order;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  createOrder: async (orderData: any): Promise<Order> => {
    const path = 'orders';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...orderData,
        date: Timestamp.now(),
        status: 'pending'
      });
      return { ...orderData, id: docRef.id, status: 'pending' } as Order;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },
  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order> => {
    const path = `orders/${id}`;
    try {
      const docRef = doc(db, 'orders', id);
      // Filter out undefined values to prevent Firestore errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(docRef, cleanUpdates);
      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Order;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },
  lookupOrder: async (orderId: string, email: string): Promise<Order | null> => {
    const path = 'orders';
    try {
      // Clean orderId (remove # if present)
      const cleanId = orderId.startsWith('#') ? orderId.substring(1) : orderId;
      
      // First try by ID
      const docRef = doc(db, 'orders', cleanId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Order;
        if (data.email.toLowerCase().trim() === email.toLowerCase().trim()) {
          return { ...data, id: docSnap.id } as Order;
        }
      }
      
      // If not found by ID, try searching by a potential 'orderNumber' field if we had one,
      // or just search all orders for this email and check if the ID matches (case insensitive)
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        if (doc.id.toLowerCase() === cleanId.toLowerCase()) {
          const data = doc.data();
          return { 
            ...data, 
            id: doc.id,
            date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
          } as Order;
        }
      }
      
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${path}/${orderId}`);
      return null;
    }
  },
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const path = 'categories';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      console.log(`Firestore query for ${path} returned ${querySnapshot.size} documents`);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  saveCategory: async (category: Partial<Category>): Promise<Category> => {
    const path = `categories/${category.id || 'new'}`;
    try {
      if (category.id) {
        const docRef = doc(db, 'categories', category.id);
        await setDoc(docRef, category, { merge: true });
        return { ...category } as Category;
      } else {
        const docRef = await addDoc(collection(db, 'categories'), category);
        const newCategory = { ...category, id: docRef.id } as Category;
        await updateDoc(docRef, { id: docRef.id });
        return newCategory;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },
  deleteCategory: async (id: string): Promise<void> => {
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },
};

export const authService = {
  getCurrentUser: async (): Promise<User> => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");
    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as User;
      } else {
        // Create user profile if it doesn't exist
        const nameParts = user.displayName?.split(' ') || ['User'];
        const newUser: User = {
          id: user.uid,
          email: user.email || '',
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || 'Customer', // Ensure lastName is not empty
          role: user.email === 'cbrprints22@gmail.com' ? 'admin' : 'user',
          wishlist: []
        };
        await setDoc(docRef, newUser);
        return newUser;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error; // unreachable due to handleFirestoreError throwing
    }
  },
  updateWishlist: async (wishlist: string[]): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");
    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { wishlist });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

export const supportService = {
  subscribeNewsletter: async (email: string): Promise<any> => {
    try {
      const response = await fetch('/api/notifications?action=email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: "You're on the list! - Grab & Go ZA",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff;">
              <div style="background: #000; padding: 24px; text-align: center;">
                <img src="https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png" alt="Grab & Go" style="height: 40px;" />
              </div>
              <div style="padding: 40px 24px; text-align: center;">
                <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px; font-size: 28px; margin-bottom: 16px;">Welcome to the Fam!</h1>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Thanks for joining the Grab & Go newsletter. You'll be the first to know about exclusive drops, fresh gear, and studio updates.</p>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 24px 0;">
                  <p style="font-size: 18px; font-weight: bold; color: #000; margin: 0;">🎁 10% OFF YOUR FIRST ORDER</p>
                  <p style="font-size: 12px; color: #888; margin: 8px 0 0;">Use code <strong>WELCOME10</strong> at checkout</p>
                </div>
              </div>
              <div style="background: #f5f5f5; padding: 20px 24px; text-align: center; font-size: 11px; color: #999;">
                <p style="margin: 0;">© 2026 Grab & Go Studio. Stay fresh.</p>
              </div>
            </div>
          `,
          text: "Welcome to the Grab & Go Fam! You'll be the first to know about new drops. Use code WELCOME10 for 10% off your first order."
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      throw error;
    }
  },
  submitHelpDesk: async (data: any): Promise<any> => {
    try {
      const response = await fetch('/api/notifications?action=email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.email,
          subject: `Help Desk: ${data.subject || 'New Inquiry'} - Grab & Go`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
              <h1 style="color: #000; text-transform: uppercase; letter-spacing: -1px;">We Got Your Message</h1>
              <p>Hi ${data.name || 'there'},</p>
              <p>We've received your inquiry and will get back to you within 24 hours.</p>
              <div style="background: #f9f9f9; padding: 16px; margin: 20px 0; border-left: 4px solid #000;">
                <p style="margin: 0; font-size: 13px;"><strong>Subject:</strong> ${data.subject}</p>
                <p style="margin: 8px 0 0; font-size: 13px; color: #666;">${data.message}</p>
              </div>
              <p style="font-size: 12px; color: #888;">— The Grab & Go Team</p>
            </div>
          `,
          text: `Hi ${data.name}, we received your inquiry: "${data.subject}". We'll get back to you within 24 hours.`
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error('Help desk submission error:', error);
      throw error;
    }
  },
};
export const testimonialService = {
  getTestimonials: async (): Promise<any[]> => {
    const path = 'testimonials';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};

export const partnerService = {
  getPartners: async (): Promise<any[]> => {
    const path = 'partners';
    try {
      const querySnapshot = await getDocs(collection(db, path));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};