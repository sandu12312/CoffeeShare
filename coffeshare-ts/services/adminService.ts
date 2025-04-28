import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { UserProfile } from "../types";
import { app } from "../config/firebase";

// Initialize Firestore and Auth using the imported app
const db = getFirestore(app);
const auth = getAuth(app);

export interface AdminUserData extends UserProfile {
  id: string;
  status: "active" | "suspended" | "blocked";
  registrationDate: Timestamp | null;
  lastLogin: Timestamp | null;
  subscriptionInfo?: {
    plan: string;
    expiryDate: Timestamp | null;
    isActive: boolean;
  };
}

/**
 * Admin Service class to handle all admin-related operations
 */
class AdminService {
  /**
   * Check if the current user has admin rights
   */
  async isAdmin(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      return userData.role === "admin";
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  /**
   * Get all users with pagination
   * @param lastVisible Last visible document for pagination
   * @param pageSize Number of users per page
   * @returns Array of users
   */
  async getAllUsers(
    lastVisible?: QueryDocumentSnapshot<any>,
    pageSize: number = 20
  ): Promise<{
    users: AdminUserData[];
    lastVisible: QueryDocumentSnapshot<any> | null;
  }> {
    try {
      // Create query reference
      let usersQuery;

      if (lastVisible) {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      // Execute query
      const snapshot = await getDocs(usersQuery);

      // Process results
      const users: AdminUserData[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          uid: doc.id,
          email: userData.email || "",
          displayName: userData.displayName || "",
          photoURL: userData.photoURL || null,
          phoneNumber: userData.phoneNumber || null,
          role: userData.role || "user",
          createdAt: userData.createdAt || null,
          updatedAt: userData.updatedAt || null,
          status: userData.status || "active",
          registrationDate: userData.createdAt || null,
          lastLogin: userData.lastLogin || null,
          preferences: userData.preferences || {},
          stats: userData.stats || {},
          subscription: userData.subscription || {},
          subscriptionInfo: {
            plan: userData.subscription?.type || "None",
            expiryDate: userData.subscription?.expiryDate || null,
            isActive: userData.subscription?.isActive || false,
          },
        });
      });

      // Get the last visible document for pagination
      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      return {
        users,
        lastVisible: lastVisibleDoc,
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   * @param searchQuery Query to search for in name or email
   * @returns Array of matching users
   */
  async searchUsers(searchQuery: string): Promise<AdminUserData[]> {
    try {
      // Since Firebase doesn't support OR queries across different fields directly,
      // we'll fetch a reasonable amount of users and filter on the client side
      const usersQuery = query(
        collection(db, "users"),
        limit(100) // Limit to a reasonable number for client-side filtering
      );

      const snapshot = await getDocs(usersQuery);
      const users: AdminUserData[] = [];

      const lowerQuery = searchQuery.toLowerCase();

      snapshot.forEach((doc) => {
        const userData = doc.data();
        const displayName = userData.displayName || "";
        const email = userData.email || "";

        // Check if the name or email matches the search query
        if (
          displayName.toLowerCase().includes(lowerQuery) ||
          email.toLowerCase().includes(lowerQuery)
        ) {
          users.push({
            id: doc.id,
            uid: doc.id,
            email: userData.email || "",
            displayName: userData.displayName || "",
            photoURL: userData.photoURL || null,
            phoneNumber: userData.phoneNumber || null,
            role: userData.role || "user",
            createdAt: userData.createdAt || null,
            updatedAt: userData.updatedAt || null,
            status: userData.status || "active",
            registrationDate: userData.createdAt || null,
            lastLogin: userData.lastLogin || null,
            preferences: userData.preferences || {},
            stats: userData.stats || {},
            subscription: userData.subscription || {},
            subscriptionInfo: {
              plan: userData.subscription?.type || "None",
              expiryDate: userData.subscription?.expiryDate || null,
              isActive: userData.subscription?.isActive || false,
            },
          });
        }
      });

      return users;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  /**
   * Update a user's profile
   * @param userId User ID to update
   * @param data Data to update
   */
  async updateUser(
    userId: string,
    data: Partial<AdminUserData>
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);

      // Clean up the data before updating
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Remove id field as it's not part of the document
      delete updateData.id;
      delete updateData.uid;

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Change a user's status (active, suspended, blocked)
   * @param userId User ID to update
   * @param status New status
   */
  async changeUserStatus(
    userId: string,
    status: "active" | "suspended" | "blocked"
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error changing user status:", error);
      throw error;
    }
  }

  /**
   * Delete a user (use with caution)
   * @param userId User ID to delete
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);

      // Note: This only deletes the Firestore document
      // To fully delete a user, you should also delete their auth account
      // That requires an admin SDK with Firebase Functions
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   * @returns Object with various statistics
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    totalCafes: number;
    recentRegistrations: AdminUserData[];
  }> {
    try {
      // Get total user count
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;

      // Get users with active subscriptions
      const activeSubsQuery = query(
        collection(db, "users"),
        where("subscription.isActive", "==", true)
      );
      const activeSubsSnapshot = await getDocs(activeSubsQuery);
      const activeSubscriptions = activeSubsSnapshot.size;

      // Get total cafe count
      const cafesQuery = query(
        collection(db, "users"),
        where("role", "==", "partner")
      );
      const cafesSnapshot = await getDocs(cafesQuery);
      const totalCafes = cafesSnapshot.size;

      // Get recent registrations
      const recentRegsQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const recentRegsSnapshot = await getDocs(recentRegsQuery);
      const recentRegistrations: AdminUserData[] = [];

      recentRegsSnapshot.forEach((doc) => {
        const userData = doc.data();
        recentRegistrations.push({
          id: doc.id,
          uid: doc.id,
          email: userData.email || "",
          displayName: userData.displayName || "",
          photoURL: userData.photoURL || null,
          phoneNumber: userData.phoneNumber || null,
          role: userData.role || "user",
          createdAt: userData.createdAt || null,
          updatedAt: userData.updatedAt || null,
          status: userData.status || "active",
          registrationDate: userData.createdAt || null,
          lastLogin: userData.lastLogin || null,
          preferences: userData.preferences || {},
          stats: userData.stats || {},
          subscription: userData.subscription || {},
          subscriptionInfo: {
            plan: userData.subscription?.type || "None",
            expiryDate: userData.subscription?.expiryDate || null,
            isActive: userData.subscription?.isActive || false,
          },
        });
      });

      return {
        totalUsers,
        activeSubscriptions,
        totalCafes,
        recentRegistrations,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Add a new admin user
   * @param userData User data for the new admin
   * @returns The ID of the created admin user
   */
  async addAdminUser(userData: Partial<AdminUserData>): Promise<string> {
    try {
      // Generate a unique ID for the admin
      const adminId = userData.uid || `admin_${Date.now()}`;
      const adminRef = doc(db, "users", adminId);

      // Create an admin user document
      await setDoc(adminRef, {
        ...userData,
        role: "admin",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return adminId;
    } catch (error) {
      console.error("Error adding admin user:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const adminService = new AdminService();
export default adminService;
