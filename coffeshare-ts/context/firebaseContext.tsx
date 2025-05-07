import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import {
  getAuth,
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
} from "firebase/auth";
import { app } from "../config/firebase";
import { userProfileService } from "../services/userProfileService";
import {
  UserProfile,
  ActivityType,
  ActivityLog,
  UserNotification,
} from "../types";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import * as Google from "expo-auth-session/providers/google";

// Initialize auth using the imported app
const auth = getAuth(app);

// Define type for Google Sign-In resolver
type GoogleSignInResolver = (value: { role: string }) => void;

// Create context
interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; verificationSent: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  signInWithGoogle: () => Promise<{ role: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  updateSubscription: (data: any) => Promise<UserProfile>;
  getActivityLogs: (
    limit?: number,
    type?: ActivityType
  ) => Promise<ActivityLog[]>;
  getNotifications: (limit?: number) => Promise<UserNotification[]>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  canRedeemCoffee: () => Promise<{ canRedeem: boolean; reason?: string }>;
  generateQRCode: (cafeId: string, productId?: string) => Promise<any>;
  redeemCoffee: (
    cafeId: string,
    cafeName: string,
    productId?: string,
    productName?: string
  ) => Promise<void>;
  submitPartnershipRequest: (data: {
    businessName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    message?: string;
  }) => Promise<{ success: boolean; requestId: string }>;
  getCurrentUserProfile: () => Promise<UserProfile | null>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

// Provider component
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === "success") {
      console.log("Google Auth Response Success:", response.params);
      const { id_token } = response.params;
      if (!id_token) {
        console.error("Google response success but no id_token found");
        if (googleSignInResolverRef.current) {
          console.error(
            "Cannot reject Google sign-in promise: no rejector stored."
          );
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
        })
        .catch((error) => {
          console.error(
            "Error signing in with Google Firebase credential:",
            error
          );
          if (googleSignInResolverRef.current) {
            console.error(
              "Cannot reject Google sign-in promise: no rejector stored."
            );
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
        console.error(
          "Cannot reject Google sign-in promise: no rejector stored."
        );
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

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  const sendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error("Send verification email error:", error);
      throw error;
    }
  };

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

  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<UserProfile> => {
    return await userProfileService.updateUserProfile(data);
  };

  const updateSubscription = async (data: any): Promise<UserProfile> => {
    return await userProfileService.updateSubscription(data);
  };

  const getActivityLogs = async (
    limit?: number,
    type?: ActivityType
  ): Promise<ActivityLog[]> => {
    return await userProfileService.getActivityLogs(limit, type);
  };

  const getNotifications = async (
    limit?: number
  ): Promise<UserNotification[]> => {
    return await userProfileService.getUserNotifications(limit);
  };

  const markNotificationAsRead = async (
    notificationId: string
  ): Promise<void> => {
    await userProfileService.markNotificationAsRead(notificationId);
  };

  const canRedeemCoffee = async (): Promise<{
    canRedeem: boolean;
    reason?: string;
  }> => {
    return await userProfileService.canRedeemCoffee();
  };

  const generateQRCode = async (
    cafeId: string,
    productId?: string
  ): Promise<any> => {
    return await userProfileService.generateQRCode(cafeId, productId);
  };

  const redeemCoffee = async (
    cafeId: string,
    cafeName: string,
    productId?: string,
    productName?: string
  ): Promise<void> => {
    await userProfileService.redeemCoffee(
      cafeId,
      cafeName,
      productId,
      productName
    );
  };

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

  const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    return await userProfileService.getCurrentUserProfile();
  };

  const value = {
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

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
