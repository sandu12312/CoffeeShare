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
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useFirebase } from "../context/FirebaseContext";
import { useCart } from "../context/CartContext";
import cartService from "../services/cartService";
import coffeePartnerService, {
  Product,
} from "../services/coffeePartnerService";
import Toast from "react-native-toast-message";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useFirebase();
  const { cartItemCount, refreshCartCount } = useCart();
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [quickProducts, setQuickProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Verific care tab este activ în navigația de jos
  const isActive = (path: string) => {
    // Verific exact ruta pentru a evita potriviri parțiale
    const currentBaseRoute = pathname.split("/").pop();
    return currentBaseRoute === path;
  };

  // Actualizez numărul de produse din coș când tab bar-ul devine activ
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid) {
        __DEV__ &&
          console.log("BottomTabBar: Refresh-ez numărul din coș la focus");
        refreshCartCount();
      }
    }, [user, refreshCartCount])
  );

  // Refresh suplimentar când aplicația devine activă
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && user?.uid) {
        __DEV__ &&
          console.log(
            "BottomTabBar: Refresh-ez numărul din coș când app devine activ"
          );
        setTimeout(() => refreshCartCount(), 500); // Mică întârziere pentru date fresh
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [user, refreshCartCount]);

  // Încarc produsele pentru comandă rapidă
  const loadQuickProducts = async () => {
    if (!user?.uid) return;

    try {
      setLoadingProducts(true);
      // Momentan folosesc o cafenea default, în viitor pot face dinamic
      const cafeId = "vD9S0L4vdd9EBBSmDI7C"; // ID cafenea exemplu
      const products = await coffeePartnerService.getProductsForCafe(cafeId);
      setQuickProducts(products.slice(0, 6)); // Afișez maxim 6 produse
    } catch (error) {
      console.error("Error loading quick products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Adaug rapid produsul în coș
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

      // Refresh-ez numărul din coș pentru a reflecta noul produs
      refreshCartCount();
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

      {/* Buton Coș */}
      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => {
          router.push("/(mainUsers)/cart");
        }}
        onLongPress={() => {
          loadQuickProducts();
          setShowQuickOrder(true);
        }}
      >
        <Ionicons name="cart" size={28} color="#FFFFFF" />
        {cartItemCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
          </View>
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
    height: 75, // Înălțime ușor crescută
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start", // Aliniez elementele sus pentru spațiere mai bună a icoanelor
    backgroundColor: "#FFFFFF", // Fundal alb solid
    borderTopWidth: 1,
    borderTopColor: "#E0D6C7", // Culoare mai deschisă pentru margine
    paddingTop: 8, // Adaug padding sus
    paddingBottom: 5, // Păstrez padding jos pentru safe area
    shadowColor: "#000", // Adaug umbră subtilă
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000, // Mă asigur că apare deasupra altor elemente
  },
  navButton: {
    alignItems: "center",
    flex: 1,
    paddingTop: 2,
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
    backgroundColor: "#8B4513", // Fundal maro pentru iconița activă
  },
  navText: {
    fontSize: 11, // Text puțin mai mare
    color: "#8B4513", // Culoarea textului default
    fontWeight: "500",
  },
  activeNavText: {
    color: "#321E0E", // Text mai întunecat pentru activ
    fontWeight: "600", // Text bold pentru activ
  },
  qrButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    bottom: 25, // Ridic butonul mai mult
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF", // Adaug margine albă pentru definiție
    zIndex: 1001, // Mă asigur că apare deasupra navigației de jos
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
  // Stiluri pentru modalul comenzii rapide
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
