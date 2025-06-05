import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFirebase } from "../../context/FirebaseContext";
import coffeePartnerService, {
  Product,
} from "../../services/coffeePartnerService";
import cartService from "../../services/cartService";
import Toast from "react-native-toast-message";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

const { height: screenHeight } = Dimensions.get("window");

export default function FullMenuScreen() {
  const router = useRouter();
  const { user } = useFirebase();
  const params = useLocalSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const cafeId = params.cafeId as string;
  const cafeName = params.cafeName as string;

  useEffect(() => {
    loadProducts();
    loadCartCount();
  }, [cafeId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const cafeProducts = await coffeePartnerService.getProductsForCafe(
        cafeId
      );
      setProducts(cafeProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    if (user?.uid) {
      const count = await cartService.getCartItemCount(user.uid);
      setCartItemCount(count);
    }
  };

  const handleAddToCart = async (product: Product) => {
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
      cafeId,
      cafeName,
      1
    );

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `${product.name} added to cart`,
      });
      loadCartCount();
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: result.message,
      });
    }
  };

  const categories = ["All", "Coffee", "Tea", "Pastries", "Snacks"];

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "All") return true;
    // You can add category filtering logic here
    return true;
  });

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={styles.productCard}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.priceRow}>
          <View style={styles.beansContainer}>
            <Ionicons name="ellipse" size={16} color="#8B4513" />
            <Text style={styles.beansText}>{item.beansValue} beans</Text>
          </View>
          <Text style={styles.priceText}>{item.priceLei} RON</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />

      {/* Header */}
      <LinearGradient colors={["#8B4513", "#A0522D"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{cafeName}</Text>
            <Text style={styles.headerSubtitle}>Menu</Text>
          </View>

          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/(mainUsers)/cart")}
          >
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#D7CCC8" />
              <Text style={styles.emptyTitle}>No items available</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for updates!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6D3",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#F5E6D3",
    fontWeight: "500",
  },
  cartButton: {
    padding: 8,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
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
  },
  categoriesContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6C7",
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 15,
    borderRadius: 20,
    backgroundColor: "#F5E6D3",
    borderWidth: 1,
    borderColor: "#E0D6C7",
  },
  categoryButtonActive: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B4513",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
  },
  productsList: {
    padding: 20,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#F5E6D3",
  },
  productInfo: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#321E0E",
    marginBottom: 8,
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  beansContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0D6C7",
  },
  beansText: {
    fontSize: 14,
    color: "#8B4513",
    marginLeft: 6,
    fontWeight: "600",
  },
  priceText: {
    fontSize: 16,
    color: "#6A4028",
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: "#8B4513",
    borderRadius: 16,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: screenHeight * 0.2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6A4028",
    textAlign: "center",
  },
});
