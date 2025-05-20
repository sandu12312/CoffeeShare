import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
  AuthError,
} from "firebase/auth";
import { app, auth, db } from "../config/firebase";
import { userProfileService } from "../services/userProfileService";
import {
  UserProfile,
  ActivityType,
  ActivityLog,
  UserNotification,
  QRCodeData,
} from "../types";
import {
  collection,
  addDoc,
  serverTimestamp,
  FirestoreError,
} from "firebase/firestore";
import * as Google from "expo-auth-session/providers/google";
import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * Type for Google Sign-In resolver function
 */
type GoogleSignInResolver = (value: { role: string }) => void;

/**
 * Interface defining all methods available in Firebase Context
 */
interface FirebaseContextType {
  /**
   * Current authenticated Firebase user
   */
  user: User | null;

  /**
   * Extended user profile with additional information
   */
  userProfile: UserProfile | null;

  /**
   * Loading state for auth operations
   */
  loading: boolean;

  /**
   * Log in user with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with user role
   */
  login: (email: string, password: string) => Promise<{ role: string }>;

  /**
   * Register new user
   * @param email User email
   * @param password User password
   * @param name User display name
   * @returns Promise with success status and verification email status
   */
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; verificationSent: boolean }>;

  /**
   * Log out the current user
   */
  logout: () => Promise<void>;

  /**
   * Send password reset email
   * @param email User email
   */
  resetPassword: (email: string) => Promise<void>;

  /**
   * Send email verification to current user
   */
  sendVerificationEmail: () => Promise<void>;

  /**
   * Sign in with Google account
   * @returns Promise with user role
   */
  signInWithGoogle: () => Promise<{ role: string }>;

  /**
   * Update user profile
   * @param data Partial user profile data to update
   */
  updateUserProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;

  /**
   * Update subscription information
   * @param data Subscription data
   */
  updateSubscription: (data: any) => Promise<UserProfile>;

  /**
   * Get user activity logs
   * @param limit Optional limit of records to return
   * @param type Optional activity type filter
   */
  getActivityLogs: (
    limit?: number,
    type?: ActivityType
  ) => Promise<ActivityLog[]>;

  /**
   * Get user notifications
   * @param limit Optional limit of records to return
   */
  getNotifications: (limit?: number) => Promise<UserNotification[]>;

  /**
   * Mark notification as read
   * @param notificationId ID of notification to mark
   */
  markNotificationAsRead: (notificationId: string) => Promise<void>;

  /**
   * Check if user can redeem a coffee
   */
  canRedeemCoffee: () => Promise<{ canRedeem: boolean; reason?: string }>;

  /**
   * Generate QR code for coffee redemption
   * @param cafeId ID of cafe
   * @param productId Optional product ID
   */
  generateQRCode: (cafeId: string, productId?: string) => Promise<QRCodeData>;

  /**
   * Verify and redeem a QR code
   * @param qrCodeData QR code data to verify
   */
  verifyAndRedeemQRCode: (
    qrCodeData: any
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * Redeem a coffee
   * @param cafeId ID of cafe
   * @param cafeName Name of cafe
   * @param productId Optional product ID
   * @param productName Optional product name
   */
  redeemCoffee: (
    cafeId: string,
    cafeName: string,
    productId?: string,
    productName?: string
  ) => Promise<void>;

  /**
   * Submit partnership request
   * @param data Partnership request data
   */
  submitPartnershipRequest: (data: {
    businessName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    message?: string;
  }) => Promise<{
    success: boolean;
    requestId: string;
  }>;

  /**
   * Get current user profile
   */
  getCurrentUserProfile: () => Promise<UserProfile | null>;
}

/**
 * Firebase context instance
 */
const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

/**
 * Firebase provider component
 */
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Ref to store Google Sign-In resolver
  const googleSignInResolverRef = useRef<GoogleSignInResolver | null>(null);

  // Configure Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "YOUR_ANDROID_CLIENT_ID_HERE",
    iosClientId: "YOUR_IOS_CLIENT_ID_HERE",
    webClientId:
      "947075506777-28sln64gq9eenm7aqd98qh2c8fop47ot.apps.googleusercontent.com",
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
  });

  const functions = getFunctions(app);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === "success") {
      console.log("Google Auth Response Success:", response.params);
      const { id_token } = response.params;
      if (!id_token) {
        console.error("Google response success but no id_token found");
        if (googleSignInResolverRef.current) {
          googleSignInResolverRef.current({ role: "user" }); // Resolve with default role
          googleSignInResolverRef.current = null;
        }
        return;
      }
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((result) => {
          console.log(
            "Successfully signed in with Google Firebase credential for:",
            result.user.email
          );
          // Resolve the promise with a role (will be updated to actual role in onAuthStateChanged)
          if (googleSignInResolverRef.current) {
            googleSignInResolverRef.current({ role: "user" });
            googleSignInResolverRef.current = null;
          }
        })
        .catch((error: AuthError) => {
          console.error(
            "Error signing in with Google Firebase credential:",
            error
          );
          if (googleSignInResolverRef.current) {
            googleSignInResolverRef.current({ role: "user" }); // Resolve with default role even on error
            googleSignInResolverRef.current = null;
          }
        });
    } else if (
      response?.type === "error" ||
      response?.type === "cancel" ||
      response?.type === "dismiss"
    ) {
      console.warn("Google Auth Response was not successful:", response);
      if (googleSignInResolverRef.current) {
        googleSignInResolverRef.current({ role: "user" }); // Resolve with default role
        googleSignInResolverRef.current = null;
      }
    }
  }, [response]);

  // Fetch user profile when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        console.log("Auth state changed, user detected:", currentUser.uid);
        try {
          let profile = await userProfileService.getCurrentUserProfile();
          console.log("Existing profile check:", profile);
          if (!profile) {
            console.log("No profile found, attempting to create one.");
            const displayName = currentUser.displayName || "";
            const photoURL = currentUser.photoURL || "";
            const email = currentUser.email || "";

            if (email) {
              profile = await userProfileService.createUserProfile({
                displayName,
                photoURL,
                email,
                role: "user",
              });
              console.log("New profile created:", profile);
            } else {
              console.warn(
                "Cannot create profile: missing email for user",
                currentUser.uid
              );
            }
          }
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching/creating user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ role: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const profile = await userProfileService.getCurrentUserProfile();
      return { role: profile?.role || "user" };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * Register new user
   */
  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; verificationSent: boolean }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: name });
      await userProfileService.createUserProfile({
        displayName: name,
        email,
        role: "user",
      });
      await sendEmailVerification(userCredential.user);
      return { success: true, verificationSent: true };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  /**
   * Logout current user
   */
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  /**
   * Send verification email to current user
   */
  const sendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error("Send verification email error:", error);
      throw error;
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (): Promise<{ role: string }> => {
    try {
      await promptAsync();
      return new Promise((resolve) => {
        googleSignInResolverRef.current = resolve;
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  /**
   * Update user profile
   */
  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<UserProfile> => {
    try {
      return await userProfileService.updateUserProfile(data);
    } catch (error) {
      console.error("Update user profile error:", error);
      throw error;
    }
  };

  /**
   * Update subscription
   */
  const updateSubscription = async (data: any): Promise<UserProfile> => {
    try {
      return await userProfileService.updateSubscription(data);
    } catch (error) {
      console.error("Update subscription error:", error);
      throw error;
    }
  };

  /**
   * Get activity logs
   */
  const getActivityLogs = async (
    limit?: number,
    type?: ActivityType
  ): Promise<ActivityLog[]> => {
    try {
      return await userProfileService.getActivityLogs(limit, type);
    } catch (error) {
      console.error("Get activity logs error:", error);
      throw error;
    }
  };

  /**
   * Get user notifications
   */
  const getNotifications = async (
    limit?: number
  ): Promise<UserNotification[]> => {
    try {
      return await userProfileService.getUserNotifications(limit);
    } catch (error) {
      console.error("Get notifications error:", error);
      throw error;
    }
  };

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = async (
    notificationId: string
  ): Promise<void> => {
    try {
      await userProfileService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      throw error;
    }
  };

  /**
   * Check if user can redeem coffee
   */
  const canRedeemCoffee = async (): Promise<{
    canRedeem: boolean;
    reason?: string;
  }> => {
    try {
      return await userProfileService.canRedeemCoffee();
    } catch (error) {
      console.error("Can redeem coffee error:", error);
      throw error;
    }
  };

  /**
   * Generate QR code
   */
  const generateQRCode = async (
    cafeId: string,
    productId?: string
  ): Promise<QRCodeData> => {
    try {
      const generateQRCodeFunction = httpsCallable(functions, "generateQRCode");
      const result = await generateQRCodeFunction({ cafeId, productId });
      return result.data as QRCodeData;
    } catch (error) {
      console.error("Generate QR code error:", error);
      throw error;
    }
  };

  /**
   * Verify and redeem QR code
   */
  const verifyAndRedeemQRCode = async (
    qrCodeData: any
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const verifyQRCodeFunction = httpsCallable(
        functions,
        "verifyAndRedeemQRCode"
      );
      const result = await verifyQRCodeFunction({ qrCodeData });
      return result.data as { success: boolean; message: string };
    } catch (error) {
      console.error("Verify QR code error:", error);
      throw error;
    }
  };

  /**
   * Redeem coffee
   */
  const redeemCoffee = async (
    cafeId: string,
    cafeName: string,
    productId?: string,
    productName?: string
  ): Promise<void> => {
    try {
      await userProfileService.redeemCoffee(
        cafeId,
        cafeName,
        productId,
        productName
      );
    } catch (error) {
      console.error("Redeem coffee error:", error);
      throw error;
    }
  };

  /**
   * Submit partnership request
   */
  const submitPartnershipRequest = async (data: {
    businessName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    message?: string;
  }): Promise<{ success: boolean; requestId: string }> => {
    try {
      const partnershipRef = await addDoc(
        collection(db, "partnershipRequests"),
        {
          ...data,
          status: "pending",
          createdAt: serverTimestamp(),
        }
      );

      return {
        success: true,
        requestId: partnershipRef.id,
      };
    } catch (error) {
      console.error("Error submitting partnership request:", error);
      throw error;
    }
  };

  /**
   * Get current user profile
   */
  const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    try {
      return await userProfileService.getCurrentUserProfile();
    } catch (error) {
      console.error("Get current user profile error:", error);
      throw error;
    }
  };

  // Context value to be provided
  const value: FirebaseContextType = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    sendVerificationEmail,
    signInWithGoogle,
    updateUserProfile,
    updateSubscription,
    getActivityLogs,
    getNotifications,
    markNotificationAsRead,
    canRedeemCoffee,
    generateQRCode,
    verifyAndRedeemQRCode,
    redeemCoffee,
    submitPartnershipRequest,
    getCurrentUserProfile,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to use Firebase context
 * @throws Error if used outside FirebaseProvider
 */
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
