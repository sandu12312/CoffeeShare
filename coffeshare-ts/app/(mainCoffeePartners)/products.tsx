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
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

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

  const renderProductItem = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={styles.productItem}
    >
      <LinearGradient
        colors={["#FFFFFF", "#FFF8F3"]}
        style={styles.productGradient}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{item.priceLei} RON</Text>
            <View style={styles.beansBadge}>
              <Ionicons name="cafe" size={14} color="#8B4513" />
              <Text style={styles.productBeans}>{item.beansValue}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <LinearGradient
            colors={["#8B4513", "#A0522D"]}
            style={styles.editButtonGradient}
          >
            <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animatable.View>
  );

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#3C2415" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestionează Produse</Text>
          <View style={{ width: 24 }} />
        </View>

        <Animatable.View animation="fadeInDown" duration={600}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(!showForm)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                showForm ? ["#D32F2F", "#F44336"] : ["#8B4513", "#A0522D"]
              }
              style={styles.addButtonGradient}
            >
              <Ionicons
                name={showForm ? "close-circle" : "add-circle"}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>
                {showForm ? "Anulează" : "Adaugă Produs Nou"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {showForm && (
          <Animatable.View
            animation="fadeInUp"
            duration={500}
            style={styles.form}
          >
            <LinearGradient
              colors={["#FFFFFF", "#FFF8F3"]}
              style={styles.formGradient}
            >
              <Text style={styles.formTitle}>Produs Nou</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="cafe-outline"
                  size={20}
                  color="#8B4513"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Denumire produs"
                  placeholderTextColor="#A0522D"
                  value={productName}
                  onChangeText={setProductName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color="#8B4513"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Preț (lei)"
                  placeholderTextColor="#A0522D"
                  value={priceLei}
                  onChangeText={setPriceLei}
                  keyboardType="decimal-pad"
                />
              </View>

              {priceLei && (
                <Animatable.View
                  animation="fadeIn"
                  style={styles.beansCalculation}
                >
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="#8B4513"
                  />
                  <Text style={styles.beansText}>
                    Acest produs valorează{" "}
                    {calculateBeans(parseFloat(priceLei))} beans
                  </Text>
                </Animatable.View>
              )}

              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <LinearGradient
                    colors={["#F5E6D3", "#D7CCC8"]}
                    style={styles.imagePickerGradient}
                  >
                    <Ionicons name="image-outline" size={32} color="#8B4513" />
                    <Text style={styles.imagePickerText}>
                      Adaugă poză produs
                    </Text>
                  </LinearGradient>
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
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    !productName || !priceLei || !image
                      ? ["#D7CCC8", "#BCAAA4"]
                      : ["#4CAF50", "#66BB6A"]
                  }
                  style={styles.submitButtonGradient}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#FFF"
                      />
                      <Text style={styles.submitButtonText}>Adaugă Produs</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animatable.View>
        )}

        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={60} color="#D7CCC8" />
              <Text style={styles.emptyListText}>
                Nu există produse adăugate.
              </Text>
              <Text style={styles.emptySubtext}>
                Apasă butonul de mai sus pentru a adăuga primul produs
              </Text>
            </View>
          )}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6D3",
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
  addButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  form: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  formGradient: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3C2415",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#D7CCC8",
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 15,
    fontSize: 16,
    color: "#3C2415",
  },
  beansCalculation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  beansText: {
    color: "#8B4513",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  imagePickerButton: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePickerGradient: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    color: "#8B4513",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  previewImage: {
    width: "100%",
    height: 200,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContainer: {
    padding: 20,
    paddingTop: 5,
  },
  productItem: {
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  productGradient: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#3C2415",
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productPrice: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  beansBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  productBeans: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
  editButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  editButtonGradient: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyListText: {
    fontSize: 18,
    color: "#8B4513",
    marginTop: 20,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#A0522D",
    marginTop: 8,
  },
});
