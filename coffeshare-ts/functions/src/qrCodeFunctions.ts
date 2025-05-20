import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { CallableRequest } from "firebase-functions/v2/https";

// Initialize Firebase Admin
admin.initializeApp();

interface GenerateQRCodeData {
  cafeId: string;
  productId?: string;
}

interface VerifyQRCodeData {
  qrCodeData: {
    cafeId: string;
    uniqueCode: string;
    validUntil: any;
  };
}

// Generate QR Code
export const generateQRCode = functions.https.onCall(
  async (request: CallableRequest<GenerateQRCodeData>) => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to generate QR code"
      );
    }

    const { cafeId, productId } = request.data;
    if (!cafeId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Cafe ID is required"
      );
    }

    try {
      // Get user profile
      const userProfile = await admin
        .firestore()
        .collection("users")
        .doc(request.auth.uid)
        .get();

      if (!userProfile.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User profile not found"
        );
      }

      const userData = userProfile.data();
      if (!userData?.subscription) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "User has no active subscription"
        );
      }

      // Check if user can redeem coffee
      const canRedeem = await checkRedemptionEligibility(
        request.auth.uid,
        userData
      );
      if (!canRedeem.canRedeem) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          canRedeem.reason || "Cannot redeem coffee at this time"
        );
      }

      // Create QR code data
      const qrData = {
        userId: request.auth.uid,
        cafeId,
        productId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        validUntil: new Date(Date.now() + 5 * 60000), // Valid for 5 minutes
        subscriptionType: userData.subscription.type,
        isUsed: false,
        uniqueCode: uuidv4(),
      };

      // Save QR code to database
      const qrRef = await admin.firestore().collection("qrCodes").add(qrData);

      return {
        ...qrData,
        id: qrRef.id,
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate QR code"
      );
    }
  }
);

// Verify and Redeem QR Code
export const verifyAndRedeemQRCode = functions.https.onCall(
  async (request: CallableRequest<VerifyQRCodeData>) => {
    // Check if user is authenticated and is a cafe partner
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to verify QR code"
      );
    }

    const { qrCodeData } = request.data;
    if (!qrCodeData) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "QR code data is required"
      );
    }

    try {
      // Verify cafe partner
      const cafePartner = await admin
        .firestore()
        .collection("cafes")
        .doc(qrCodeData.cafeId)
        .get();

      if (!cafePartner.exists) {
        throw new functions.https.HttpsError("not-found", "Cafe not found");
      }

      const cafeData = cafePartner.data();
      if (cafeData?.partnerId !== request.auth.uid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Not authorized to redeem QR code for this cafe"
        );
      }

      // Verify QR code
      const qrSnapshot = await admin
        .firestore()
        .collection("qrCodes")
        .where("uniqueCode", "==", qrCodeData.uniqueCode)
        .get();

      if (qrSnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "QR code not found");
      }

      const qrDoc = qrSnapshot.docs[0];
      const qrData = qrDoc.data();

      // Check if QR code is expired
      if (qrData.validUntil.toDate() < new Date()) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "QR code has expired"
        );
      }

      // Check if QR code is already used
      if (qrData.isUsed) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "QR code has already been redeemed"
        );
      }

      // Mark QR code as used
      await qrDoc.ref.update({
        isUsed: true,
        redemptionTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        redeemedBy: request.auth.uid,
      });

      // Update user's redemption count
      await admin
        .firestore()
        .collection("users")
        .doc(qrData.userId)
        .update({
          "subscription.remainingToday":
            admin.firestore.FieldValue.increment(-1),
          "stats.totalRedeemed": admin.firestore.FieldValue.increment(1),
        });

      return {
        success: true,
        message: "QR code successfully redeemed",
      };
    } catch (error) {
      console.error("Error verifying QR code:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to verify QR code"
      );
    }
  }
);

// Helper function to check redemption eligibility
async function checkRedemptionEligibility(userId: string, userData: any) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check subscription expiry
  if (userData.subscription.expiryDate.toDate() < now) {
    return {
      canRedeem: false,
      reason: "Subscription has expired",
    };
  }

  // Check daily limit
  if (userData.subscription.remainingToday <= 0) {
    return {
      canRedeem: false,
      reason: "Daily redemption limit reached",
    };
  }

  return {
    canRedeem: true,
  };
}
