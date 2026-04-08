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
import { Product, Order, CartItem, User, ReturnRequest } from '../types';

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    const path = 'products';
    try {
      const querySnapshot = await getDocs(collection(db, path));
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
      // First try by ID
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Order;
        if (data.email.toLowerCase() === email.toLowerCase()) {
          return { ...data, id: docSnap.id } as Order;
        }
      }
      
      // If not found by ID or email mismatch, try searching (in case orderId is a custom field or something)
      // But usually orderId is the document ID.
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
          role: user.email === 'cbrprints22@gmail.com' ? 'admin' : 'user'
        };
        await setDoc(docRef, newUser);
        return newUser;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error; // unreachable due to handleFirestoreError throwing
    }
  }
};

export const supportService = {
  submitReturn: async (returnData: any): Promise<any> => {
    const path = 'returnRequests';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...returnData,
        date: Timestamp.now(),
        status: 'pending'
      });
      return { ...returnData, id: docRef.id, status: 'pending' };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },
  subscribeNewsletter: async (email: string): Promise<any> => {
    // For demo, just log it
    console.log("Newsletter subscription:", email);
    return { success: true };
  },
  submitHelpDesk: async (data: any): Promise<any> => {
    console.log("Help desk submission:", data);
    return { success: true };
  },
};
