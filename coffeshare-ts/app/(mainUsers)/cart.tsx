import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomTabBar from "../../components/BottomTabBar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFirebase } from "../../context/FirebaseContext";
import cartService, { Cart, CartItem } from "../../services/cartService";
import { QRService } from "../../services/qrService";
import Toast from "react-native-toast-message";
import * as Animatable from "react-native-animatable";

export default function CartScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    loadCart();
  }, [user]);

  const loadCart = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userCart = await cartService.getUserCart(user.uid);
      setCart(userCart);
    } catch (error) {
      console.error("Error loading cart:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load cart",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number
  ) => {
    if (!user?.uid) return;

    const result = await cartService.updateQuantity(
      user.uid,
      productId,
      newQuantity
    );

    if (result.success) {
      await loadCart();
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: result.message,
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!user?.uid) return;

    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const result = await cartService.removeFromCart(
              user.uid,
              productId
            );

            if (result.success) {
              await loadCart();
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Item removed from cart",
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: result.message,
              });
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (!user?.uid || !cart || !cart.cafeId) return;

    setProcessingCheckout(true);

    try {
      // Generate checkout QR token
      const qrToken = await QRService.generateCheckoutQRToken(
        user.uid,
        cart.cafeId
      );

      if (qrToken) {
        // Navigate to QR screen with checkout mode
        router.push({
          pathname: "/(mainUsers)/qr",
          params: {
            checkoutMode: "true",
            cafeId: cart.cafeId,
            cafeName: cart.cafeName,
            totalBeans: cart.totalBeans.toString(),
          },
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to generate checkout QR code",
        });
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Checkout failed. Please try again.",
      });
    } finally {
      setProcessingCheckout(false);
    }
  };

  const renderCartItem = ({
    item,
    index,
  }: {
    item: CartItem;
    index: number;
  }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={styles.cartItem}
    >
      <Image
        source={{ uri: item.product.imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <View style={styles.priceInfo}>
          <Ionicons name="ellipse" size={16} color="#8B4513" />
          <Text style={styles.productPrice}>
            {item.product.beansValue} beans
          </Text>
        </View>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            handleUpdateQuantity(item.product.id, item.quantity - 1)
          }
        >
          <Ionicons name="remove" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.quantityText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            handleUpdateQuantity(item.product.id, item.quantity + 1)
          }
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.product.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </Animatable.View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
        <BottomTabBar />
      </ScreenWrapper>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={80} color="#D7CCC8" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some delicious items from a cafe!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(mainUsers)/map")}
          >
            <Text style={styles.browseButtonText}>Browse Cafes</Text>
          </TouchableOpacity>
        </View>
        <BottomTabBar />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#3C2415" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={styles.headerRight}>
            <Text style={styles.cafeName}>{cart.cafeName}</Text>
          </View>
        </View>

        <FlatList
          data={cart.items}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.product.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={loadCart}
        />

        <View style={styles.bottomContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <View style={styles.totalValueContainer}>
              <Ionicons name="ellipse" size={20} color="#8B4513" />
              <Text style={styles.totalValue}>{cart.totalBeans} beans</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              processingCheckout && styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={processingCheckout}
          >
            {processingCheckout ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="qr-code" size={24} color="#FFFFFF" />
                <Text style={styles.checkoutButtonText}>
                  Proceed to Checkout
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <BottomTabBar />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6D3",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#F5E6D3",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3C2415",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  cafeName: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3C2415",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6A4028",
    marginTop: 8,
    textAlign: "center",
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: "#8B4513",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 15,
    paddingBottom: 180,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#F5E6D3",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2415",
    marginBottom: 4,
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D6C7",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#8B4513",
    marginLeft: 6,
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  quantityButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2415",
    marginHorizontal: 15,
  },
  removeButton: {
    padding: 8,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 75,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3C2415",
  },
  totalValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    marginLeft: 6,
  },
  checkoutButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
