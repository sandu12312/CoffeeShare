import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase";

const db = getFirestore(app);
const auth = getAuth(app);

export interface CafeDetails {
  id: string;
  businessName: string;
  address?: string;
  phoneNumber?: string;
  website?: string;
  description?: string;
  openingHours?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: "pending" | "active" | "inactive" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerEmail: string;
  // Contact info fields
  email?: string;
  phone?: string;
  // Subscription acceptance fields
  acceptsStudentSubscription?: boolean;
  acceptsEliteSubscription?: boolean;
  acceptsPremiumSubscription?: boolean;
  acceptsBasicSubscription?: boolean;
  // Allow for dynamic subscription fields
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  priceLei: number;
  beansValue: number;
  imageUrl: string;
  cafeId: string;
  createdAt: Timestamp;
}

/**
 * Coffee Partner Service
 * Handles operations for coffee partners to manage their cafes and products
 */
class CoffeePartnerService {
  /**
   * Get all cafes owned by the current user
   */
  async getMyCafes(): Promise<CafeDetails[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      const q = query(
        collection(db, "cafes"),
        where("ownerEmail", "==", user.email)
        // orderBy("createdAt", "desc") - Commented out until composite index is created
      );

      const querySnapshot = await getDocs(q);
      const cafes: CafeDetails[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cafes.push({
          id: doc.id,
          businessName: data.businessName,
          address: data.address,
          phoneNumber: data.phoneNumber,
          website: data.website,
          description: data.description,
          openingHours: data.openingHours,
          location: data.location,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          ownerEmail: data.ownerEmail,
          // Contact info
          email: data.email,
          phone: data.phone,
          // Subscription acceptance fields
          acceptsStudentSubscription: data.acceptsStudentSubscription,
          acceptsEliteSubscription: data.acceptsEliteSubscription,
          acceptsPremiumSubscription: data.acceptsPremiumSubscription,
          acceptsBasicSubscription: data.acceptsBasicSubscription,
          // Include any other dynamic fields
          ...Object.keys(data).reduce((acc, key) => {
            if (key.startsWith("accepts") && !acc.hasOwnProperty(key)) {
              acc[key] = data[key];
            }
            return acc;
          }, {} as any),
        });
      });

      // Sort in memory until composite index is created
      cafes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime; // desc order
      });

      return cafes;
    } catch (error) {
      console.error("Error fetching my cafes:", error);
      throw error;
    }
  }

  /**
   * Get cafe details by ID (only if owned by current user)
   */
  async getCafeById(cafeId: string): Promise<CafeDetails | null> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      const cafeDoc = await getDoc(doc(db, "cafes", cafeId));

      if (!cafeDoc.exists()) {
        return null;
      }

      const data = cafeDoc.data();

      // Check if the current user owns this cafe
      if (data.ownerEmail !== user.email) {
        throw new Error("Access denied: You don't own this cafe");
      }

      return {
        id: cafeDoc.id,
        businessName: data.businessName,
        address: data.address,
        phoneNumber: data.phoneNumber,
        website: data.website,
        description: data.description,
        openingHours: data.openingHours,
        location: data.location,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ownerEmail: data.ownerEmail,
        // Contact info
        email: data.email,
        phone: data.phone,
        // Subscription acceptance fields
        acceptsStudentSubscription: data.acceptsStudentSubscription,
        acceptsEliteSubscription: data.acceptsEliteSubscription,
        acceptsPremiumSubscription: data.acceptsPremiumSubscription,
        acceptsBasicSubscription: data.acceptsBasicSubscription,
        // Include any other dynamic fields
        ...Object.keys(data).reduce((acc, key) => {
          if (key.startsWith("accepts") && !acc.hasOwnProperty(key)) {
            acc[key] = data[key];
          }
          return acc;
        }, {} as any),
      };
    } catch (error) {
      console.error("Error fetching cafe:", error);
      throw error;
    }
  }

  /**
   * Update cafe details (only if owned by current user)
   */
  async updateCafe(
    cafeId: string,
    updates: Partial<CafeDetails> | { [key: string]: any }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      // First verify ownership
      const cafe = await this.getCafeById(cafeId);
      if (!cafe) {
        throw new Error("Cafe not found or access denied");
      }

      const cafeRef = doc(db, "cafes", cafeId);

      // Remove fields that shouldn't be updated
      const { id, createdAt, ownerEmail, ...allowedUpdates } = updates;

      // Create the update object
      const updateData: { [key: string]: any } = {
        ...allowedUpdates,
        updatedAt: serverTimestamp(),
      };

      console.log("Updating cafe with data:", updateData);

      await updateDoc(cafeRef, updateData);

      console.log(`Cafe ${cafeId} updated successfully`);
    } catch (error) {
      console.error("Error updating cafe:", error);
      throw error;
    }
  }

  /**
   * Get all products for cafes owned by current user
   */
  async getMyProducts(): Promise<Product[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      // First get all cafe IDs owned by user
      const myCafes = await this.getMyCafes();
      const cafeIds = myCafes.map((cafe) => cafe.id);

      if (cafeIds.length === 0) {
        return [];
      }

      // Get products for all my cafes
      const products: Product[] = [];

      for (const cafeId of cafeIds) {
        const q = query(
          collection(db, "products"),
          where("cafeId", "==", cafeId)
          // orderBy("createdAt", "desc") - Will sort in memory for consistency
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          products.push({
            id: doc.id,
            name: data.name,
            priceLei: data.priceLei,
            beansValue: data.beansValue,
            imageUrl: data.imageUrl,
            cafeId: data.cafeId,
            createdAt: data.createdAt,
          });
        });
      }

      // Sort all products by creation date
      products.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      return products;
    } catch (error) {
      console.error("Error fetching my products:", error);
      throw error;
    }
  }

  /**
   * Get products for a specific cafe (public method for displaying products)
   */
  async getProductsForCafe(cafeId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, "products"),
        where("cafeId", "==", cafeId)
        // orderBy("createdAt", "desc") - Will sort in memory for consistency
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name,
          priceLei: data.priceLei,
          beansValue: data.beansValue,
          imageUrl: data.imageUrl,
          cafeId: data.cafeId,
          createdAt: data.createdAt,
        });
      });

      // Sort in memory for consistency
      products.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime; // desc order
      });

      console.log(`Loaded ${products.length} products for cafe ${cafeId}`);
      return products;
    } catch (error) {
      console.error("Error fetching products for cafe:", error);
      throw error;
    }
  }

  /**
   * Get products for a specific cafe that I own (owner-only access)
   */
  async getMyProductsForCafe(cafeId: string): Promise<Product[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      // Verify ownership first
      const cafe = await this.getCafeById(cafeId);
      if (!cafe) {
        throw new Error("Cafe not found or access denied");
      }

      return this.getProductsForCafe(cafeId);
    } catch (error) {
      console.error("Error fetching my products for cafe:", error);
      throw error;
    }
  }

  /**
   * Add a new product to a cafe (only if owned by current user)
   */
  async addProduct(productData: {
    name: string;
    priceLei: number;
    beansValue: number;
    imageUrl: string;
    cafeId: string;
  }): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      // Verify ownership first
      const cafe = await this.getCafeById(productData.cafeId);
      if (!cafe) {
        throw new Error("Cafe not found or access denied");
      }

      const docRef = await addDoc(collection(db, "products"), {
        ...productData,
        createdAt: serverTimestamp(),
      });

      console.log(`Product added with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  }

  /**
   * Update a product (only if the cafe is owned by current user)
   */
  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      // Get the product first to verify ownership through cafe
      const productDoc = await getDoc(doc(db, "products", productId));
      if (!productDoc.exists()) {
        throw new Error("Product not found");
      }

      const productData = productDoc.data();

      // Verify cafe ownership
      const cafe = await this.getCafeById(productData.cafeId);
      if (!cafe) {
        throw new Error("Access denied: You don't own this cafe");
      }

      const productRef = doc(db, "products", productId);

      // Remove fields that shouldn't be updated
      const { id, createdAt, cafeId, ...allowedUpdates } = updates;

      await updateDoc(productRef, {
        ...allowedUpdates,
        updatedAt: serverTimestamp(),
      });

      console.log(`Product ${productId} updated successfully`);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  /**
   * Delete a product (only if the cafe is owned by current user)
   */
  async deleteProduct(productId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      // Get the product first to verify ownership through cafe
      const productDoc = await getDoc(doc(db, "products", productId));
      if (!productDoc.exists()) {
        throw new Error("Product not found");
      }

      const productData = productDoc.data();

      // Verify cafe ownership
      const cafe = await this.getCafeById(productData.cafeId);
      if (!cafe) {
        throw new Error("Access denied: You don't own this cafe");
      }

      await deleteDoc(doc(db, "products", productId));
      console.log(`Product ${productId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  /**
   * Get cafe statistics for current user
   */
  async getMyCafeStats(): Promise<{
    totalCafes: number;
    activeCafes: number;
    totalProducts: number;
    pendingCafes: number;
  }> {
    try {
      const cafes = await this.getMyCafes();
      const products = await this.getMyProducts();

      return {
        totalCafes: cafes.length,
        activeCafes: cafes.filter((cafe) => cafe.status === "active").length,
        pendingCafes: cafes.filter((cafe) => cafe.status === "pending").length,
        totalProducts: products.length,
      };
    } catch (error) {
      console.error("Error getting cafe stats:", error);
      throw error;
    }
  }
}

export const coffeePartnerService = new CoffeePartnerService();
export default coffeePartnerService;
