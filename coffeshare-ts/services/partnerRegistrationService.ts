import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";

export interface PendingPartnerRegistration {
  id: string;
  name: string;
  email: string;
  password: string;
  confirmationToken: string;
  status: "pending" | "confirmed" | "expired" | "rejected";
  createdAt: any;
  expiresAt: Date | Timestamp;
  createdBy: string;
  confirmedAt?: any;
  rejectedAt?: any;
  rejectionReason?: string;
}

export class PartnerRegistrationService {
  // Obțin toate înregistrările în așteptare
  static async getPendingRegistrations(): Promise<
    PendingPartnerRegistration[]
  > {
    try {
      const q = query(
        collection(db, "pendingPartnerRegistrations"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const registrations: PendingPartnerRegistration[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        registrations.push({
          id: doc.id,
          ...data,
          expiresAt: data.expiresAt?.toDate() || new Date(),
        } as PendingPartnerRegistration);
      });

      return registrations;
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      throw error;
    }
  }

  // Obțin înregistrarea prin token-ul de confirmare
  static async getRegistrationByToken(
    token: string
  ): Promise<PendingPartnerRegistration | null> {
    try {
      const q = query(
        collection(db, "pendingPartnerRegistrations"),
        where("confirmationToken", "==", token),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        expiresAt: data.expiresAt?.toDate() || new Date(),
      } as PendingPartnerRegistration;
    } catch (error) {
      console.error("Error fetching registration by token:", error);
      throw error;
    }
  }

  // Confirm înregistrarea partenerului
  static async confirmRegistration(token: string): Promise<{
    success: boolean;
    message: string;
    userUid?: string;
  }> {
    try {
      // Obțin înregistrarea prin token
      const registration = await this.getRegistrationByToken(token);

      if (!registration) {
        return {
          success: false,
          message: "Invalid or expired confirmation link",
        };
      }

      // Verific dacă token-ul a expirat
      if (new Date() > registration.expiresAt) {
        // Actualizez status-ul la expired
        await updateDoc(
          doc(db, "pendingPartnerRegistrations", registration.id),
          {
            status: "expired",
            updatedAt: serverTimestamp(),
          }
        );

        return {
          success: false,
          message: "Confirmation link has expired",
        };
      }

      // Creez utilizatorul Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registration.email,
        registration.password
      );

      const newUserUid = userCredential.user.uid;

      // Creez documentul profilului utilizatorului
      const userProfileRef = doc(db, "users", newUserUid);
      await setDoc(userProfileRef, {
        uid: newUserUid,
        email: registration.email,
        displayName: registration.name,
        role: "partner",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        registrationSource: "admin_invitation",
      });

      // Actualizez status-ul înregistrării la confirmed
      await updateDoc(doc(db, "pendingPartnerRegistrations", registration.id), {
        status: "confirmed",
        confirmedAt: serverTimestamp(),
        userUid: newUserUid,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: "Account successfully activated! You can now log in.",
        userUid: newUserUid,
      };
    } catch (error: any) {
      console.error("Error confirming registration:", error);

      let errorMessage = "Failed to activate account";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Resping înregistrarea partenerului
  static async rejectRegistration(
    registrationId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await updateDoc(doc(db, "pendingPartnerRegistrations", registrationId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || "Rejected by admin",
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: "Registration rejected successfully",
      };
    } catch (error) {
      console.error("Error rejecting registration:", error);
      return {
        success: false,
        message: "Failed to reject registration",
      };
    }
  }

  // Fac curățenie pentru înregistrările expirate
  static async cleanupExpiredRegistrations(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, "pendingPartnerRegistrations"),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);

      const updatePromises: Promise<void>[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const expiresAt = data.expiresAt?.toDate();

        if (expiresAt && now > expiresAt) {
          updatePromises.push(
            updateDoc(doc(db, "pendingPartnerRegistrations", docSnapshot.id), {
              status: "expired",
              updatedAt: serverTimestamp(),
            })
          );
        }
      });

      await Promise.all(updatePromises);
      console.log(`Cleaned up ${updatePromises.length} expired registrations`);
    } catch (error) {
      console.error("Error cleaning up expired registrations:", error);
    }
  }

  // Obțin statisticile înregistrărilor
  static async getRegistrationStats(): Promise<{
    pending: number;
    confirmed: number;
    expired: number;
    rejected: number;
    total: number;
  }> {
    try {
      const querySnapshot = await getDocs(
        collection(db, "pendingPartnerRegistrations")
      );

      const stats = {
        pending: 0,
        confirmed: 0,
        expired: 0,
        rejected: 0,
        total: 0,
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status;

        stats.total++;
        if (status === "pending") stats.pending++;
        else if (status === "confirmed") stats.confirmed++;
        else if (status === "expired") stats.expired++;
        else if (status === "rejected") stats.rejected++;
      });

      return stats;
    } catch (error) {
      console.error("Error fetching registration stats:", error);
      throw error;
    }
  }

  // Retrimît email-ul de confirmare (placeholder)
  static async resendConfirmationEmail(
    registrationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const registrationDoc = await getDoc(
        doc(db, "pendingPartnerRegistrations", registrationId)
      );

      if (!registrationDoc.exists()) {
        return {
          success: false,
          message: "Registration not found",
        };
      }

      const registration = registrationDoc.data() as PendingPartnerRegistration;

      if (registration.status !== "pending") {
        return {
          success: false,
          message: "Registration is no longer pending",
        };
      }

      // Verific dacă nu a expirat
      let expiresAt: Date;
      if (registration.expiresAt instanceof Date) {
        expiresAt = registration.expiresAt;
      } else if (
        registration.expiresAt &&
        typeof registration.expiresAt.toDate === "function"
      ) {
        expiresAt = registration.expiresAt.toDate();
      } else {
        expiresAt = new Date(); // fallback la data curentă dacă este nevalidă
      }

      if (new Date() > expiresAt) {
        return {
          success: false,
          message: "Registration has expired",
        };
      }

      // Într-o implementare reală, aceasta ar apela serviciul de email
      const confirmationLink = `https://yourdomain.com/confirm-partner-registration?token=${registration.confirmationToken}`;

      console.log("Resending confirmation email to:", registration.email);
      console.log("Confirmation link:", confirmationLink);

      return {
        success: true,
        message: "Confirmation email resent successfully",
      };
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      return {
        success: false,
        message: "Failed to resend confirmation email",
      };
    }
  }
}
