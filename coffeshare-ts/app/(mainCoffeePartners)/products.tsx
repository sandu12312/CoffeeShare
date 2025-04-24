import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Dummy data for products
const initialProducts = [
  { id: "1", name: "Espresso", price: 5.0, category: "Cafea" },
  { id: "2", name: "Cappuccino", price: 8.0, category: "Cafea" },
  { id: "3", name: "Latte Macchiato", price: 9.5, category: "Cafea" },
  { id: "4", name: "Croissant Unt", price: 6.0, category: "Patiserie" },
  { id: "5", name: "Fresh Portocale", price: 12.0, category: "Băuturi" },
];

type Product = (typeof initialProducts)[0];

export default function ManageProductsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);

  const handleAddProduct = () => {
    // TODO: Navigate to Add/Edit Product screen
    console.log("Navigate to Add Product screen");
    Alert.alert(
      "Adaugă Produs",
      "Funcționalitate de adăugare produs în curând!"
    );
  };

  const handleEditProduct = (product: Product) => {
    // TODO: Navigate to Add/Edit Product screen with product data
    console.log("Navigate to Edit Product screen for:", product.name);
    Alert.alert(
      "Editează Produs",
      `Funcționalitate de editare pentru ${product.name} în curând!`
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleEditProduct(item)}
        style={styles.editButton}
      >
        <Ionicons name="pencil-outline" size={20} color="#8B4513" />
      </TouchableOpacity>
      {/* TODO: Add delete functionality maybe with swipe actions */}
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#321E0E" />
        </TouchableOpacity>
        {/* TODO: Add translation key 'manageProductsTitle' */}
        <Text style={styles.headerTitle}>Gestionează Produse</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
        <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
        {/* TODO: Add translation key 'addNewProduct' */}
        <Text style={styles.addButtonText}>Adaugă Produs Nou</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>Nu există produse adăugate.</Text>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50, // Adjust for status bar height
    paddingBottom: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  addButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10, // Space before the list
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1, // Take available space
    marginRight: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  productPrice: {
    fontSize: 14,
    color: "#008000", // Green for price
    marginTop: 4,
  },
  productCategory: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    fontStyle: "italic",
  },
  editButton: {
    padding: 5, // Make it easier to tap
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#888",
  },
});
