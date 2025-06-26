import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../config/firebase";
import {
  roleManagementService,
  UserRole,
  UserSearchResult,
} from "./roleManagementService";

const auth = getAuth(app);
const db = getFirestore(app);

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  isActive: boolean;
  collection: string;
  userData?: any;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

/**
 * Serviciu de Autentificare Hibrid cu Colecții Bazate pe Roluri
 * Funcționează atât cu colecția legacy unică cât și cu colecțiile noi bazate pe roluri
 */
class AuthService {
  private authStateListeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    this.initializeAuthListener();
  }

  /**
   * Inițializez listener-ul de stare Firebase Auth
   */
  private initializeAuthListener(): void {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const authUser = await this.getAuthUserFromFirebaseUser(firebaseUser);
          this.notifyAuthStateListeners(authUser);
        } catch (error) {
          console.error("Error getting auth user:", error);
          this.notifyAuthStateListeners(null);
        }
      } else {
        this.notifyAuthStateListeners(null);
      }
    });
  }

  /**
   * Obțin utilizatorul autentificat cu informații despre rol (abordare hibridă)
   */
  private async getAuthUserFromFirebaseUser(
    firebaseUser: FirebaseUser
  ): Promise<AuthUser | null> {
    try {
      // Folosesc serviciul hibrid de management al rolurilor
      const userSearchResult = await roleManagementService.getUserByUid(
        firebaseUser.uid
      );

      if (!userSearchResult) {
        // Dacă utilizatorul nu e găsit nicăieri, trebuie creat un profil de bază
        console.warn(
          "User not found in any collection, may need profile creation"
        );
        return null;
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName:
          firebaseUser.displayName ||
          userSearchResult.userData.displayName ||
          "",
        photoURL: firebaseUser.photoURL || userSearchResult.userData.photoURL,
        role: userSearchResult.role,
        isActive: userSearchResult.userData.status === "active",
        collection: userSearchResult.collection,
        userData: userSearchResult.userData,
      };
    } catch (error) {
      console.error("Error getting auth user from Firebase user:", error);
      return null;
    }
  }

  /**
   * Adaug listener pentru starea de autentificare
   */
  addAuthStateListener(listener: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(listener);

    // Returnez funcția de dezabonare
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notific toți listenerii de stare de autentificare
   */
  private notifyAuthStateListeners(user: AuthUser | null): void {
    this.authStateListeners.forEach((listener) => listener(user));
  }

  /**
   * Autentific utilizatorul (abordare hibridă)
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const authUser = await this.getAuthUserFromFirebaseUser(
        userCredential.user
      );

      if (!authUser) {
        throw new Error("User data not found in any collection");
      }

      if (!authUser.isActive) {
        throw new Error("Account is not active");
      }

      // Actualizez ultima autentificare
      await this.updateLastLogin(authUser.uid, authUser.collection);

      return authUser;
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "Failed to sign in");
    }
  }

  /**
   * Deconectez utilizatorul
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  /**
   * Obțin utilizatorul autentificat curent (abordare hibridă)
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    return await this.getAuthUserFromFirebaseUser(firebaseUser);
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: UserRole): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.role === role;
  }

  /**
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    return await this.hasRole("admin");
  }

  /**
   * Check if user is partner
   */
  async isPartner(): Promise<boolean> {
    return await this.hasRole("partner");
  }

  /**
   * Check if user is regular user
   */
  async isUser(): Promise<boolean> {
    return await this.hasRole("user");
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(roles: UserRole[]): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return false;

    return roles.includes(currentUser.role);
  }

  /**
   * Get user role
   */
  async getUserRole(): Promise<UserRole | null> {
    const currentUser = await this.getCurrentUser();
    return currentUser?.role || null;
  }

  /**
   * Check if current user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Update user profile information (hybrid approach)
   */
  async updateUserProfile(data: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("No authenticated user");

    try {
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, data);

      // Update user data in the appropriate collection using role management service
      await roleManagementService.updateUser(firebaseUser.uid, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  /**
   * Update last login timestamp (hybrid approach)
   */
  private async updateLastLogin(
    uid: string,
    collection: string
  ): Promise<void> {
    try {
      const userRef = doc(db, collection, uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating last login:", error);
      // Don't throw error for this as it's not critical
    }
  }

  /**
   * Refresh current user data
   */
  async refreshUser(): Promise<AuthUser | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    return await this.getAuthUserFromFirebaseUser(firebaseUser);
  }

  /**
   * Check user access level for admins (hybrid approach)
   */
  async getAdminAccessLevel(): Promise<"super" | "standard" | null> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== "admin") return null;

    const userData = currentUser.userData;
    return userData?.accessLevel || "standard";
  }

  /**
   * Check partner verification status (hybrid approach)
   */
  async getPartnerVerificationStatus(): Promise<
    "pending" | "verified" | "rejected" | null
  > {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== "partner") return null;

    const userData = currentUser.userData;

    // For legacy data without verificationStatus, assume verified
    if (!userData?.verificationStatus && currentUser.role === "partner") {
      return "verified";
    }

    return userData?.verificationStatus || "pending";
  }

  /**
   * Check if partner is verified (hybrid approach)
   */
  async isVerifiedPartner(): Promise<boolean> {
    const status = await this.getPartnerVerificationStatus();
    return status === "verified";
  }

  /**
   * Get user permissions (for admins) (hybrid approach)
   */
  async getUserPermissions(): Promise<string[]> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== "admin") return [];

    const userData = currentUser.userData;

    // For legacy admin data without permissions, give default permissions
    if (!userData?.permissions && currentUser.role === "admin") {
      return ["read", "write", "manage_users"];
    }

    return userData?.permissions || ["read"];
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.includes(permission);
  }

  /**
   * Auto-migrate user to new collection structure when needed
   */
  async autoMigrateUserIfNeeded(uid: string): Promise<void> {
    try {
      const currentUser = await roleManagementService.getUserByUid(uid);

      // If user is in legacy collection, migrate them
      if (
        currentUser &&
        currentUser.collection === "users" &&
        currentUser.role !== "user"
      ) {
        console.log(
          `Auto-migrating user ${uid} with role ${currentUser.role} to new collections`
        );

        await roleManagementService.changeUserRole(
          uid,
          currentUser.role,
          currentUser.userData
        );
      }
    } catch (error) {
      console.warn("Auto-migration failed:", error);
      // Don't throw - this is a background operation
    }
  }
}

export const authService = new AuthService();
export default authService;
