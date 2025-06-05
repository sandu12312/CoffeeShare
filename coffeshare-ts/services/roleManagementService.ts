import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from "firebase/auth";
import { UserProfile } from "../types";
import { app } from "../config/firebase";

const db = getFirestore(app);
const auth = getAuth(app);

export type UserRole = "user" | "admin" | "partner";

export interface BaseUserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phoneNumber?: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  status: "active" | "suspended" | "blocked";
  lastLogin?: Timestamp | null;
}

export interface AdminUserData extends BaseUserData {
  permissions: string[];
  accessLevel: "super" | "standard";
}

export interface PartnerUserData extends BaseUserData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  partnershipDate?: Timestamp | null;
  businessInfo?: {
    description?: string;
    website?: string;
    socialMedia?: Record<string, string>;
  };
}

export interface RegularUserData extends BaseUserData {
  preferences?: any;
  stats?: any;
  subscription?: any;
}

export interface UserSearchResult {
  userData: BaseUserData;
  role: UserRole;
  collection: string;
}

/**
 * Hybrid Role Management Service
 * Works with both old single collection and new role-based collections
 * Automatically migrates users when they are accessed/modified
 */
class RoleManagementService {
  private readonly newCollections = {
    users: "users",
    admins: "admins",
    partners: "coffeePartners",
  };

  private readonly legacyCollection = "users";

  /**
   * Get user data and role from any collection (hybrid approach)
   */
  async getUserByUid(uid: string): Promise<UserSearchResult | null> {
    try {
      // Check collections in priority order: admins first, then partners, then users
      const collections = [
        { name: "admins", role: "admin" as UserRole },
        { name: "coffeePartners", role: "partner" as UserRole },
        { name: "users", role: "user" as UserRole },
      ];

      for (const collectionInfo of collections) {
        try {
          const userDoc = await getDoc(doc(db, collectionInfo.name, uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as BaseUserData;
            console.log(
              `User ${uid} found in ${collectionInfo.name} collection with role ${collectionInfo.role}`
            );
            return {
              userData: { ...userData, uid },
              role: collectionInfo.role,
              collection: collectionInfo.name,
            };
          }
        } catch (error) {
          // Continue if collection doesn't exist yet
          console.warn(
            `Collection ${collectionInfo.name} not accessible:`,
            error
          );
        }
      }

      // Fallback to legacy collection (users collection with role field)
      try {
        const userDoc = await getDoc(doc(db, this.legacyCollection, uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as any;
          const userRole = userData.role || "user";
          console.log(
            `User ${uid} found in legacy collection with role ${userRole}`
          );

          return {
            userData: { ...userData, uid },
            role: userRole as UserRole,
            collection: this.legacyCollection,
          };
        }
      } catch (error) {
        console.error("Error accessing legacy collection:", error);
      }

      console.log(`User ${uid} not found in any collection`);
      return null;
    } catch (error) {
      console.error("Error getting user by UID:", error);
      throw error;
    }
  }

  /**
   * Search users across all collections (hybrid approach)
   */
  async searchUsers(
    searchQuery: string,
    roleFilter?: UserRole
  ): Promise<UserSearchResult[]> {
    try {
      const results: UserSearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Search in new collections first
      for (const [collectionName, roleName] of Object.entries(
        this.newCollections
      )) {
        if (
          roleFilter &&
          this.getRoleByCollection(collectionName) !== roleFilter
        ) {
          continue;
        }

        try {
          const collectionQuery = query(
            collection(db, collectionName),
            limit(25)
          );

          const snapshot = await getDocs(collectionQuery);

          snapshot.forEach((doc) => {
            const userData = doc.data() as BaseUserData;
            const displayName = userData.displayName || "";
            const email = userData.email || "";

            if (
              displayName.toLowerCase().includes(lowerQuery) ||
              email.toLowerCase().includes(lowerQuery)
            ) {
              results.push({
                userData: { ...userData, uid: doc.id },
                role: this.getRoleByCollection(collectionName),
                collection: collectionName,
              });
            }
          });
        } catch (error) {
          console.warn(`Could not search in ${collectionName}:`, error);
        }
      }

      // If no results from new collections, search legacy collection
      if (results.length === 0) {
        try {
          const collectionQuery = query(
            collection(db, this.legacyCollection),
            limit(50)
          );

          const snapshot = await getDocs(collectionQuery);

          snapshot.forEach((doc) => {
            const userData = doc.data() as any;
            const displayName = userData.displayName || "";
            const email = userData.email || "";
            const userRole = userData.role || "user";

            // Apply role filter if specified
            if (roleFilter && userRole !== roleFilter) {
              return;
            }

            if (
              displayName.toLowerCase().includes(lowerQuery) ||
              email.toLowerCase().includes(lowerQuery)
            ) {
              results.push({
                userData: { ...userData, uid: doc.id },
                role: userRole as UserRole,
                collection: this.legacyCollection,
              });
            }
          });
        } catch (error) {
          console.warn("Could not search legacy collection:", error);
        }
      }

      return results;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  /**
   * Get all users from a specific role (hybrid approach)
   */
  async getUsersByRole(
    role: UserRole,
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot<any>
  ): Promise<{
    users: UserSearchResult[];
    lastVisible: QueryDocumentSnapshot<any> | null;
  }> {
    try {
      const collectionName = this.getCollectionByRole(role);
      let users: UserSearchResult[] = [];
      let lastVisibleDoc: QueryDocumentSnapshot<any> | null = null;

      // Try new collection first
      try {
        let usersQuery;
        if (lastVisible) {
          usersQuery = query(
            collection(db, collectionName),
            orderBy("createdAt", "desc"),
            startAfter(lastVisible),
            limit(pageSize)
          );
        } else {
          usersQuery = query(
            collection(db, collectionName),
            orderBy("createdAt", "desc"),
            limit(pageSize)
          );
        }

        const snapshot = await getDocs(usersQuery);

        snapshot.forEach((doc) => {
          const userData = doc.data() as BaseUserData;
          users.push({
            userData: { ...userData, uid: doc.id },
            role,
            collection: collectionName,
          });
        });

        lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      } catch (error) {
        console.warn(
          `New collection ${collectionName} not accessible, using legacy:`,
          error
        );

        // Fallback to legacy collection with simplified query
        try {
          // Simple query without complex index requirements
          let usersQuery;
          if (lastVisible) {
            usersQuery = query(
              collection(db, this.legacyCollection),
              where("role", "==", role),
              startAfter(lastVisible),
              limit(pageSize)
            );
          } else {
            usersQuery = query(
              collection(db, this.legacyCollection),
              where("role", "==", role),
              limit(pageSize)
            );
          }

          const snapshot = await getDocs(usersQuery);

          snapshot.forEach((doc) => {
            const userData = doc.data() as any;
            users.push({
              userData: { ...userData, uid: doc.id },
              role,
              collection: this.legacyCollection,
            });
          });

          lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        } catch (legacyError) {
          console.error("Error querying legacy collection:", legacyError);

          // If role filtering fails, get all users and filter client-side
          try {
            console.warn(
              "Attempting client-side filtering for legacy collection"
            );
            const allUsersQuery = query(
              collection(db, this.legacyCollection),
              limit(pageSize * 3) // Get more to account for filtering
            );

            const snapshot = await getDocs(allUsersQuery);

            snapshot.forEach((doc) => {
              const userData = doc.data() as any;
              if (userData.role === role) {
                users.push({
                  userData: { ...userData, uid: doc.id },
                  role,
                  collection: this.legacyCollection,
                });
              }
            });

            // Limit to requested page size
            users = users.slice(0, pageSize);
            lastVisibleDoc = null; // Disable pagination for client-side filtering
          } catch (finalError) {
            console.error("All legacy query attempts failed:", finalError);
          }
        }
      }

      return { users, lastVisible: lastVisibleDoc };
    } catch (error) {
      console.error(`Error getting users by role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Change user role (automatically migrates to new collections)
   */
  async changeUserRole(
    uid: string,
    newRole: UserRole,
    additionalData?: any
  ): Promise<void> {
    try {
      // Get current user data
      const currentUser = await this.getUserByUid(uid);
      if (!currentUser) {
        throw new Error("User not found");
      }

      // If role is the same, no need to move
      if (currentUser.role === newRole) {
        return;
      }

      const batch = writeBatch(db);
      const newCollectionName = this.getCollectionByRole(newRole);

      // Prepare new document data based on role
      let newDocumentData: any;
      switch (newRole) {
        case "admin":
          newDocumentData = {
            ...currentUser.userData,
            permissions: additionalData?.permissions || ["read", "write"],
            accessLevel: additionalData?.accessLevel || "standard",
            updatedAt: serverTimestamp(),
          };
          break;
        case "partner":
          newDocumentData = {
            ...currentUser.userData,
            businessName:
              additionalData?.businessName ||
              currentUser.userData.displayName ||
              "",
            businessAddress: additionalData?.businessAddress || "",
            businessPhone: additionalData?.businessPhone || "",
            verificationStatus: additionalData?.verificationStatus || "pending",
            partnershipDate: serverTimestamp(),
            businessInfo: additionalData?.businessInfo || {},
            updatedAt: serverTimestamp(),
          };
          break;
        case "user":
          newDocumentData = {
            ...currentUser.userData,
            preferences:
              additionalData?.preferences ||
              (currentUser.userData as any).preferences ||
              {},
            stats:
              additionalData?.stats ||
              (currentUser.userData as any).stats ||
              {},
            subscription:
              additionalData?.subscription ||
              (currentUser.userData as any).subscription ||
              {},
            updatedAt: serverTimestamp(),
          };
          break;
      }

      // Create new document in target collection
      const newDocRef = doc(db, newCollectionName, uid);
      batch.set(newDocRef, newDocumentData);

      // ALWAYS delete from old collection - whether it's legacy or new collection
      const oldDocRef = doc(db, currentUser.collection, uid);
      batch.delete(oldDocRef);

      // If moving from legacy collection, we need to be more careful
      if (currentUser.collection === this.legacyCollection) {
        console.log(
          `Migrating user ${uid} from legacy collection to ${newCollectionName}`
        );
      } else {
        console.log(
          `Moving user ${uid} from ${currentUser.collection} to ${newCollectionName}`
        );
      }

      await batch.commit();

      console.log(
        `User ${uid} role changed from ${currentUser.role} to ${newRole} and moved between collections`
      );
    } catch (error) {
      console.error("Error changing user role:", error);
      throw error;
    }
  }

  /**
   * Create new user with specific role (uses new collections)
   */
  async createUserWithRole(
    userData: Partial<BaseUserData>,
    role: UserRole,
    additionalData?: any
  ): Promise<string> {
    try {
      const collectionName = this.getCollectionByRole(role);
      const userId = userData.uid || doc(collection(db, collectionName)).id;

      let documentData: any;
      const baseData = {
        uid: userId,
        email: userData.email || "",
        displayName: userData.displayName || "",
        photoURL: userData.photoURL || null,
        phoneNumber: userData.phoneNumber || null,
        status: userData.status || "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: userData.lastLogin || null,
      };

      switch (role) {
        case "admin":
          documentData = {
            ...baseData,
            permissions: additionalData?.permissions || ["read", "write"],
            accessLevel: additionalData?.accessLevel || "standard",
          };
          break;
        case "partner":
          documentData = {
            ...baseData,
            businessName: additionalData?.businessName || "",
            businessAddress: additionalData?.businessAddress || "",
            businessPhone: additionalData?.businessPhone || "",
            verificationStatus: additionalData?.verificationStatus || "pending",
            partnershipDate: serverTimestamp(),
            businessInfo: additionalData?.businessInfo || {},
          };
          break;
        case "user":
        default:
          documentData = {
            ...baseData,
            preferences: additionalData?.preferences || {},
            stats: additionalData?.stats || {},
            subscription: additionalData?.subscription || {},
          };
          break;
      }

      await setDoc(doc(db, collectionName, userId), documentData);
      return userId;
    } catch (error) {
      console.error("Error creating user with role:", error);
      throw error;
    }
  }

  /**
   * Update user data in their current collection
   */
  async updateUser(
    uid: string,
    updateData: Partial<BaseUserData>
  ): Promise<void> {
    try {
      const currentUser = await this.getUserByUid(uid);
      if (!currentUser) {
        throw new Error("User not found");
      }

      const userRef = doc(db, currentUser.collection, uid);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Delete user from their current collection
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      const currentUser = await this.getUserByUid(uid);
      if (!currentUser) {
        throw new Error("User not found");
      }

      const userRef = doc(db, currentUser.collection, uid);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  /**
   * Get statistics across all collections (hybrid approach)
   */
  async getAllRoleStatistics(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    totalPartners: number;
    activeUsers: number;
    pendingPartners: number;
  }> {
    try {
      let totalUsers = 0,
        totalAdmins = 0,
        totalPartners = 0,
        activeUsers = 0,
        pendingPartners = 0;

      // Try new collections first
      try {
        const [usersSnapshot, adminsSnapshot, partnersSnapshot] =
          await Promise.all([
            getDocs(collection(db, this.newCollections.users)),
            getDocs(collection(db, this.newCollections.admins)),
            getDocs(collection(db, this.newCollections.partners)),
          ]);

        totalUsers = usersSnapshot.size;
        totalAdmins = adminsSnapshot.size;
        totalPartners = partnersSnapshot.size;

        // Count active users from new users collection
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.status === "active") {
            activeUsers++;
          }
        });

        // Count pending partners from new partners collection
        partnersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.verificationStatus === "pending") {
            pendingPartners++;
          }
        });
      } catch (error) {
        console.warn("New collections not accessible, using legacy:", error);

        // Fallback to legacy collection with simplified counting
        try {
          const allUsersSnapshot = await getDocs(
            collection(db, this.legacyCollection)
          );

          // Count by iterating through all documents (client-side filtering)
          allUsersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const userRole = userData.role || "user";

            // Count by role
            switch (userRole) {
              case "admin":
                totalAdmins++;
                break;
              case "partner":
                totalPartners++;
                // Check pending status for partners
                if (
                  !userData.verificationStatus ||
                  userData.verificationStatus === "pending"
                ) {
                  pendingPartners++;
                }
                break;
              case "user":
              default:
                totalUsers++;
                break;
            }

            // Count active users
            if (userData.status === "active" || !userData.status) {
              activeUsers++;
            }
          });
        } catch (legacyError) {
          console.warn(
            "Could not get statistics from legacy collection:",
            legacyError
          );
        }
      }

      return {
        totalUsers,
        totalAdmins,
        totalPartners,
        activeUsers,
        pendingPartners,
      };
    } catch (error) {
      console.error("Error getting role statistics:", error);
      throw error;
    }
  }

  // Helper methods
  private getCollectionByRole(role: UserRole): string {
    switch (role) {
      case "admin":
        return this.newCollections.admins;
      case "partner":
        return this.newCollections.partners;
      case "user":
      default:
        return this.newCollections.users;
    }
  }

  private getRoleByCollection(collectionName: string): UserRole {
    switch (collectionName) {
      case this.newCollections.admins:
        return "admin";
      case this.newCollections.partners:
        return "partner";
      case this.newCollections.users:
      default:
        return "user";
    }
  }
}

export const roleManagementService = new RoleManagementService();
export default roleManagementService;
