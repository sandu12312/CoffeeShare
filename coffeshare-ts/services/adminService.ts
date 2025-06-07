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

export interface CafeData {
  id: string;
  businessName: string;
  contactName?: string;
  email: string;
  phone?: string;
  address?: string;
  status: "pending" | "active" | "inactive" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  partnerUid?: string;
  ownerEmail?: string; // Email of the coffee partner who owns this cafe
}

/**
 * Admin Service class to handle all admin-related operations
 */
class AdminService {
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
      const usersQuery = query(collection(db, "users"), limit(100));

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
      // Use simple query without orderBy to avoid index requirement
      const cafesQuery = query(
        collection(db, "cafes"),
        where("status", "==", status),
        limit(pageSize)
      );

      const snapshot = await getDocs(cafesQuery);
      const cafes: CafeData[] = [];
      snapshot.forEach((doc) => {
        cafes.push({ id: doc.id, ...(doc.data() as Omit<CafeData, "id">) });
      });

      // Sort by createdAt on the client side
      cafes.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA; // Descending order (newest first)
      });

      return { cafes, lastVisible: null }; // Simplified pagination
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

          const cafeData = {
            ...data,
            id: doc.id,
            createdAt: data.createdAt || Timestamp.now(),
          } as CafeData;
          cafes.push(cafeData);
        } catch (docError) {
          console.error(`Error processing cafe document ${doc.id}:`, docError);
        }
      });

      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      return { cafes, lastVisible: lastVisibleDoc };
    } catch (error) {
      console.error(`Error fetching all cafes:`, error);

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
    const activationPassword = "sandu123";

    let newUserUid: string | null = null;

    try {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          activationPassword
        );
        newUserUid = userCredential.user.uid;
        console.log(
          `Auth user created for partner ${email} with UID: ${newUserUid}`
        );

        await signOut(auth);
      } catch (authError: any) {
        if (authError.code === "auth/email-already-in-use") {
          console.warn(
            `Auth user with email ${email} already exists. Cannot automatically activate.`
          );

          throw new Error(
            `Activation failed: Auth user with email ${email} already exists.`
          );
        } else {
          console.error(
            "Error creating Firebase Auth user during activation:",
            authError
          );
          throw authError;
        }
      }

      const batch = writeBatch(db);

      const cafeRef = doc(db, "cafes", cafeId);
      batch.update(cafeRef, {
        status: "active",
        partnerUid: newUserUid,
        updatedAt: serverTimestamp(),
      });

      const userProfileRef = doc(db, "users", newUserUid);

      const userProfileData: Partial<UserProfile> = {
        uid: newUserUid,
        email: email,
        displayName: contactName,
        role: "partner",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(userProfileRef, userProfileData);

      await batch.commit();
      console.log(
        `Cafe ${cafeId} activated. Partner user ${newUserUid} created and linked.`
      );
    } catch (error) {
      console.error(`Error activating cafe ${cafeId}:`, error);

      if (newUserUid) {
        console.error(
          `Potential orphan auth user: ${newUserUid}. Manual cleanup might be needed.`
        );
      }
      throw error;
    }

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
      const requestRef = doc(db, "partnership_requests", requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error("Partnership request not found");
      }

      const requestData = requestDoc.data();

      const cafesCollection = collection(db, "cafes");
      const newCafeRef = doc(cafesCollection);

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

      const batch = writeBatch(db);

      batch.set(newCafeRef, cafeData);

      batch.delete(requestRef);

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
      const requestRef = doc(db, "partnership_requests", requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error("Partnership request not found");
      }

      await deleteDoc(requestRef);
      console.log(`Partnership request ${requestId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting partnership request:", error);
      throw error;
    }
  }

  /**
   * Update cafe information
   * @param cafeId The ID of the cafe to update
   * @param updateData Data to update
   */
  async updateCafe(
    cafeId: string,
    updateData: Partial<Omit<CafeData, "id" | "createdAt">>
  ): Promise<void> {
    try {
      const cafeRef = doc(db, "cafes", cafeId);
      await updateDoc(cafeRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      console.log(`Cafe ${cafeId} updated successfully`);
    } catch (error) {
      console.error("Error updating cafe:", error);
      throw error;
    }
  }

  /**
   * Delete a cafe completely from the database
   * @param cafeId The ID of the cafe to delete
   */
  async deleteCafe(cafeId: string): Promise<void> {
    try {
      const cafeRef = doc(db, "cafes", cafeId);
      const cafeDoc = await getDoc(cafeRef);

      if (!cafeDoc.exists()) {
        throw new Error("Cafe not found");
      }

      await deleteDoc(cafeRef);
      console.log(`Cafe ${cafeId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting cafe:", error);
      throw error;
    }
  }

  /**
   * Get a single cafe by ID
   * @param cafeId The ID of the cafe to get
   */
  async getCafeById(cafeId: string): Promise<CafeData | null> {
    try {
      const cafeRef = doc(db, "cafes", cafeId);
      const cafeDoc = await getDoc(cafeRef);

      if (!cafeDoc.exists()) {
        return null;
      }

      const data = cafeDoc.data();
      return {
        id: cafeDoc.id,
        businessName: data.businessName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        partnerUid: data.partnerUid,
        ownerEmail: data.ownerEmail,
      };
    } catch (error) {
      console.error("Error getting cafe:", error);
      throw error;
    }
  }

  /**
   * Search cafes by name, address, or email
   * @param searchQuery Query to search for
   * @returns Array of matching cafes
   */
  async searchCafes(searchQuery: string): Promise<CafeData[]> {
    try {
      const cafesQuery = query(collection(db, "cafes"), limit(100));
      const snapshot = await getDocs(cafesQuery);
      const cafes: CafeData[] = [];

      const lowerQuery = searchQuery.toLowerCase();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const businessName = data.businessName || "";
        const email = data.email || "";
        const address = data.address || "";

        // Check if any field matches the search query
        if (
          businessName.toLowerCase().includes(lowerQuery) ||
          email.toLowerCase().includes(lowerQuery) ||
          address.toLowerCase().includes(lowerQuery)
        ) {
          cafes.push({
            id: doc.id,
            businessName: data.businessName,
            contactName: data.contactName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            partnerUid: data.partnerUid,
            ownerEmail: data.ownerEmail,
          });
        }
      });

      return cafes;
    } catch (error) {
      console.error("Error searching cafes:", error);
      throw error;
    }
  }

  /**
   * Get cafe statistics
   * @returns Cafe statistics object
   */
  async getCafeStatistics(): Promise<{
    totalCafes: number;
    activeCafes: number;
    pendingCafes: number;
    inactiveCafes: number;
    pendingRequests: number;
  }> {
    try {
      const [cafesSnapshot, requestsSnapshot] = await Promise.all([
        getDocs(collection(db, "cafes")),
        getDocs(collection(db, "partnership_requests")),
      ]);

      let totalCafes = 0;
      let activeCafes = 0;
      let pendingCafes = 0;
      let inactiveCafes = 0;

      cafesSnapshot.forEach((doc) => {
        const data = doc.data();
        totalCafes++;

        switch (data.status) {
          case "active":
            activeCafes++;
            break;
          case "pending":
            pendingCafes++;
            break;
          case "inactive":
            inactiveCafes++;
            break;
        }
      });

      return {
        totalCafes,
        activeCafes,
        pendingCafes,
        inactiveCafes,
        pendingRequests: requestsSnapshot.size,
      };
    } catch (error) {
      console.error("Error getting cafe statistics:", error);
      throw error;
    }
  }

  /**
   * Get all coffee partners for dropdown selection
   * @returns Array of coffee partners with email and name
   */
  async getCoffeePartners(): Promise<
    Array<{ email: string; name: string; uid: string }>
  > {
    try {
      console.log("Fetching coffee partners...");

      // First try the coffeePartners collection - get all partners
      try {
        const partnersSnapshot = await getDocs(
          collection(db, "coffeePartners")
        );
        console.log(
          `Found ${partnersSnapshot.size} documents in coffeePartners collection`
        );

        if (!partnersSnapshot.empty) {
          const partners: Array<{ email: string; name: string; uid: string }> =
            [];
          partnersSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`Coffee partner document:`, { id: doc.id, data });

            // Only include partners that have an email and are either active or don't have a status field
            if (data.email && (!data.status || data.status === "active")) {
              partners.push({
                email: data.email,
                name:
                  data.displayName ||
                  data.businessName ||
                  data.email ||
                  "Unknown",
                uid: doc.id,
              });
            }
          });

          console.log(
            `Returning ${partners.length} coffee partners:`,
            partners
          );
          return partners;
        }
      } catch (error) {
        console.warn("coffeePartners collection query failed:", error);
      }

      // Fallback to legacy users collection with role filter
      console.log("Trying legacy users collection...");
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "partner")
      );
      const usersSnapshot = await getDocs(usersQuery);
      console.log(
        `Found ${usersSnapshot.size} partner users in users collection`
      );

      const partners: Array<{ email: string; name: string; uid: string }> = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active partners or those without status
        if (data.email && (!data.status || data.status === "active")) {
          partners.push({
            email: data.email,
            name: data.displayName || data.email || "Unknown",
            uid: doc.id,
          });
        }
      });

      console.log(`Returning ${partners.length} legacy partners:`, partners);
      return partners;
    } catch (error) {
      console.error("Error fetching coffee partners:", error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;
