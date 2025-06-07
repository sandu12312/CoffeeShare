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

  /**
   * Get user's cart
   */
  async getUserCart(userId: string): Promise<Cart | null> {
    try {
      const cartDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));

      if (!cartDoc.exists()) {
        console.log(`Cart not found for user ${userId}`);
        return null;
      }

      const cart = cartDoc.data() as Cart;
      console.log(
        `Retrieved cart for user ${userId}: ${cart.totalBeans} beans, ${cart.items.length} items`
      );
      return cart;
    } catch (error) {
      console.error("Error fetching user cart:", error);
      return null;
    }
  }

  /**
   * Add item to cart
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

      // Check if cart exists and is for a different cafe
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
        // Create new cart
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
      } else {
        // Update existing cart
        const existingItemIndex = cart.items.findIndex(
          (item) => item.product.id === product.id
        );

        let updatedItems = [...cart.items];
        let newTotalBeans = cart.totalBeans;

        if (existingItemIndex > -1) {
          // Update quantity of existing item
          updatedItems[existingItemIndex].quantity += quantity;
          newTotalBeans += product.beansValue * quantity;
        } else {
          // Add new item
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
   * Remove item from cart
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
        // Delete cart if empty
        await deleteDoc(doc(db, this.COLLECTION_NAME, userId));
      } else {
        await updateDoc(doc(db, this.COLLECTION_NAME, userId), {
          items: updatedItems,
          totalBeans: newTotalBeans,
          lastUpdated: serverTimestamp(),
        });
      }

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
   * Update item quantity
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
   * Clear cart
   */
  async clearCart(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, userId));

      return {
        success: true,
        message: "Cart cleared",
      };
    } catch (error) {
      console.error("Error clearing cart:", error);
      // Check if this is a permissions error - if so, just log it and return success
      // This prevents permissions errors when QR redemption tries to clear cart
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
   * Get cart item count
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
   * Check if cart belongs to specific cafe
   */
  async isCartForCafe(userId: string, cafeId: string): Promise<boolean> {
    try {
      const cart = await this.getUserCart(userId);

      if (!cart || !cart.cafeId) {
        return true; // Empty cart can be used for any cafe
      }

      return cart.cafeId === cafeId;
    } catch (error) {
      console.error("Error checking cart cafe:", error);
      return false;
    }
  }

  /**
   * Get cart total beans value
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
   * Process cart redemption (subtract beans and clear cart)
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

      // Clear the cart after getting the total
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
   * Clear cart after successful QR redemption
   */
  async clearCartAfterRedemption(userId: string): Promise<void> {
    try {
      const result = await this.clearCart(userId);
      if (result.success) {
        console.log(
          `✅ Cart cleared for user ${userId} after successful QR redemption`
        );
      } else {
        console.log(
          `⚠️ Cart clear skipped for user ${userId}: ${result.message}`
        );
      }
    } catch (error) {
      console.error("❌ Error clearing cart after redemption:", error);
      // Don't throw error - this is not critical
    }
  }
}

export const cartService = new CartService();
export default cartService;
