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
import userProfileService from "../services/userProfileService";
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

// Definim tipul pentru funcția de rezolvare a promise-ului Google
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

  // Ref pentru a stoca funcția de rezolvare a promise-ului Google
  const googleSignInResolverRef = useRef<GoogleSignInResolver | null>(null);

  // Configure Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    // *** IMPORTANT: Replace placeholder IDs with your actual Client IDs ***
    androidClientId: "YOUR_ANDROID_CLIENT_ID_HERE", // <-- Replace this
    iosClientId: "YOUR_IOS_CLIENT_ID_HERE", // <-- Replace this
    webClientId:
      "947075506777-28sln64gq9eenm7aqd98qh2c8fop47ot.apps.googleusercontent.com", // Keep your existing Web ID
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
        // Respingem promise-ul dacă există unul în așteptare
        // (Deși nu avem un rejector stocat, ideal ar fi să avem)
        if (googleSignInResolverRef.current) {
          // TODO: Ideal ar fi să avem și un rejector stocat
          console.error(
            "Cannot reject Google sign-in promise: no rejector stored."
          );
          googleSignInResolverRef.current = null; // Resetăm resolver-ul
        }
        return;
      }
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((result) => {
          // Autentificarea Firebase a reușit
          console.log(
            "Successfully signed in with Google Firebase credential for:",
            result.user.email
          );
          // Acum user-ul ar trebui să fie setat de onAuthStateChanged
          // Putem încerca să obținem profilul aici sau să așteptăm onAuthStateChanged
          // Vom lăsa onAuthStateChanged să se ocupe, dar rezolvăm promise-ul Google
          // după ce ne asigurăm că profilul a fost creat/preluat (în onAuthStateChanged)
        })
        .catch((error) => {
          console.error(
            "Error signing in with Google Firebase credential:",
            error
          );
          // Respingem promise-ul dacă există
          if (googleSignInResolverRef.current) {
            // TODO: Ideal ar fi să avem și un rejector stocat
            console.error(
              "Cannot reject Google sign-in promise: no rejector stored."
            );
            googleSignInResolverRef.current = null; // Resetăm resolver-ul
          }
        });
    } else if (
      response?.type === "error" ||
      response?.type === "cancel" ||
      response?.type === "dismiss"
    ) {
      console.warn("Google Auth Response was not successful:", response);
      // Respingem promise-ul dacă a fost anulat/eșuat la nivel de prompt
      if (googleSignInResolverRef.current) {
        // TODO: Ideal ar fi să avem și un rejector stocat
        console.error(
          "Cannot reject Google sign-in promise: no rejector stored."
        );
        googleSignInResolverRef.current = null; // Resetăm resolver-ul
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
            // Verificăm dacă e posibil să fie o nouă înregistrare Google
            // (Ideal ar fi să avem informații din userCredential dacă e posibil)
            const displayName = currentUser.displayName || "";
            const photoURL = currentUser.photoURL || "";
            const email = currentUser.email || "";

            if (email) {
              // Creăm profil doar dacă avem email
              profile = await userProfileService.createUserProfile({
                displayName,
                photoURL,
                email,
                role: "user", // Rol implicit pentru înregistrări noi
              });
              console.log("New profile created:", profile);
            } else {
              console.warn(
                "Cannot create profile: missing email for user",
                currentUser.uid
              );
              profile = null; // Asigurăm că profilul e null dacă nu s-a creat
            }
          }
          setUserProfile(profile);

          // Rezolvăm promise-ul Google dacă există și avem un profil
          if (googleSignInResolverRef.current && profile) {
            console.log(
              "Resolving Google sign-in promise with role:",
              profile.role
            );
            googleSignInResolverRef.current({ role: profile.role || "user" });
            googleSignInResolverRef.current = null; // Consumăm resolver-ul
          } else if (googleSignInResolverRef.current && !profile) {
            console.warn(
              "Google sign-in promise exists but no profile found/created. Cannot resolve role."
            );
            // TODO: Ideal ar fi să respingem promise-ul aici
            googleSignInResolverRef.current = null; // Resetăm oricum
          }
        } catch (error) {
          console.error("Error fetching/creating user profile:", error);
          setUserProfile(null);
          // Respingem promise-ul Google în caz de eroare la profil
          if (googleSignInResolverRef.current) {
            // TODO: Ideal ar fi să avem și un rejector stocat
            console.error(
              "Cannot reject Google sign-in promise on profile error: no rejector stored."
            );
            googleSignInResolverRef.current = null; // Resetăm resolver-ul
          }
        }
      } else {
        console.log("Auth state changed, no user detected.");
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Get the user profile to check their role
      const profile = await userProfileService.getCurrentUserProfile();

      if (!profile) {
        throw new Error("User profile not found");
      }

      // Return the user's role for redirection
      return { role: profile.role };
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

      // Send verification email
      await sendEmailVerification(user);

      // Update the user profile with display name
      await updateProfile(user, {
        displayName: name,
      });

      // Create a user profile in Firestore with minimal data first
      await userProfileService.createBasicUserProfile({
        displayName: name,
        role: "user",
      });

      // Return success and verification status
      return { success: true, verificationSent: true };
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

  // Add new function to send verification email
  const sendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      await sendEmailVerification(user);
      return;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  // Update the signInWithGoogle function to return a Promise resolving the role
  const signInWithGoogle = (): Promise<{ role: string }> => {
    // Returnăm o nouă Promise
    return new Promise((resolve, reject) => {
      console.log("Initiating Google Sign-In prompt...");
      // Stocăm funcția de rezolvare (și ideal ar fi și reject)
      googleSignInResolverRef.current = resolve;
      // TODO: Stochează și 'reject' dacă vrei tratare mai bună a erorilor din Promise

      promptAsync() // Pornim fluxul Google
        .then((result) => {
          // Logica este acum în useEffect bazat pe 'response'
          // Aici doar am pornit procesul.
          // Dacă promptAsync în sine returnează eroare imediată, o prindem mai jos
          if (result?.type !== "success") {
            console.warn(
              "Google prompt did not return success immediately:",
              result?.type
            );
            // Anulăm promise-ul dacă prompt-ul eșuează direct
            // (Deși useEffect va trata și el eșecul 'response')
            // reject(new Error("Google sign in was cancelled or failed at prompt level"));
            // Preferăm să lăsăm useEffect să trateze, deci nu respingem aici neapărat
            // dar resetăm resolver-ul dacă nu s-a rezolvat între timp
            if (googleSignInResolverRef.current) {
              console.log(
                "Resetting resolver because promptAsync result was not success."
              );
              googleSignInResolverRef.current = null;
            }
          }
        })
        .catch((error) => {
          console.error("Error during promptAsync():", error);
          // Respingem promise-ul dacă promptAsync() aruncă eroare
          if (googleSignInResolverRef.current) {
            // TODO: Folosește reject stocat
            console.error(
              "Cannot reject Google sign-in promise on promptAsync error: no rejector stored."
            );
            googleSignInResolverRef.current = null;
          } else {
            reject(error); // Respinge direct dacă resolver-ul nu a fost setat
          }
        });
    });
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

  const submitPartnershipRequest = async (data: {
    businessName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    message?: string;
  }) => {
    try {
      console.log("Starting partnership request submission...");

      // Validate required fields
      if (!data.businessName || !data.contactName || !data.email) {
        throw new Error("Missing required fields");
      }

      // Create the partnership request document
      const partnershipRequestsCollection = collection(
        db,
        "partnership_requests"
      );
      console.log("Collection reference created");

      const docRef = await addDoc(partnershipRequestsCollection, {
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Document successfully written with ID:", docRef.id);
      return { success: true, requestId: docRef.id };
    } catch (error) {
      console.error("Error submitting partnership request:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  };

  // Adăugăm funcția explicită pentru a obține profilul
  const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    return userProfileService.getCurrentUserProfile();
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

// Custom hook to use the Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
