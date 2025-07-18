import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { SubscriptionService } from "./subscriptionService";
import cartService from "./cartService";
import partnerAnalyticsService from "./partnerAnalyticsService";
import CryptoJS from "crypto-js";

export interface QRToken {
  id?: string;
  userId: string;
  token: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
  usageCount: number;
  maxUsage: number;
  cafeId?: string; // Adaug token specific cafenelei
  type?: "instant" | "checkout"; // Tipul codului QR
  cartTotalBeans?: number; // Stochez totalul coșului în token pentru a evita problemele de permisiuni
}

export interface QRValidationResult {
  success: boolean;
  message: string;
  userInfo?: {
    userId: string;
    displayName?: string;
    beansLeft?: number;
  };
}

export class QRService {
  private static readonly COLLECTION_NAME = "qrTokens";
  private static readonly TOKEN_EXPIRY_MINUTES = 10;
  private static readonly MAX_USAGE_COUNT = 1;

  /**
   * Generez un token QR unic pentru un utilizator
   */
  static async generateQRToken(userId: string): Promise<QRToken | null> {
    try {
      // Mai întâi verific dacă utilizatorul are abonament activ
      const subscription = await SubscriptionService.getUserActiveSubscription(
        userId
      );

      if (
        !subscription ||
        subscription.status !== "active" ||
        subscription.creditsLeft <= 0
      ) {
        throw new Error(
          "User does not have an active subscription with available beans"
        );
      }

      // Invalidez orice token-uri active existente pentru acest utilizator
      await this.invalidateUserTokens(userId);

      // Obțin totalul coșului pentru a-l include în token (evit problemele de permisiuni în timpul scanării)
      let cartTotalBeans = 0;
      try {
        const cart = await cartService.getUserCart(userId);
        cartTotalBeans = cart?.totalBeans || 0;
        console.log(
          `🛒 Cart found for QR token generation:`,
          JSON.stringify({
            userId,
            cartExists: !!cart,
            cartTotalBeans: cart?.totalBeans || 0,
            willUseBeans: cartTotalBeans,
          })
        );
      } catch (error) {
        console.log(
          "❌ Could not fetch cart for QR token, using 0 beans:",
          error
        );
      }

      // Generez token unic
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2);
      const tokenString = `${userId}_${timestamp}_${random}`;
      const hashedToken = CryptoJS.SHA256(tokenString).toString();

      const now = Timestamp.now();
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000)
      );

      const qrToken: QRToken = {
        userId,
        token: hashedToken,
        createdAt: now,
        expiresAt,
        isActive: true,
        usageCount: 0,
        maxUsage: this.MAX_USAGE_COUNT,
        type: "instant",
        cartTotalBeans,
      };

      // Salvez în Firestore
      const docRef = await addDoc(
        collection(db, this.COLLECTION_NAME),
        qrToken
      );
      qrToken.id = docRef.id;

      return qrToken;
    } catch (error) {
      console.error("Error generating QR token:", error);
      return null;
    }
  }

  /**
   * Obțin token-ul QR activ pentru un utilizator
   */
  static async getActiveQRToken(userId: string): Promise<QRToken | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("userId", "==", userId),
        where("isActive", "==", true),
        where("expiresAt", ">", Timestamp.now()),
        orderBy("expiresAt", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as QRToken;
    } catch (error) {
      console.error("Error getting active QR token:", error);
      return null;
    }
  }

  /**
   * Mă abonez la modificările token-ului QR activ pentru un utilizator
   */
  static subscribeToUserQRToken(
    userId: string,
    callback: (token: QRToken | null) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where("userId", "==", userId),
      where("isActive", "==", true),
      where("expiresAt", ">", Timestamp.now()),
      orderBy("expiresAt", "desc"),
      limit(1)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(null);
        } else {
          const doc = snapshot.docs[0];
          const token: QRToken = {
            id: doc.id,
            ...doc.data(),
          } as QRToken;
          callback(token);
        }
      },
      (error) => {
        console.error("Error subscribing to QR token:", error);
        callback(null);
      }
    );
  }

  /**
   * Validez și răscumpăr un token QR cu analiză de partener
   */
  static async validateAndRedeemQRTokenWithPartner(
    token: string,
    partnerId: string,
    partnerEmail: string,
    partnerName: string,
    cafeId: string,
    cafeName: string
  ): Promise<QRValidationResult> {
    try {
      // Mai întâi, găsesc token-ul în afara tranzacției
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("token", "==", token),
        where("isActive", "==", true),
        where("expiresAt", ">", Timestamp.now()),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: false,
          message: "QR code is invalid or has expired",
        };
      }

      const tokenDoc = snapshot.docs[0];
      const qrToken = tokenDoc.data() as QRToken;

      // Verific dacă token-ul a atins utilizarea maximă
      if (qrToken.usageCount >= qrToken.maxUsage) {
        return {
          success: false,
          message: "QR code has already been used",
        };
      }

      // Folosesc totalul coșului stocat în token (evit problemele de permisiuni)
      let beansToSubtract = 1; // Implicit pentru răscumpărarea instantanee

      console.log(
        `🔍 QR Token Data:`,
        JSON.stringify({
          tokenType: qrToken.type || "instant",
          cartTotalBeans: qrToken.cartTotalBeans,
          hasCartTotal: !!(
            qrToken.cartTotalBeans && qrToken.cartTotalBeans > 0
          ),
          userId: qrToken.userId,
          tokenId: qrToken.id || "unknown",
        })
      );

      if (qrToken.cartTotalBeans && qrToken.cartTotalBeans > 0) {
        beansToSubtract = qrToken.cartTotalBeans;
        console.log(
          `✅ Using stored cart total from QR token: ${beansToSubtract} beans`
        );
      } else {
        console.log(
          `⚠️ No cart total in token (${qrToken.cartTotalBeans}), using default: ${beansToSubtract} bean`
        );
      }

      console.log(
        `🎯 FINAL DECISION: Will subtract ${beansToSubtract} beans from user's subscription`
      );

      // Verific dacă utilizatorul are încă abonament activ
      const subscription = await SubscriptionService.getUserActiveSubscription(
        qrToken.userId
      );

      if (
        !subscription ||
        subscription.status !== "active" ||
        subscription.creditsLeft <= 0
      ) {
        return {
          success: false,
          message:
            "User subscription is no longer active or has no beans remaining",
        };
      }

      // Verific dacă utilizatorul are suficiente boabe pentru totalul coșului
      if (subscription.creditsLeft < beansToSubtract) {
        return {
          success: false,
          message: `Insufficient beans. You need ${beansToSubtract} beans but only have ${subscription.creditsLeft}`,
        };
      }

      // Acum execut tranzacția pentru răscumpărarea efectivă
      const result = await runTransaction(db, async (transaction) => {
        // Re-verific status-ul token-ului în cadrul tranzacției
        const tokenRef = doc(db, this.COLLECTION_NAME, tokenDoc.id);
        const currentTokenDoc = await transaction.get(tokenRef);

        if (!currentTokenDoc.exists()) {
          throw new Error("Token was deleted during validation");
        }

        const currentToken = currentTokenDoc.data() as QRToken;

        // Dublu-verific că token-ul este încă valid
        if (
          !currentToken.isActive ||
          currentToken.usageCount >= currentToken.maxUsage
        ) {
          throw new Error("Token is no longer valid");
        }

        // Actualizez utilizarea token-ului
        transaction.update(tokenRef, {
          usageCount: currentToken.usageCount + 1,
          isActive:
            currentToken.usageCount + 1 >= currentToken.maxUsage ? false : true,
        });

        // Actualizez creditele utilizatorului direct în tranzacție
        const subRef = doc(db, "userSubscriptions", subscription.id!);
        const newCreditsLeft = subscription.creditsLeft - beansToSubtract;

        console.log(
          `💰 BEAN CALCULATION:`,
          JSON.stringify({
            before: subscription.creditsLeft,
            subtract: beansToSubtract,
            after: newCreditsLeft,
            calculation: `${subscription.creditsLeft} - ${beansToSubtract} = ${newCreditsLeft}`,
          })
        );

        transaction.update(subRef, {
          creditsLeft: newCreditsLeft,
          lastUpdated: serverTimestamp(),
        });

        const finalBeansLeft = subscription.creditsLeft - beansToSubtract;

        console.log(
          `🎉 QR REDEMPTION SUCCESS:`,
          JSON.stringify({
            userId: qrToken.userId,
            beansUsed: beansToSubtract,
            finalBeansLeft: finalBeansLeft,
            success: true,
          })
        );

        return {
          success: true,
          message: "QR code successfully redeemed",
          userInfo: {
            userId: qrToken.userId,
            beansLeft: finalBeansLeft,
          },
        };
      });

      // Șterg coșul dacă acesta a fost un token de checkout cu total coș
      if (qrToken.cartTotalBeans && qrToken.cartTotalBeans > 0) {
        try {
          await cartService.clearCartAfterRedemption(qrToken.userId);
          console.log(
            `🛒 Cart cleared for user ${qrToken.userId} after successful redemption`
          );
        } catch (cartError) {
          console.error("❌ Error clearing cart after redemption:", cartError);
          // Nu eșuez operația dacă ștergerea coșului eșuează
        }
      }

      console.log(
        `🎉 Successfully redeemed ${beansToSubtract} beans for user ${qrToken.userId}`
      );

      // Loghez răscumpărarea reușită și analiza partenerului după ce tranzacția se finalizează
      try {
        await SubscriptionService.logUserActivity(
          qrToken.userId,
          "COFFEE_REDEMPTION",
          {
            cafeId: cafeId,
            qrTokenId: tokenDoc.id,
            beansUsed: beansToSubtract,
            tokenType: qrToken.type || "instant",
            timestamp: Timestamp.now(),
          }
        );

        // Loghez analiza partenerului
        await partnerAnalyticsService.logPartnerScan(
          partnerId,
          partnerEmail,
          partnerName,
          cafeId,
          cafeName,
          qrToken.userId,
          tokenDoc.id,
          beansToSubtract,
          qrToken.type || "instant"
        );
      } catch (logError) {
        console.error("Error logging successful redemption:", logError);
        // Nu eșuez operația dacă logarea eșuează
      }

      return result;
    } catch (error) {
      console.error("Error validating QR token:", error);

      // Loghez activitatea chiar dacă a fost o eroare (pentru scopuri de audit)
      try {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where("token", "==", token),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const qrToken = snapshot.docs[0].data() as QRToken;
          await SubscriptionService.logUserActivity(
            qrToken.userId,
            "COFFEE_REDEMPTION_FAILED",
            {
              cafeId: cafeId || "unknown",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: Timestamp.now(),
            }
          );
        }
      } catch (logError) {
        console.error("Error logging failed redemption:", logError);
      }

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while processing the QR code",
      };
    }
  }

  /**
   * Invalidate all active tokens for a user
   */
  static async invalidateUserTokens(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("userId", "==", userId),
        where("isActive", "==", true)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error invalidating user tokens:", error);
    }
  }

  /**
   * Cleanup expired tokens (should be called periodically)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("expiresAt", "<", Timestamp.now())
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${snapshot.docs.length} expired tokens`);
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  /**
   * Check if user can generate QR token
   */
  static async canUserGenerateQRToken(
    userId: string
  ): Promise<{ canGenerate: boolean; reason?: string }> {
    try {
      const subscription = await SubscriptionService.getUserActiveSubscription(
        userId
      );

      if (!subscription) {
        return {
          canGenerate: false,
          reason: "No active subscription found",
        };
      }

      if (subscription.status !== "active") {
        return {
          canGenerate: false,
          reason: "Subscription is not active",
        };
      }

      if (subscription.creditsLeft <= 0) {
        return {
          canGenerate: false,
          reason: "No beans remaining in subscription",
        };
      }

      return { canGenerate: true };
    } catch (error) {
      console.error("Error checking if user can generate QR token:", error);
      return {
        canGenerate: false,
        reason: "Error checking subscription status",
      };
    }
  }

  /**
   * Generate a checkout QR token for cart payment
   */
  static async generateCheckoutQRToken(
    userId: string,
    cafeId: string
  ): Promise<QRToken | null> {
    try {
      // Get user's cart
      const cart = await cartService.getUserCart(userId);

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // Verify cart is for this cafe
      if (cart.cafeId !== cafeId) {
        throw new Error("Cart items are from a different cafe");
      }

      // Verify user has enough beans
      const subscription = await SubscriptionService.getUserActiveSubscription(
        userId
      );

      if (!subscription || subscription.status !== "active") {
        throw new Error("No active subscription found");
      }

      if (subscription.creditsLeft < cart.totalBeans) {
        throw new Error(
          `Insufficient beans. You need ${cart.totalBeans} beans but only have ${subscription.creditsLeft}`
        );
      }

      // Invalidate any existing checkout tokens
      await this.invalidateUserCheckoutTokens(userId);

      // Generate unique token with cafe ID
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2);
      const tokenString = `${userId}_${cafeId}_${timestamp}_${random}`;
      const hashedToken = CryptoJS.SHA256(tokenString).toString();

      const now = Timestamp.now();
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000)
      );

      const qrToken: QRToken = {
        userId,
        token: hashedToken,
        createdAt: now,
        expiresAt,
        isActive: true,
        usageCount: 0,
        maxUsage: this.MAX_USAGE_COUNT,
        cafeId,
        type: "checkout",
        cartTotalBeans: cart.totalBeans,
      };

      // Save to Firestore
      const docRef = await addDoc(
        collection(db, this.COLLECTION_NAME),
        qrToken
      );
      qrToken.id = docRef.id;

      return qrToken;
    } catch (error) {
      console.error("Error generating checkout QR token:", error);
      return null;
    }
  }

  /**
   * Invalidate all active checkout tokens for a user
   */
  static async invalidateUserCheckoutTokens(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("userId", "==", userId),
        where("isActive", "==", true),
        where("type", "==", "checkout")
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error invalidating user checkout tokens:", error);
    }
  }

  /**
   * Validate and redeem a QR token (legacy method for backward compatibility)
   */
  static async validateAndRedeemQRToken(
    token: string,
    cafeId?: string
  ): Promise<QRValidationResult> {
    // This is a simplified version without partner analytics
    // For full analytics, use validateAndRedeemQRTokenWithPartner
    try {
      // Find the token
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("token", "==", token),
        where("isActive", "==", true),
        where("expiresAt", ">", Timestamp.now()),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: false,
          message: "QR code is invalid or has expired",
        };
      }

      const tokenDoc = snapshot.docs[0];
      const qrToken = tokenDoc.data() as QRToken;

      if (qrToken.usageCount >= qrToken.maxUsage) {
        return {
          success: false,
          message: "QR code has already been used",
        };
      }

      let beansToSubtract = 1;
      if (qrToken.cartTotalBeans && qrToken.cartTotalBeans > 0) {
        beansToSubtract = qrToken.cartTotalBeans;
      }

      const subscription = await SubscriptionService.getUserActiveSubscription(
        qrToken.userId
      );

      if (
        !subscription ||
        subscription.status !== "active" ||
        subscription.creditsLeft < beansToSubtract
      ) {
        return {
          success: false,
          message: "User subscription is not valid or insufficient beans",
        };
      }

      // Process redemption
      const result = await runTransaction(db, async (transaction) => {
        const tokenRef = doc(db, this.COLLECTION_NAME, tokenDoc.id);
        const currentTokenDoc = await transaction.get(tokenRef);

        if (!currentTokenDoc.exists() || !currentTokenDoc.data()?.isActive) {
          throw new Error("Token is no longer valid");
        }

        transaction.update(tokenRef, {
          usageCount: qrToken.usageCount + 1,
          isActive: qrToken.usageCount + 1 >= qrToken.maxUsage ? false : true,
        });

        const subRef = doc(db, "userSubscriptions", subscription.id!);
        transaction.update(subRef, {
          creditsLeft: subscription.creditsLeft - beansToSubtract,
          lastUpdated: serverTimestamp(),
        });

        return {
          success: true,
          message: "QR code successfully redeemed",
          userInfo: {
            userId: qrToken.userId,
            beansLeft: subscription.creditsLeft - beansToSubtract,
          },
        };
      });

      // Clear cart if this was a checkout token with cart total
      if (qrToken.cartTotalBeans && qrToken.cartTotalBeans > 0) {
        try {
          await cartService.clearCartAfterRedemption(qrToken.userId);
          console.log(
            `🛒 Cart cleared for user ${qrToken.userId} after legacy redemption`
          );
        } catch (cartError) {
          console.error(
            "❌ Error clearing cart after legacy redemption:",
            cartError
          );
          // Don't fail the operation if cart clearing fails
        }
      }

      return result;
    } catch (error) {
      console.error("Error validating QR token:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Process checkout with cart (DEPRECATED - now handled by validateAndRedeemQRTokenWithPartner)
   */
  static async processCheckout(
    token: string,
    scanningCafeId: string
  ): Promise<QRValidationResult> {
    // Redirect to the legacy validation method
    return this.validateAndRedeemQRToken(token, scanningCafeId);
  }

  /* DEPRECATED METHOD - COMMENTED OUT TO AVOID PERMISSIONS ISSUES
  static async processCheckoutOLD(
    token: string,
    scanningCafeId: string
  ): Promise<QRValidationResult> {
      try {
      // Find the token (simplified query to avoid composite index)
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("token", "==", token),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: false,
          message: "Invalid QR code",
        };
      }

      const tokenDoc = snapshot.docs[0];
      const qrToken = tokenDoc.data() as QRToken;

      // Validate token properties individually
      if (!qrToken.isActive) {
        return {
          success: false,
          message: "QR code is no longer active",
        };
      }

      if (qrToken.type !== "checkout") {
        return {
          success: false,
          message: "This is not a checkout QR code",
        };
      }

      if (qrToken.expiresAt.toDate() < new Date()) {
        return {
          success: false,
          message: "QR code has expired",
        };
      }

      // Verify cafe match
      if (qrToken.cafeId !== scanningCafeId) {
        return {
          success: false,
          message: "This QR code is for a different cafe",
        };
      }

      // Use cart total stored in token (avoid permissions issues)
      if (!qrToken.cartTotalBeans || qrToken.cartTotalBeans <= 0) {
        return {
          success: false,
          message: "No cart total found in checkout token",
        };
      }

      // Get user subscription
      const subscription = await SubscriptionService.getUserActiveSubscription(
        qrToken.userId
      );

      if (!subscription || subscription.status !== "active") {
        return {
          success: false,
          message: "No active subscription found",
        };
      }

      if (subscription.creditsLeft < qrToken.cartTotalBeans) {
        return {
          success: false,
          message: `Insufficient beans. Need ${qrToken.cartTotalBeans} but only have ${subscription.creditsLeft}`,
        };
      }

      // Process transaction
      const result = await runTransaction(db, async (transaction) => {
        // Re-check token
        const tokenRef = doc(db, this.COLLECTION_NAME, tokenDoc.id);
        const currentTokenDoc = await transaction.get(tokenRef);

        if (!currentTokenDoc.exists() || !currentTokenDoc.data()?.isActive) {
          throw new Error("Token is no longer valid");
        }

        // Deactivate token
        transaction.update(tokenRef, {
          usageCount: 1,
          isActive: false,
        });

        // Update user credits
        const subRef = doc(db, "userSubscriptions", subscription.id!);
        transaction.update(subRef, {
          creditsLeft: subscription.creditsLeft - qrToken.cartTotalBeans,
          lastUpdated: serverTimestamp(),
        });

        // Create order record
        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          userId: qrToken.userId,
          cafeId: scanningCafeId,
          totalBeans: qrToken.cartTotalBeans,
          status: "completed",
          createdAt: serverTimestamp(),
          qrTokenId: tokenDoc.id,
        });

        return {
          success: true,
          message: "Checkout successful",
          userInfo: {
            userId: qrToken.userId,
            beansLeft: subscription.creditsLeft - qrToken.cartTotalBeans!,
          },
        };
      });

      // Note: Cart clearing handled by user's app to avoid permissions issues
      console.log(
        `Checkout completed: Used ${cart.totalBeans} beans for user ${qrToken.userId}`
      );

      // Log the activity
      await SubscriptionService.logUserActivity(
        qrToken.userId,
        "CHECKOUT_COMPLETED",
        {
          cafeId: scanningCafeId,
          cafeName: cart.cafeName,
          totalBeans: cart.totalBeans,
          itemCount: cart.items.length,
          items: cart.items.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            beansValue: item.product.beansValue,
          })),
          timestamp: Timestamp.now(),
        }
      );

      return result;
    } catch (error) {
      console.error("Error processing checkout:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Checkout failed",
      };
    }
  */
}
