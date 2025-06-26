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
import { roleManagementService } from "../services/roleManagementService";
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
 * Tip pentru funcția resolver Google Sign-In
 */
type GoogleSignInResolver = (value: { role: string }) => void;

/**
 * Interfață care definește toate metodele disponibile în Firebase Context
 */
interface FirebaseContextType {
  /**
   * Utilizatorul Firebase autentificat curent
   */
  user: User | null;

  /**
   * Profilul utilizatorului extins cu informații adiționale
   */
  userProfile: UserProfile | null;

  /**
   * Starea de încărcare pentru operațiunile de autentificare
   */
  loading: boolean;

  /**
   * Autentifiez utilizatorul cu email și parolă
   * @param email Email-ul utilizatorului
   * @param password Parola utilizatorului
   * @returns Promise cu rolul utilizatorului
   */
  login: (email: string, password: string) => Promise<{ role: string }>;

  /**
   * Înregistrez utilizator nou
   * @param email Email-ul utilizatorului
   * @param password Parola utilizatorului
   * @param name Numele afișat al utilizatorului
   * @returns Promise cu statusul de succes și statusul email-ului de verificare
   */
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; verificationSent: boolean }>;

  /**
   * Deloghez utilizatorul curent
   */
  logout: () => Promise<void>;

  /**
   * Trimit email de resetare parolă
   * @param email Email-ul utilizatorului
   */
  resetPassword: (email: string) => Promise<void>;

  /**
   * Trimit email de verificare către utilizatorul curent
   */
  sendVerificationEmail: () => Promise<void>;

  /**
   * Autentifiez cu contul Google
   * @returns Promise cu rolul utilizatorului
   */
  signInWithGoogle: () => Promise<{ role: string }>;

  /**
   * Actualizez profilul utilizatorului
   * @param data Date parțiale ale profilului utilizatorului de actualizat
   */
  updateUserProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;

  /**
   * Actualizez informațiile abonamentului
   * @param data Datele abonamentului
   */
  updateSubscription: (data: any) => Promise<UserProfile>;

  /**
   * Obțin jurnalele de activitate ale utilizatorului
   * @param limit Limita opțională a înregistrărilor de returnat
   * @param type Filtrul opțional pentru tipul de activitate
   */
  getActivityLogs: (
    limit?: number,
    type?: ActivityType
  ) => Promise<ActivityLog[]>;

  /**
   * Obțin notificările utilizatorului
   * @param limit Limita opțională a înregistrărilor de returnat
   */
  getNotifications: (limit?: number) => Promise<UserNotification[]>;

  /**
   * Marchez notificarea ca citită
   * @param notificationId ID-ul notificării de marcat
   */
  markNotificationAsRead: (notificationId: string) => Promise<void>;

  /**
   * Verific dacă utilizatorul poate răscumpăra o cafea
   */
  canRedeemCoffee: () => Promise<{ canRedeem: boolean; reason?: string }>;

  /**
   * Generez cod QR pentru răscumpărarea cafelei
   * @param cafeId ID-ul cafenelei
   * @param productId ID-ul opțional al produsului
   */
  generateQRCode: (cafeId: string, productId?: string) => Promise<QRCodeData>;

  /**
   * Verific și răscumpăr un cod QR
   * @param qrCodeData Datele codului QR de verificat
   */
  verifyAndRedeemQRCode: (
    qrCodeData: any
  ) => Promise<{ success: boolean; message: string }>;

  /**
   * Răscumpăr o cafea
   * @param cafeId ID-ul cafenelei
   * @param cafeName Numele cafenelei
   * @param productId ID-ul opțional al produsului
   * @param productName Numele opțional al produsului
   */
  redeemCoffee: (
    cafeId: string,
    cafeName: string,
    productId?: string,
    productName?: string
  ) => Promise<void>;

  /**
   * Trimit cerere de parteneriat
   * @param data Datele cererii de parteneriat
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
   * Obțin profilul utilizatorului curent
   */
  getCurrentUserProfile: () => Promise<UserProfile | null>;
}

/**
 * Instanța contextului Firebase
 */
const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

/**
 * Componenta provider Firebase
 */
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Ref pentru a stoca resolver-ul Google Sign-In
  const googleSignInResolverRef = useRef<GoogleSignInResolver | null>(null);

  // Configurez Google Auth
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
        .then(async (result) => {
          console.log(
            "Successfully signed in with Google Firebase credential for:",
            result.user.email
          );

          // Obțin rolul real al utilizatorului folosind serviciul de management de roluri
          try {
            const userSearchResult = await roleManagementService.getUserByUid(
              result.user.uid
            );
            const role = userSearchResult?.role || "user";

            if (googleSignInResolverRef.current) {
              googleSignInResolverRef.current({ role });
              googleSignInResolverRef.current = null;
            }
          } catch (error) {
            console.error(
              "Error getting user role after Google sign-in:",
              error
            );
            if (googleSignInResolverRef.current) {
              googleSignInResolverRef.current({ role: "user" });
              googleSignInResolverRef.current = null;
            }
          }
        })
        .catch((error: AuthError) => {
          console.error(
            "Error signing in with Google Firebase credential:",
            error
          );
          if (googleSignInResolverRef.current) {
            googleSignInResolverRef.current({ role: "user" }); // Rezolv cu rolul implicit chiar și la eroare
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
        googleSignInResolverRef.current({ role: "user" }); // Rezolv cu rolul implicit
        googleSignInResolverRef.current = null;
      }
    }
  }, [response]);

  // Obțin profilul utilizatorului când starea de autentificare se schimbă
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        console.log("Auth state changed, user detected:", currentUser.uid);
        try {
          // Mai întâi încerc să obțin utilizatorul din serviciul de management de roluri (verifică toate colecțiile)
          const userSearchResult = await roleManagementService.getUserByUid(
            currentUser.uid
          );

          if (userSearchResult) {
            console.log(
              "User found in collection:",
              userSearchResult.collection,
              "with role:",
              userSearchResult.role
            );
            // Convert rezultatul căutării în formatul UserProfile
            const profile: UserProfile = {
              ...userSearchResult.userData,
              role: userSearchResult.role,
            } as UserProfile;
            setUserProfile(profile);
          } else {
            // Dacă nu este găsit în nicio colecție, încerc metoda legacy
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
          }
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
   * Autentifiez cu email și parolă
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

      // Folosesc serviciul de management de roluri pentru a obține datele utilizatorului din orice colecție
      const userSearchResult = await roleManagementService.getUserByUid(
        userCredential.user.uid
      );

      if (userSearchResult) {
        console.log(
          "User found in collection:",
          userSearchResult.collection,
          "with role:",
          userSearchResult.role
        );
        return { role: userSearchResult.role };
      }

      // Fallback la metoda legacy
      const profile = await userProfileService.getCurrentUserProfile();
      return { role: profile?.role || "user" };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * Înregistrez utilizator nou
   */
  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; verificationSent: boolean }> => {
    try {
      // Import și folosesc explicit 'auth' tipat din configurația firebase
      // (Presupun că 'auth' este importat din '../config/firebase')
      const userCredential = await createUserWithEmailAndPassword(
        auth as import("firebase/auth").Auth,
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
   * Deloghez utilizatorul curent
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
   * Trimit email de resetare parolă
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
   * Trimit email de verificare către utilizatorul curent
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
   * Autentifiez cu contul Google
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
