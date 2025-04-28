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
  writeBatch,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
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

// Add interface for Cafe Data (if not already defined elsewhere)
export interface CafeData {
  id: string; // Firestore Document ID
  businessName: string;
  contactName?: string; // Make optional if it might not always exist
  email: string; // Needed for auth creation
  phone?: string;
  address?: string;
  status: "pending" | "active" | "inactive" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  partnerUid?: string; // Will be added upon activation
  // Add other cafe fields (location, hours, etc.)
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

  /**
   * Fetch cafes based on status
   * @param status The status to filter by (e.g., 'pending')
   */
  async getCafesByStatus(
    status: "pending" | "active" | "inactive" | "rejected",
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot<any>
  ): Promise<{
    cafes: CafeData[];
    lastVisible: QueryDocumentSnapshot<any> | null;
  }> {
    try {
      let cafesQuery;
      const baseQuery = query(
        collection(db, "cafes"),
        where("status", "==", status),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastVisible) {
        cafesQuery = query(baseQuery, startAfter(lastVisible));
      } else {
        cafesQuery = baseQuery;
      }

      const snapshot = await getDocs(cafesQuery);
      const cafes: CafeData[] = [];
      snapshot.forEach((doc) => {
        cafes.push({ id: doc.id, ...(doc.data() as Omit<CafeData, "id">) });
      });

      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      return { cafes, lastVisible: lastVisibleDoc };
    } catch (error) {
      console.error(`Error fetching ${status} cafes:`, error);
      throw error;
    }
  }

  /**
   * Fetch ALL cafes regardless of status
   * @param pageSize The number of cafes to fetch per page
   * @param lastVisible The last visible document for pagination
   */
  async getAllCafes(
    pageSize: number = 50, // Increase page size for fetching all
    lastVisible?: QueryDocumentSnapshot<any>
  ): Promise<{
    cafes: CafeData[];
    lastVisible: QueryDocumentSnapshot<any> | null;
  }> {
    try {
      let cafesQuery;
      const baseQuery = query(
        collection(db, "cafes"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastVisible) {
        cafesQuery = query(baseQuery, startAfter(lastVisible));
      } else {
        cafesQuery = baseQuery;
      }

      const snapshot = await getDocs(cafesQuery);
      const cafes: CafeData[] = [];

      snapshot.forEach((doc) => {
        try {
          const data = doc.data();
          // Add a default value for createdAt if it's missing
          const cafeData = {
            ...data,
            id: doc.id,
            createdAt: data.createdAt || Timestamp.now(),
          } as CafeData;
          cafes.push(cafeData);
        } catch (docError) {
          console.error(`Error processing cafe document ${doc.id}:`, docError);
          // Skip this document and continue with others
        }
      });

      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      return { cafes, lastVisible: lastVisibleDoc };
    } catch (error) {
      console.error(`Error fetching all cafes:`, error);
      // Return empty array instead of throwing error
      return { cafes: [], lastVisible: null };
    }
  }

  /**
   * Activate a pending cafe: create auth user, update cafe status and link user.
   * WARNING: Client-side user creation is generally insecure.
   * @param cafeId The ID of the cafe document in Firestore
   * @param email The email address for the new partner user
   * @param contactName The contact name for the user profile
   */
  async activateCafePartner(
    cafeId: string,
    email: string,
    contactName: string
  ): Promise<void> {
    // *** SECURITY WARNING ***
    // As before, client-side user creation is insecure. Use Firebase Functions.
    const activationPassword = "sandu123"; // Set password as requested

    let newUserUid: string | null = null; // Keep track of created user UID for potential rollback

    try {
      // 1. Create Firebase Auth user
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, // Use the main auth instance
          email,
          activationPassword
        );
        newUserUid = userCredential.user.uid;
        console.log(
          `Auth user created for partner ${email} with UID: ${newUserUid}`
        );

        // Sign out the newly created user immediately if using the main auth instance
        await signOut(auth);
        // NOTE: Need to handle admin re-authentication
      } catch (authError: any) {
        if (authError.code === "auth/email-already-in-use") {
          console.warn(
            `Auth user with email ${email} already exists. Cannot automatically activate.`
          );
          // Handle this case - maybe allow linking or show an error to admin?
          throw new Error(
            `Activation failed: Auth user with email ${email} already exists.`
          );
        } else {
          console.error(
            "Error creating Firebase Auth user during activation:",
            authError
          );
          throw authError; // Rethrow other auth errors
        }
      }

      // 2. Use a Firestore Batch Write for atomicity
      const batch = writeBatch(db);

      // 3. Update Cafe Document: Set status to active and link partnerUid
      const cafeRef = doc(db, "cafes", cafeId);
      batch.update(cafeRef, {
        status: "active",
        partnerUid: newUserUid, // Link the cafe to the new auth user
        updatedAt: serverTimestamp(),
      });

      // 4. Create or Update User Profile Document
      // Check if a basic profile might exist from another flow, otherwise create.
      const userProfileRef = doc(db, "users", newUserUid);
      // Check if doc exists - this requires an extra read, batch only writes/updates/deletes
      // For simplicity here, we'll use set with merge: false (overwrite/create)
      // A more robust solution might check existence first.
      const userProfileData: Partial<UserProfile> = {
        uid: newUserUid,
        email: email,
        displayName: contactName, // Use contact name from cafe data
        role: "partner",
        status: "active",
        createdAt: serverTimestamp(), // Or keep original if updating?
        updatedAt: serverTimestamp(),
      };
      // Use setDoc without merge to create or overwrite
      batch.set(userProfileRef, userProfileData);

      // 5. Commit the batch
      await batch.commit();
      console.log(
        `Cafe ${cafeId} activated. Partner user ${newUserUid} created and linked.`
      );
    } catch (error) {
      console.error(`Error activating cafe ${cafeId}:`, error);
      // Minimal rollback: If auth user was created but batch failed, you might want to delete the auth user.
      // This requires Admin SDK usually.
      if (newUserUid) {
        console.error(
          `Potential orphan auth user: ${newUserUid}. Manual cleanup might be needed.`
        );
      }
      throw error; // Re-throw the error to be handled by the caller
    }
    // IMPORTANT: Handle re-authentication of the admin user here if necessary.
    console.warn(
      "Admin user might need to re-authenticate after partner activation."
    );
  }

  /**
   * Update a cafe's status in Firestore
   * @param cafeId The ID of the cafe to update
   * @param status The new status to set
   */
  async updateCafeStatus(
    cafeId: string,
    status: "pending" | "active" | "inactive" | "rejected"
  ): Promise<void> {
    try {
      const cafeRef = doc(db, "cafes", cafeId);
      await updateDoc(cafeRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating cafe status:", error);
      throw error;
    }
  }

  /**
   * Get all partnership requests
   * @returns Array of partnership requests
   */
  async getPartnershipRequests(): Promise<CafeData[]> {
    try {
      const requestsQuery = query(
        collection(db, "partnership_requests"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(requestsQuery);
      const requests: CafeData[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          businessName: data.businessName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          status: "pending",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });

      return requests;
    } catch (error) {
      console.error("Error fetching partnership requests:", error);
      throw error;
    }
  }

  /**
   * Transfer a partnership request to the cafes collection
   * @param requestId The ID of the partnership request to transfer
   */
  async transferPartnershipRequestToCafe(requestId: string): Promise<void> {
    try {
      // Get the partnership request
      const requestRef = doc(db, "partnership_requests", requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error("Partnership request not found");
      }

      const requestData = requestDoc.data();

      // Create a new cafe document
      const cafesCollection = collection(db, "cafes");
      const newCafeRef = doc(cafesCollection);

      // Prepare cafe data
      const cafeData: Omit<CafeData, "id"> = {
        businessName: requestData.businessName,
        contactName: requestData.contactName,
        email: requestData.email,
        phone: requestData.phone,
        address: requestData.address,
        status: "active", // Set status to active
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Use a batch write to ensure atomicity
      const batch = writeBatch(db);

      // Add the new cafe document
      batch.set(newCafeRef, cafeData);

      // Delete the partnership request
      batch.delete(requestRef);

      // Commit the batch
      await batch.commit();

      console.log(
        `Partnership request ${requestId} transferred to cafes collection as active cafe`
      );
    } catch (error) {
      console.error("Error transferring partnership request:", error);
      throw error;
    }
  }

  async deletePartnershipRequest(requestId: string): Promise<void> {
    try {
      // Get the partnership request first to check if it exists
      const requestRef = doc(db, "partnership_requests", requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error("Partnership request not found");
      }

      // Delete the partnership request
      await deleteDoc(requestRef);
      console.log(`Partnership request ${requestId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting partnership request:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const adminService = new AdminService();
export default adminService;
