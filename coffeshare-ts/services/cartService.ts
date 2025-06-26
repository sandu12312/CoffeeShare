import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Product } from "./coffeePartnerService";

export interface CartItem {
  product: Product;
  quantity: number;
  cafeId: string;
  cafeName: string;
  addedAt: Timestamp;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalBeans: number;
  lastUpdated: Timestamp;
  cafeId?: string; // Current cafe for the cart
  cafeName?: string;
}

class CartService {
  private readonly COLLECTION_NAME = "userCarts";
  private lastLoggedCartState: Map<string, string> = new Map(); // Track last logged state per user

  /**
   * Obțin coșul utilizatorului
   */
  async getUserCart(userId: string): Promise<Cart | null> {
    try {
      const cartDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));

      if (!cartDoc.exists()) {
        // Returnez null în liniște pentru coșuri inexistente (e normal)
        return null;
      }

      const cart = cartDoc.data() as Cart;

      // Loghez doar când starea coșului se schimbă efectiv pentru a reduce spam-ul
      const currentCartState = `${cart.totalBeans}_${cart.items.length}`;
      const lastState = this.lastLoggedCartState.get(userId);

      if (cart.items.length > 0 && currentCartState !== lastState) {
        console.log(
          `Loaded cart for user ${userId}: ${cart.totalBeans} beans, ${cart.items.length} items`
        );
        this.lastLoggedCartState.set(userId, currentCartState);
      }

      return cart;
    } catch (error) {
      console.error("Error fetching user cart:", error);
      return null;
    }
  }

  /**
   * Adaug produs în coș
   */
  async addToCart(
    userId: string,
    product: Product,
    cafeId: string,
    cafeName: string,
    quantity: number = 1
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cart = await this.getUserCart(userId);

      // Verific dacă coșul există și e pentru o cafenea diferită
      if (cart && cart.cafeId && cart.cafeId !== cafeId) {
        return {
          success: false,
          message:
            "You have items from another cafe in your cart. Please clear your cart first.",
        };
      }

      const cartRef = doc(db, this.COLLECTION_NAME, userId);
      const now = new Date();

      if (!cart) {
        // Creez coș nou
        const newCart: Cart = {
          userId,
          items: [
            {
              product,
              quantity,
              cafeId,
              cafeName,
              addedAt: now as any,
            },
          ],
          totalBeans: product.beansValue * quantity,
          lastUpdated: serverTimestamp() as any,
          cafeId,
          cafeName,
        };

        await setDoc(cartRef, newCart);
        console.log(`✅ Added ${product.name} to new cart for user ${userId}`);
        // Șterg starea din cache căci coșul s-a schimbat
        this.lastLoggedCartState.delete(userId);
      } else {
        // Actualizez coșul existent
        const existingItemIndex = cart.items.findIndex(
          (item) => item.product.id === product.id
        );

        let updatedItems = [...cart.items];
        let newTotalBeans = cart.totalBeans;

        if (existingItemIndex > -1) {
          // Actualizez cantitatea produsului existent
          updatedItems[existingItemIndex].quantity += quantity;
          newTotalBeans += product.beansValue * quantity;
        } else {
          // Adaug produs nou
          updatedItems.push({
            product,
            quantity,
            cafeId,
            cafeName,
            addedAt: now as any,
          });
          newTotalBeans += product.beansValue * quantity;
        }

        await updateDoc(cartRef, {
          items: updatedItems,
          totalBeans: newTotalBeans,
          lastUpdated: serverTimestamp() as any,
          cafeId,
          cafeName,
        });

        if (existingItemIndex > -1) {
          console.log(
            `✅ Updated ${product.name} quantity in cart for user ${userId}`
          );
        } else {
          console.log(
            `✅ Added ${product.name} to existing cart for user ${userId}`
          );
        }
        // Șterg starea din cache căci coșul s-a schimbat
        this.lastLoggedCartState.delete(userId);
      }

      return {
        success: true,
        message: "Product added to cart",
      };
    } catch (error) {
      console.error("Error adding to cart:", error);
      return {
        success: false,
        message: "Failed to add product to cart",
      };
    }
  }

  /**
   * Șterg produs din coș
   */
  async removeFromCart(
    userId: string,
    productId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cart = await this.getUserCart(userId);

      if (!cart) {
        return {
          success: false,
          message: "Cart not found",
        };
      }

      const updatedItems = cart.items.filter(
        (item) => item.product.id !== productId
      );

      const newTotalBeans = updatedItems.reduce(
        (total, item) => total + item.product.beansValue * item.quantity,
        0
      );

      if (updatedItems.length === 0) {
        // Șterg coșul dacă e gol
        await deleteDoc(doc(db, this.COLLECTION_NAME, userId));
        console.log(`🗑️ Cart emptied and deleted for user ${userId}`);
      } else {
        await updateDoc(doc(db, this.COLLECTION_NAME, userId), {
          items: updatedItems,
          totalBeans: newTotalBeans,
          lastUpdated: serverTimestamp(),
        });
        console.log(`🗑️ Item removed from cart for user ${userId}`);
      }

      // Șterg starea din cache căci coșul s-a schimbat
      this.lastLoggedCartState.delete(userId);

      return {
        success: true,
        message: "Product removed from cart",
      };
    } catch (error) {
      console.error("Error removing from cart:", error);
      return {
        success: false,
        message: "Failed to remove product from cart",
      };
    }
  }

  /**
   * Actualizez cantitatea produsului
   */
  async updateQuantity(
    userId: string,
    productId: string,
    newQuantity: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (newQuantity <= 0) {
        return this.removeFromCart(userId, productId);
      }

      const cart = await this.getUserCart(userId);

      if (!cart) {
        return {
          success: false,
          message: "Cart not found",
        };
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.id === productId
      );

      if (itemIndex === -1) {
        return {
          success: false,
          message: "Product not found in cart",
        };
      }

      const updatedItems = [...cart.items];
      const oldQuantity = updatedItems[itemIndex].quantity;
      updatedItems[itemIndex].quantity = newQuantity;

      const quantityDiff = newQuantity - oldQuantity;
      const newTotalBeans =
        cart.totalBeans +
        updatedItems[itemIndex].product.beansValue * quantityDiff;

      await updateDoc(doc(db, this.COLLECTION_NAME, userId), {
        items: updatedItems,
        totalBeans: newTotalBeans,
        lastUpdated: serverTimestamp(),
      });

      console.log(
        `🔄 Updated quantity for user ${userId}: ${oldQuantity} → ${newQuantity}`
      );
      // Șterg starea din cache căci coșul s-a schimbat
      this.lastLoggedCartState.delete(userId);

      return {
        success: true,
        message: "Quantity updated",
      };
    } catch (error) {
      console.error("Error updating quantity:", error);
      return {
        success: false,
        message: "Failed to update quantity",
      };
    }
  }

  /**
   * Golesc coșul
   */
  async clearCart(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, userId));

      console.log(`🧹 Cart manually cleared for user ${userId}`);
      // Șterg starea din cache căci coșul e acum gol
      this.lastLoggedCartState.delete(userId);

      return {
        success: true,
        message: "Cart cleared",
      };
    } catch (error) {
      console.error("Error clearing cart:", error);
      // Verific dacă e o eroare de permisiuni - dacă da, o loghez și returnez success
      // Aceasta previne erorile de permisiuni când răscumpărarea QR încearcă să golească coșul
      if (
        (error as any)?.code === "permission-denied" ||
        (error as any)?.message?.includes("permissions")
      ) {
        console.log(
          "⚠️ Permissions error during cart clearing (expected after QR redemption), treating as success:",
          (error as any)?.message
        );
        return {
          success: true,
          message:
            "Cart clear skipped due to permissions (QR redemption completed)",
        };
      }
      return {
        success: false,
        message: "Failed to clear cart",
      };
    }
  }

  /**
   * Obțin numărul de produse din coș
   */
  async getCartItemCount(userId: string): Promise<number> {
    try {
      const cart = await this.getUserCart(userId);

      if (!cart) {
        return 0;
      }

      return cart.items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error("Error getting cart item count:", error);
      return 0;
    }
  }

  /**
   * Verific dacă coșul aparține unei cafenele specifice
   */
  async isCartForCafe(userId: string, cafeId: string): Promise<boolean> {
    try {
      const cart = await this.getUserCart(userId);

      if (!cart || !cart.cafeId) {
        return true; // Coșul gol poate fi folosit pentru orice cafenea
      }

      return cart.cafeId === cafeId;
    } catch (error) {
      console.error("Error checking cart cafe:", error);
      return false;
    }
  }

  /**
   * Obțin totalul de boabe din coș
   */
  async getCartTotalBeans(userId: string): Promise<number> {
    try {
      const cart = await this.getUserCart(userId);
      return cart?.totalBeans || 0;
    } catch (error) {
      console.error("Error getting cart total beans:", error);
      return 0;
    }
  }

  /**
   * Procesez răscumpărarea coșului (scad boabele și golesc coșul)
   */
  async processCartRedemption(
    userId: string
  ): Promise<{ success: boolean; beansUsed: number; message: string }> {
    try {
      const cart = await this.getUserCart(userId);

      if (!cart || cart.items.length === 0) {
        return {
          success: false,
          beansUsed: 0,
          message: "Cart is empty",
        };
      }

      const beansUsed = cart.totalBeans;

      // Golesc coșul după ce obțin totalul
      await this.clearCart(userId);

      return {
        success: true,
        beansUsed,
        message: `Successfully processed ${beansUsed} beans from cart`,
      };
    } catch (error) {
      console.error("Error processing cart redemption:", error);
      return {
        success: false,
        beansUsed: 0,
        message: "Failed to process cart redemption",
      };
    }
  }

  /**
   * Golesc coșul după răscumpărarea QR cu succes
   */
  async clearCartAfterRedemption(userId: string): Promise<void> {
    try {
      console.log(`🛒 CART CLEARING: Starting cart clear for user ${userId}`);
      const result = await this.clearCart(userId);
      if (result.success) {
        console.log(
          `✅ CART CLEARED: Successfully cleared cart for user ${userId} after QR redemption`
        );

        // Șterg starea din cache pentru a asigura date proaspete la următoarea încărcare
        this.lastLoggedCartState.delete(userId);
      } else {
        console.log(
          `⚠️ CART CLEAR SKIPPED: Cart clear skipped for user ${userId}: ${result.message}`
        );
      }
    } catch (error) {
      console.error(
        "❌ CART CLEAR ERROR: Error clearing cart after redemption:",
        error
      );
      // Nu arunc eroare - aceasta nu e critică
    }
  }
}

export const cartService = new CartService();
export default cartService;
