import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useFirebase } from "../context/FirebaseContext";
import cartService from "../services/cartService";
import coffeePartnerService, {
  Product,
} from "../services/coffeePartnerService";
import Toast from "react-native-toast-message";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useFirebase();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [quickProducts, setQuickProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Helper function to determine if a tab is active
  const isActive = (path: string) => {
    // More specific check to avoid partial matches (e.g., /map vs /map-details)
    const currentBaseRoute = pathname.split("/").pop();
    return currentBaseRoute === path;
  };

  // Load cart item count
  useEffect(() => {
    const loadCartCount = async () => {
      if (user?.uid) {
        const count = await cartService.getCartItemCount(user.uid);
        setCartItemCount(count);
      }
    };

    loadCartCount();

    // Set up an interval to refresh cart count
    const interval = setInterval(loadCartCount, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Load recent products for quick order
  const loadQuickProducts = async () => {
    if (!user?.uid) return;

    try {
      setLoadingProducts(true);
      // Get user's recent cafe or default cafe (you can adjust this logic)
      const cafeId = "vD9S0L4vdd9EBBSmDI7C"; // Example cafe ID, you can make this dynamic
      const products = await coffeePartnerService.getProductsForCafe(cafeId);
      setQuickProducts(products.slice(0, 6)); // Show max 6 products
    } catch (error) {
      console.error("Error loading quick products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle quick add to cart
  const handleQuickAddToCart = async (product: Product) => {
    if (!user?.uid) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please login to add items to cart",
      });
      return;
    }

    const result = await cartService.addToCart(
      user.uid,
      product,
      product.cafeId,
      "Quick Order", // You can improve this with actual cafe name
      1
    );

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `${product.name} added to cart`,
      });

      // Update cart count
      const count = await cartService.getCartItemCount(user.uid);
      setCartItemCount(count);
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: result.message,
      });
    }
  };

  return (
    <View style={styles.bottomNav}>
      {/* Dashboard Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/dashboard")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("dashboard") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("dashboard") ? "home" : "home-outline"}
            size={26}
            color={isActive("dashboard") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text
          style={[
            styles.navText,
            isActive("dashboard") && styles.activeNavText,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Map Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/map")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("map") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("map") ? "map" : "map-outline"}
            size={26}
            color={isActive("map") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text style={[styles.navText, isActive("map") && styles.activeNavText]}>
          Map
        </Text>
      </TouchableOpacity>

      {/* QR Code / Cart Button */}
      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => {
          if (cartItemCount > 0) {
            router.push("/(mainUsers)/cart");
          } else {
            router.push("/(mainUsers)/qr");
          }
        }}
        onLongPress={() => {
          loadQuickProducts();
          setShowQuickOrder(true);
        }}
      >
        {cartItemCount > 0 ? (
          <>
            <Ionicons name="cart" size={28} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          </>
        ) : (
          <Ionicons name="qr-code" size={30} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Subscriptions Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/subscriptions")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("subscriptions") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("subscriptions") ? "card" : "card-outline"}
            size={26}
            color={isActive("subscriptions") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text
          style={[
            styles.navText,
            isActive("subscriptions") && styles.activeNavText,
          ]}
        >
          Subs
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/profile")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("profile") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("profile") ? "person" : "person-outline"}
            size={26}
            color={isActive("profile") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text
          style={[styles.navText, isActive("profile") && styles.activeNavText]}
        >
          Profile
        </Text>
      </TouchableOpacity>

      {/* Quick Order Modal */}
      <Modal
        visible={showQuickOrder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQuickOrder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quickOrderModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Order</Text>
              <TouchableOpacity
                onPress={() => setShowQuickOrder(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.quickOrderGrid}
              showsVerticalScrollIndicator={false}
            >
              {quickProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.quickOrderItem}
                  onPress={() => handleQuickAddToCart(product)}
                >
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.quickOrderImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.quickOrderName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.quickOrderPriceContainer}>
                    <Ionicons name="ellipse" size={14} color="#8B4513" />
                    <Text style={styles.quickOrderPrice}>
                      {product.beansValue} beans
                    </Text>
                  </View>
                  <View style={styles.quickOrderAddButton}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75, // Slightly increased height
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start", // Align items to the top for better icon spacing
    backgroundColor: "#FFFFFF", // Solid white background
    borderTopWidth: 1,
    borderTopColor: "#E0D6C7", // Lighter border color
    paddingTop: 8, // Add padding top
    paddingBottom: 5, // Keep bottom padding for safe area
    shadowColor: "#000", // Add subtle shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    alignItems: "center",
    flex: 1,
    paddingTop: 2, // Add slight padding within the button
  },
  iconContainer: {
    width: 40,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 3,
  },
  activeIconContainer: {
    backgroundColor: "#8B4513", // Brown background for active icon
  },
  navText: {
    fontSize: 11, // Slightly larger text
    color: "#8B4513", // Default text color
    fontWeight: "500",
  },
  activeNavText: {
    color: "#321E0E", // Darker text for active
    fontWeight: "600", // Bold text for active
  },
  qrButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    bottom: 25, // Raise the button more
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF", // Add white border for definition
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
  // Quick Order Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  quickOrderModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get("window").height * 0.7,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E6D3",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  closeButton: {
    padding: 5,
  },
  quickOrderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    justifyContent: "space-between",
  },
  quickOrderItem: {
    width: "48%",
    backgroundColor: "#FFF8F3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D6C7",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickOrderImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 8,
  },
  quickOrderName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#321E0E",
    textAlign: "center",
    marginBottom: 6,
    minHeight: 35,
  },
  quickOrderPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quickOrderPrice: {
    fontSize: 12,
    color: "#8B4513",
    marginLeft: 4,
    fontWeight: "600",
  },
  quickOrderAddButton: {
    backgroundColor: "#8B4513",
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});
