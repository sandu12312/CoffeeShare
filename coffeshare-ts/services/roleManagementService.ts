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
 * Serviciu de Management de Roluri Hibrid
 * Funcționează atât cu colecția unică veche, cât și cu colecțiile noi bazate pe roluri
 * Migrează automat utilizatorii când sunt accesați/modificați
 */
class RoleManagementService {
  private readonly newCollections = {
    users: "users",
    admins: "admins",
    partners: "coffeePartners",
  };

  private readonly legacyCollection = "users";

  /**
   * Obțin datele utilizatorului și rolul din orice colecție (abordare hibridă)
   */
  async getUserByUid(uid: string): Promise<UserSearchResult | null> {
    try {
      // Verific colecțiile în ordinea priorității: mai întâi admini, apoi parteneri, apoi utilizatori
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
          // Continui dacă colecția nu există încă
          console.warn(
            `Collection ${collectionInfo.name} not accessible:`,
            error
          );
        }
      }

      // Fallback la colecția legacy (colecția users cu câmpul role)
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
   * Caut utilizatori în toate colecțiile (abordare hibridă)
   */
  async searchUsers(
    searchQuery: string,
    roleFilter?: UserRole
  ): Promise<UserSearchResult[]> {
    try {
      const results: UserSearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Caut mai întâi în colecțiile noi
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

      // Dacă nu am rezultate din colecțiile noi, caut în colecția legacy
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

            // Aplic filtrul de rol dacă este specificat
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
   * Obțin toți utilizatorii dintr-un rol specific (abordare hibridă)
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

      // Încerc mai întâi colecția nouă
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

        // Fallback la colecția legacy cu query simplificat
        try {
          // Query simplu fără cerințe complexe de index
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

          // Dacă filtrarea pe rol eșuează, obțin toți utilizatorii și filtrez pe partea clientului
          try {
            console.warn(
              "Attempting client-side filtering for legacy collection"
            );
            const allUsersQuery = query(
              collection(db, this.legacyCollection),
              limit(pageSize * 3) // Obțin mai mulți pentru a compensa filtrarea
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

            // Limitez la dimensiunea paginii cerute
            users = users.slice(0, pageSize);
            lastVisibleDoc = null; // Dezactivez paginarea pentru filtrarea pe partea clientului
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
   * Schimb rolul utilizatorului (migrează automat la colecțiile noi)
   */
  async changeUserRole(
    uid: string,
    newRole: UserRole,
    additionalData?: any
  ): Promise<void> {
    try {
      // Obțin datele utilizatorului curent
      const currentUser = await this.getUserByUid(uid);
      if (!currentUser) {
        throw new Error("User not found");
      }

      // Dacă rolul este același, nu trebuie să mut
      if (currentUser.role === newRole) {
        return;
      }

      const batch = writeBatch(db);
      const newCollectionName = this.getCollectionByRole(newRole);

      // Prepar datele noului document bazat pe rol
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

      // Creez documentul nou în colecția țintă
      const newDocRef = doc(db, newCollectionName, uid);
      batch.set(newDocRef, newDocumentData);

      // ÎNTOTDEAUNA șterg din colecția veche - fie că este legacy sau colecție nouă
      const oldDocRef = doc(db, currentUser.collection, uid);
      batch.delete(oldDocRef);

      // Dacă mut din colecția legacy, trebuie să fiu mai atent
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
   * Creez utilizator nou cu rol specific (folosește colecțiile noi)
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
   * Actualizez datele utilizatorului în colecția lor curentă
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
   * Șterg utilizatorul din colecția lor curentă
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
   * Obțin statistici prin toate colecțiile (abordare hibridă)
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

      // Încerc mai întâi colecțiile noi
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

        // Număr utilizatorii activi din colecția nouă de utilizatori
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.status === "active") {
            activeUsers++;
          }
        });

        // Număr partenerii în așteptare din colecția nouă de parteneri
        partnersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.verificationStatus === "pending") {
            pendingPartners++;
          }
        });
      } catch (error) {
        console.warn("New collections not accessible, using legacy:", error);

        // Fallback la colecția legacy cu numărare simplificată
        try {
          const allUsersSnapshot = await getDocs(
            collection(db, this.legacyCollection)
          );

          // Număr iterând prin toate documentele (filtrare pe partea clientului)
          allUsersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const userRole = userData.role || "user";

            // Număr pe rol
            switch (userRole) {
              case "admin":
                totalAdmins++;
                break;
              case "partner":
                totalPartners++;
                // Verific status-ul în așteptare pentru parteneri
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

            // Număr utilizatorii activi
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

  // Metode de ajutor
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
