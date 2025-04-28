import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
  updateProfile,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../config/firebase";
import userProfileService from "../services/userProfileService";
import {
  UserProfile,
  ActivityType,
  ActivityLog,
  UserNotification,
} from "../types";

// Initialize Firebase app and auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create context
interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  // Fetch user profile when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          // Get user profile from Firestore
          const profile = await userProfileService.getCurrentUserProfile();
          setUserProfile(profile);

          // Check if we need to reset the daily coffee count
          await userProfileService.resetDailyCoffeeCount();

          // Log login activity if appropriate
          if (!profile) {
            // This might be a first login after registration, so don't log
          } else {
            await userProfileService.logActivity({
              type: ActivityType.LOGIN,
              status: "completed",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update the user profile with display name
      await updateProfile(user, {
        displayName: name,
      });

      // Create a user profile in Firestore
      await userProfileService.createUserProfile({
        displayName: name,
        role: "user",
      });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Log the logout activity
      if (user) {
        await userProfileService.logActivity({
          type: ActivityType.LOGOUT,
          status: "completed",
        });
      }

      // Sign out
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);

      // Log the password reset activity
      if (user) {
        await userProfileService.logActivity({
          type: ActivityType.PASSWORD_RESET,
          status: "completed",
        });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  // Wrapper functions for userProfileService
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    return await userProfileService.updateUserProfile(data);
  };

  const updateSubscription = async (data: any) => {
    return await userProfileService.updateSubscription(data);
  };

  const getActivityLogs = async (limit?: number, type?: ActivityType) => {
    return await userProfileService.getUserActivityLogs(limit, type);
  };

  const getNotifications = async (limit?: number) => {
    return await userProfileService.getUserNotifications(limit);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    return await userProfileService.markNotificationAsRead(notificationId);
  };

  const canRedeemCoffee = async () => {
    return await userProfileService.canRedeemCoffee();
  };

  const generateQRCode = async (cafeId: string, productId?: string) => {
    return await userProfileService.generateQRCode(cafeId, productId);
  };

  const redeemCoffee = async (
    cafeId: string,
    cafeName: string,
    productId?: string,
    productName?: string
  ) => {
    return await userProfileService.redeemCoffee(
      cafeId,
      cafeName,
      productId,
      productName
    );
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    updateSubscription,
    getActivityLogs,
    getNotifications,
    markNotificationAsRead,
    canRedeemCoffee,
    generateQRCode,
    redeemCoffee,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use the Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
