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
      const status = orderData.status || 'pending';
      const docRef = await addDoc(collection(db, path), {
        ...orderData,
        date: Timestamp.now(),
        status
      });
      return { ...orderData, id: docRef.id, status } as Order;
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
          role: 'user',
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
    const path = 'newsletter';
    try {
      await addDoc(collection(db, path), {
        email: email.toLowerCase().trim(),
        subscribedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  submitHelpDesk: async (data: any): Promise<any> => {
    const path = 'support_tickets';
    try {
      await addDoc(collection(db, path), {
        ...data,
        submittedAt: Timestamp.now(),
        status: 'open'
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
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
