import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  ImageBackground,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomTabBar from "../../components/BottomTabBar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFirebase } from "../../context/FirebaseContext";
import cartService, { Cart, CartItem } from "../../services/cartService";
import { QRService } from "../../services/qrService";
import Toast from "react-native-toast-message";
import * as Animatable from "react-native-animatable";
import { useSubscriptionStatus } from "../../hooks/useSubscriptionStatus";
import { ErrorModal } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

export default function CartScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();
  const { refreshCartCount } = useCart();
  const { errorState, showConfirmModal, hideModal } = useErrorHandler();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Obțin starea abonamentului în timp real
  const subscriptionStatus = useSubscriptionStatus(user?.uid);

  const loadCart = useCallback(
    async (isRefreshing = false) => {
      if (!user?.uid) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const userCart = await cartService.getUserCart(user.uid);
        setCart(userCart);

        // Fac log doar în dezvoltare
        if (__DEV__) {
          console.log(
            `Loaded cart for user ${user.uid}:`,
            userCart
              ? `${userCart.totalBeans} beans, ${userCart.items.length} items`
              : "empty cart"
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.error("Error loading cart:", error);
        }
        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("cart.failedToLoadCart"),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid, t]
  );

  // Handler pentru refresh prin pull-to-refresh
  const handleRefresh = useCallback(() => {
    loadCart(true);
  }, [loadCart]);

  // Încarc coșul la mount-ul componentei
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Refresh-ul datelor coșului când ecranul intră în focus
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadCart(false);
      }
    }, [user?.uid, loadCart])
  );

  const handleUpdateQuantity = useCallback(
    async (productId: string, newQuantity: number) => {
      if (!user?.uid || !cart) return;

      // Previn actualizările rapide multiple pe același produs
      if (updatingItems.has(productId)) return;

      // Adaug în setul de actualizare
      setUpdatingItems((prev) => new Set(prev).add(productId));

      // Actualizare optimistă a UI-ului - actualizez imediat starea coșului
      const updatedCart = { ...cart };
      const itemIndex = updatedCart.items.findIndex(
        (item) => item.product.id === productId
      );

      if (itemIndex === -1) {
        setUpdatingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        return;
      }

      const oldQuantity = updatedCart.items[itemIndex].quantity;
      const quantityDiff = newQuantity - oldQuantity;
      const beansDiff =
        updatedCart.items[itemIndex].product.beansValue * quantityDiff;

      // Actualizez cantitatea și totalul de beans în mod optimist
      updatedCart.items[itemIndex].quantity = newQuantity;
      updatedCart.totalBeans += beansDiff;

      // Actualizez UI-ul imediat
      setCart(updatedCart);

      try {
        const result = await cartService.updateQuantity(
          user.uid,
          productId,
          newQuantity
        );

        if (!result.success) {
          // Revert actualizarea optimistă la eșec
          const revertedCart = { ...updatedCart };
          revertedCart.items[itemIndex].quantity = oldQuantity;
          revertedCart.totalBeans -= beansDiff;
          setCart(revertedCart);

          Toast.show({
            type: "error",
            text1: t("common.error"),
            text2: result.message,
          });
        } else {
          // Actualizez contorul coșului din context după actualizarea cu succes
          refreshCartCount();
        }
      } catch (error) {
        // Revert actualizarea optimistă la eroare
        const revertedCart = { ...updatedCart };
        revertedCart.items[itemIndex].quantity = oldQuantity;
        revertedCart.totalBeans -= beansDiff;
        setCart(revertedCart);

        Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("cart.failedToUpdateQuantity"),
        });
      } finally {
        // Elimin din setul de actualizare
        setUpdatingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }
    },
    [user?.uid, cart, updatingItems, refreshCartCount, t]
  );

  const handleRemoveItem = useCallback(
    async (productId: string) => {
      if (!user?.uid || !cart) return;

      showConfirmModal(
        t("cart.removeItem"),
        t("cart.removeItemConfirm"),
        async () => {
          // Găsesc produsul de eliminat pentru actualizarea optimistă
          const itemToRemove = cart.items.find(
            (item) => item.product.id === productId
          );
          if (!itemToRemove) return;

          // Actualizare optimistă a UI-ului - elimin imediat produsul
          const updatedCart = { ...cart };
          updatedCart.items = updatedCart.items.filter(
            (item) => item.product.id !== productId
          );
          updatedCart.totalBeans -=
            itemToRemove.product.beansValue * itemToRemove.quantity;

          // Dacă coșul devine gol, îl setez la null
          if (updatedCart.items.length === 0) {
            setCart(null);
          } else {
            setCart(updatedCart);
          }

          try {
            const result = await cartService.removeFromCart(
              user.uid,
              productId
            );

            if (result.success) {
              Toast.show({
                type: "success",
                text1: t("cart.removed"),
                text2: t("cart.itemRemovedFromCart"),
              });
              // Actualizez contorul coșului din context după eliminarea cu succes
              refreshCartCount();
            } else {
              // Revert actualizarea optimistă la eșec
              setCart(cart);
              Toast.show({
                type: "error",
                text1: t("common.error"),
                text2: result.message,
              });
            }
          } catch (error) {
            // Revert actualizarea optimistă la eroare
            setCart(cart);
            Toast.show({
              type: "error",
              text1: t("common.error"),
              text2: t("cart.failedToRemoveItem"),
            });
          }
        }
      );
    },
    [user?.uid, cart, showConfirmModal, refreshCartCount, t]
  );

  const handleCheckout = useCallback(async () => {
    if (!user?.uid || !cart || !cart.cafeId) return;

    // Verific dacă utilizatorul are suficiente beans
    if (subscriptionStatus.beansLeft < cart.totalBeans) {
      Toast.show({
        type: "error",
        text1: t("cart.insufficientBeans"),
        text2: t("cart.needMoreBeans", {
          needed: cart.totalBeans,
          available: subscriptionStatus.beansLeft,
        }),
      });
      return;
    }

    setProcessingCheckout(true);

    try {
      // Generez token-ul QR pentru checkout
      const qrToken = await QRService.generateCheckoutQRToken(
        user.uid,
        cart.cafeId
      );

      if (qrToken) {
        // Navighez la ecranul QR cu modul checkout
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
          text1: t("common.error"),
          text2: t("cart.failedToGenerateQR"),
        });
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      Toast.show({
        type: "error",
        text1: t("cart.checkoutFailed"),
        text2: t("cart.checkoutFailedMessage"),
      });
    } finally {
      setProcessingCheckout(false);
    }
  }, [user?.uid, cart, subscriptionStatus.beansLeft, router, t]);

  const renderCartItem = useCallback(
    ({ item, index }: { item: CartItem; index: number }) => (
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
            <Ionicons
              name="ellipse"
              size={10}
              color="#8B4513"
              style={styles.beansIcon}
            />
            <Text style={styles.productPrice}>
              {item.product.beansValue} {t("cart.beans")}
            </Text>
          </View>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              updatingItems.has(item.product.id) &&
                styles.quantityButtonDisabled,
            ]}
            onPress={() =>
              handleUpdateQuantity(item.product.id, item.quantity - 1)
            }
            disabled={updatingItems.has(item.product.id)}
          >
            {updatingItems.has(item.product.id) ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={[
              styles.quantityButton,
              updatingItems.has(item.product.id) &&
                styles.quantityButtonDisabled,
            ]}
            onPress={() =>
              handleUpdateQuantity(item.product.id, item.quantity + 1)
            }
            disabled={updatingItems.has(item.product.id)}
          >
            {updatingItems.has(item.product.id) ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="add" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.product.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </Animatable.View>
    ),
    [handleUpdateQuantity, handleRemoveItem, updatingItems, t]
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <ImageBackground
          source={require("../../assets/images/coffee-beans-textured-background.jpg")}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>{t("cart.loading")}</Text>
          </View>
        </ImageBackground>
        <BottomTabBar />
      </ScreenWrapper>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <ScreenWrapper>
        <ImageBackground
          source={require("../../assets/images/coffee-beans-textured-background.jpg")}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.centerContainer}>
            <Ionicons name="cart-outline" size={80} color="#D7CCC8" />
            <Text style={styles.emptyTitle}>{t("cart.emptyCart")}</Text>
            <Text style={styles.emptySubtitle}>
              {t("cart.emptyCartMessage")}
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/(mainUsers)/map")}
            >
              <Text style={styles.browseButtonText}>{t("findCafes")}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
        <BottomTabBar />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ImageBackground
        source={require("../../assets/images/coffee-beans-textured-background.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#3C2415" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("cart.title")}</Text>
            <View style={styles.headerRight}>
              <Text style={styles.cafeName}>{cart.cafeName}</Text>
            </View>
          </View>

          <FlashList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#8B4513"]}
                tintColor="#8B4513"
              />
            }
            estimatedItemSize={120}
            removeClippedSubviews={true}
          />

          <View style={styles.bottomContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>{t("cart.total")}:</Text>
              <View style={styles.totalValueContainer}>
                <Ionicons
                  name="ellipse"
                  size={16}
                  color="#8B4513"
                  style={styles.totalBeansIcon}
                />
                <Text style={styles.totalValue}>
                  {cart.totalBeans} {t("cart.beans")}
                </Text>
              </View>
            </View>

            {subscriptionStatus.isActive && (
              <View style={styles.beansRemainingContainer}>
                <Text style={styles.beansRemainingText}>
                  {t("cart.available")}: {subscriptionStatus.beansLeft}{" "}
                  {t("cart.beans")}
                </Text>
                <Text style={styles.beansAfterPurchaseText}>
                  {t("cart.afterPurchase")}:{" "}
                  {subscriptionStatus.beansLeft - cart.totalBeans}{" "}
                  {t("cart.beans")}
                </Text>
                {subscriptionStatus.beansLeft < cart.totalBeans && (
                  <Text style={styles.insufficientBeansText}>
                    ⚠️ {t("cart.insufficientBeans")}
                  </Text>
                )}
              </View>
            )}

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
                    {t("cart.checkout")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
      <BottomTabBar />

      {/* Componentele pentru erori */}
      <ErrorModal
        visible={errorState.modal.visible}
        title={errorState.modal.title}
        message={errorState.modal.message}
        type={errorState.modal.type}
        onDismiss={hideModal}
        primaryAction={errorState.modal.primaryAction}
        secondaryAction={errorState.modal.secondaryAction}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(245, 230, 211, 0.7)", // Less transparent overlay
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
    padding: 12,
    paddingBottom: 180,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F5E6D3",
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3C2415",
    marginBottom: 4,
    lineHeight: 16,
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D6C7",
    alignSelf: "flex-start",
  },
  beansIcon: {
    alignSelf: "center",
  },
  productPrice: {
    fontSize: 12,
    color: "#8B4513",
    marginLeft: 4,
    fontWeight: "600",
    lineHeight: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityButtonDisabled: {
    opacity: 0.6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2415",
    marginHorizontal: 10,
    textAlign: "center",
    minWidth: 20,
  },
  removeButton: {
    padding: 6,
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
  totalBeansIcon: {
    marginTop: 1,
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
  beansRemainingContainer: {
    paddingVertical: 10,
    alignItems: "center",
  },
  beansRemainingText: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
  beansAfterPurchaseText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
    marginTop: 2,
  },
  insufficientBeansText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
    marginTop: 4,
  },
});
