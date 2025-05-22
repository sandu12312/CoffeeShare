import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../config/firebase";
import Toast from "react-native-toast-message";

interface Product {
  id: string;
  name: string;
  priceLei: number;
  beansValue: number;
  imageUrl: string;
  cafeId: string;
}

export default function ManageProductsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const auth = getAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [productName, setProductName] = useState("");
  const [priceLei, setPriceLei] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "products"),
        where("cafeId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not load products",
      });
    }
  };

  const calculateBeans = (price: number): number => {
    const beans = price / 2.5;
    return Math.ceil(beans * 10) / 10; // Round up to 1 decimal
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `products/${filename}`);

    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleAddProduct = async () => {
    if (!auth.currentUser) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You must be logged in",
      });
      return;
    }

    if (!productName || !priceLei || !image) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill all fields",
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(image);
      const priceNumber = parseFloat(priceLei);
      const beansValue = calculateBeans(priceNumber);

      await addDoc(collection(db, "products"), {
        cafeId: auth.currentUser.uid,
        name: productName,
        priceLei: priceNumber,
        beansValue: beansValue,
        imageUrl: imageUrl,
        createdAt: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Product added successfully",
      });

      // Reset form
      setProductName("");
      setPriceLei("");
      setImage(null);
      setShowForm(false);

      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add product",
      });
    } finally {
      setUploading(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.priceLei} RON</Text>
        <Text style={styles.productBeans}>{item.beansValue} beans</Text>
      </View>
      <TouchableOpacity style={styles.editButton}>
        <Ionicons name="pencil-outline" size={20} color="#8B4513" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#321E0E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestionează Produse</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons
            name={showForm ? "remove-circle-outline" : "add-circle-outline"}
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>
            {showForm ? "Anulează" : "Adaugă Produs Nou"}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Denumire produs"
              value={productName}
              onChangeText={setProductName}
            />

            <TextInput
              style={styles.input}
              placeholder="Preț (lei)"
              value={priceLei}
              onChangeText={setPriceLei}
              keyboardType="decimal-pad"
            />

            {priceLei && (
              <Text style={styles.beansCalculation}>
                Acest produs valorează {calculateBeans(parseFloat(priceLei))}{" "}
                beans
              </Text>
            )}

            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={24} color="#666" />
                  <Text style={styles.imagePickerText}>Adaugă poză produs</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!productName || !priceLei || !image) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleAddProduct}
              disabled={!productName || !priceLei || !image || uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Adaugă Produs</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <Text style={styles.emptyListText}>
              Nu există produse adăugate.
            </Text>
          )}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
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
    marginBottom: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  form: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  beansCalculation: {
    color: "#666",
    fontSize: 14,
    marginBottom: 15,
    fontStyle: "italic",
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
  },
  imagePickerText: {
    color: "#666",
    marginTop: 8,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 6,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 20,
  },
  productItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  productPrice: {
    fontSize: 14,
    color: "#008000",
    marginTop: 4,
  },
  productBeans: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  editButton: {
    padding: 5,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#888",
  },
});
