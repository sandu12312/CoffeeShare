import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { useFirebase } from "./FirebaseContext";
import cartService from "../services/cartService";

interface CartContextType {
  cartItemCount: number;
  refreshCartCount: () => Promise<void>;
  updateCartCount: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const { user } = useFirebase();

  // Load initial cart count
  useEffect(() => {
    if (user?.uid) {
      refreshCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [user]);

  // Refresh cart count when app becomes active (helps after QR redemption)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && user?.uid) {
        // Refresh cart count when app becomes active
        refreshCartCount();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription?.remove();
  }, [user]);

  const refreshCartCount = async () => {
    if (user?.uid) {
      try {
        const count = await cartService.getCartItemCount(user.uid);
        setCartItemCount(count);
      } catch (error) {
        console.error("Error refreshing cart count:", error);
      }
    }
  };

  const updateCartCount = (count: number) => {
    setCartItemCount(Math.max(0, count));
  };

  const value: CartContextType = {
    cartItemCount,
    refreshCartCount,
    updateCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
