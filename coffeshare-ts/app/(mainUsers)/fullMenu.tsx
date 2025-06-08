import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  TextInput,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFirebase } from "../../context/FirebaseContext";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import coffeePartnerService, {
  Product,
} from "../../services/coffeePartnerService";
import cartService from "../../services/cartService";
import Toast from "react-native-toast-message";
import * as Animatable from "react-native-animatable";

const { width } = Dimensions.get("window");

export default function FullMenu() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();
  const { cartItemCount, refreshCartCount } = useCart();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cafeCategories, setCafeCategories] = useState<string[]>([
    "Coffee",
    "Tea",
    "Pastries",
    "Snacks",
  ]);

  const cafeId = params.cafeId as string;
  const cafeName = params.cafeName as string;

  useEffect(() => {
    loadProducts();
    loadCafeCategories();
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

  const loadCafeCategories = async () => {
    try {
      // For now, keep the default categories since we need cafe service to fetch menuCategories
      // This could be enhanced later to fetch from cafe data
      const categories = ["Coffee", "Tea", "Pastries", "Snacks"];
      setCafeCategories(categories);
    } catch (error) {
      console.error("Error loading cafe categories:", error);
      // Keep default categories on error
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!user?.uid) {
      Toast.show({
        type: "error",
        text1: t("fullMenu.loginRequired"),
        text2: t("fullMenu.pleaseLoginToAdd"),
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
        text1: t("fullMenu.success"),
        text2: t("fullMenu.addedToCart", { productName: product.name }),
      });
      refreshCartCount();
    } else {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: result.message,
      });
    }
  };

  const categories = [t("fullMenu.allCategories"), ...cafeCategories];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === t("fullMenu.allCategories") ||
      product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 50}
      style={styles.productCard}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productCategory} numberOfLines={1}>
          {item.category === "Coffee"
            ? t("fullMenu.coffee")
            : item.category === "Tea"
            ? t("fullMenu.tea")
            : item.category === "Pastries"
            ? t("fullMenu.pastries")
            : t("fullMenu.snacks")}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.beansValue}</Text>
          <Ionicons
            name="ellipse"
            size={12}
            color="#8B4513"
            style={styles.beansIcon}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FFA500" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t("fullMenu.searchIn", { cafeName })}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(mainUsers)/cart")}
          style={styles.cartButton}
        >
          <Ionicons name="bag" size={24} color="#FFFFFF" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
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
              <Ionicons name="cafe" size={64} color="#DDD" />
              <Text style={styles.emptyTitle}>{t("fullMenu.emptyMenu")}</Text>
              <Text style={styles.emptySubtitle}>
                {t("fullMenu.noProducts")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 40,
    marginHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  cartButton: {
    padding: 8,
    marginLeft: 8,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  categoriesContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 12,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
  },
  categoryButtonActive: {
    backgroundColor: "#FFA500",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: "#8B4513",
    marginBottom: 8,
    fontWeight: "500",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 4,
  },
  beansIcon: {
    marginLeft: 2,
  },
  addButton: {
    backgroundColor: "#00C851",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
