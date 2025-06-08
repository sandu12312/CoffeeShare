import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface WishlistItem {
  id: string;
  userId: string;
  cafeId: string;
  cafeName: string;
  cafeAddress: string;
  cafeImageUrl?: string;
  cafeBannerImageUrl?: string;
  cafeDescription?: string;
  addedAt: Date;
}

export interface CafeDetails {
  id: string;
  businessName: string;
  address: string;
  description?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  mainImageUrl?: string;
  openingHours?: any;
  products?: any[];
  phoneNumber?: string;
  websiteUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

class WishlistService {
  private wishlistCollection = "wishlist";

  /**
   * Add a cafe to user's wishlist
   */
  async addToWishlist(userId: string, cafeId: string): Promise<void> {
    try {
      // First check if already in wishlist
      const existingQuery = query(
        collection(db, this.wishlistCollection),
        where("userId", "==", userId),
        where("cafeId", "==", cafeId)
      );

      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        throw new Error("Cafe is already in wishlist");
      }

      // Get cafe details
      const cafeRef = doc(db, "cafes", cafeId);
      const cafeSnap = await getDoc(cafeRef);

      if (!cafeSnap.exists()) {
        throw new Error("Cafe not found");
      }

      const cafeData = cafeSnap.data();

      // Add to wishlist
      const wishlistItem: Omit<WishlistItem, "id"> = {
        userId,
        cafeId,
        cafeName: cafeData.businessName || "Unknown Cafe",
        cafeAddress: cafeData.address || "No address",
        cafeImageUrl: cafeData.imageUrl,
        cafeBannerImageUrl: cafeData.bannerImageUrl || cafeData.mainImageUrl,
        cafeDescription: cafeData.description,
        addedAt: new Date(),
      };

      await addDoc(collection(db, this.wishlistCollection), wishlistItem);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      throw error;
    }
  }

  /**
   * Remove a cafe from user's wishlist
   */
  async removeFromWishlist(userId: string, cafeId: string): Promise<void> {
    try {
      const wishlistQuery = query(
        collection(db, this.wishlistCollection),
        where("userId", "==", userId),
        where("cafeId", "==", cafeId)
      );

      const querySnapshot = await getDocs(wishlistQuery);

      if (querySnapshot.empty) {
        throw new Error("Cafe not found in wishlist");
      }

      // Delete all matching documents (should be only one)
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      throw error;
    }
  }

  /**
   * Check if a cafe is in user's wishlist
   */
  async isInWishlist(userId: string, cafeId: string): Promise<boolean> {
    try {
      const wishlistQuery = query(
        collection(db, this.wishlistCollection),
        where("userId", "==", userId),
        where("cafeId", "==", cafeId)
      );

      const querySnapshot = await getDocs(wishlistQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      return false;
    }
  }

  /**
   * Get user's wishlist
   */
  async getUserWishlist(
    userId: string,
    limitCount: number = 20
  ): Promise<WishlistItem[]> {
    try {
      const wishlistQuery = query(
        collection(db, this.wishlistCollection),
        where("userId", "==", userId),
        orderBy("addedAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(wishlistQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          cafeId: data.cafeId,
          cafeName: data.cafeName,
          cafeAddress: data.cafeAddress,
          cafeImageUrl: data.cafeImageUrl,
          cafeBannerImageUrl: data.cafeBannerImageUrl,
          cafeDescription: data.cafeDescription,
          addedAt: data.addedAt?.toDate() || new Date(),
        } as WishlistItem;
      });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      throw error;
    }
  }

  /**
   * Get cafe details for wishlist display
   */
  async getCafeDetails(cafeId: string): Promise<CafeDetails | null> {
    try {
      const cafeRef = doc(db, "cafes", cafeId);
      const cafeSnap = await getDoc(cafeRef);

      if (!cafeSnap.exists()) {
        return null;
      }

      const data = cafeSnap.data();
      return {
        id: cafeSnap.id,
        businessName: data.businessName,
        address: data.address,
        description: data.description,
        imageUrl: data.imageUrl,
        bannerImageUrl: data.bannerImageUrl,
        mainImageUrl: data.mainImageUrl || data.bannerImageUrl || data.imageUrl,
        openingHours: data.openingHours,
        products: data.products || [],
        phoneNumber: data.phoneNumber,
        websiteUrl: data.websiteUrl,
        location: data.location,
      };
    } catch (error) {
      console.error("Error fetching cafe details:", error);
      return null;
    }
  }

  /**
   * Get wishlist count for user
   */
  async getWishlistCount(userId: string): Promise<number> {
    try {
      const wishlistQuery = query(
        collection(db, this.wishlistCollection),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(wishlistQuery);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting wishlist count:", error);
      return 0;
    }
  }

  /**
   * Get user's favorite cafes for dashboard display
   */
  async getFavoriteCafesForDashboard(userId: string): Promise<WishlistItem[]> {
    try {
      return await this.getUserWishlist(userId, 5); // Get top 5 for dashboard
    } catch (error) {
      console.error("Error fetching favorite cafes for dashboard:", error);
      return [];
    }
  }
}

export default new WishlistService();
