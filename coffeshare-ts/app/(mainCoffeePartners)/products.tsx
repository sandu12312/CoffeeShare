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
  ImageBackground,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";
import coffeePartnerService, {
  CafeDetails,
} from "../../services/coffeePartnerService";
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
  category: "Coffee" | "Tea" | "Pastries" | "Snacks";
}

export default function ManageProductsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const auth = getAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [cafes, setCafes] = useState<CafeDetails[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Starea formularului
  const [productName, setProductName] = useState("");
  const [priceLei, setPriceLei] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "Coffee" | "Tea" | "Pastries" | "Snacks"
  >("Coffee");

  // Starea editării
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCafesAndProducts();
  }, []);

  const loadCafesAndProducts = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);

      // Încarc cafenelele utilizatorului
      const myCafes = await coffeePartnerService.getMyCafes();
      setCafes(myCafes);

      // Setez prima cafenea activă ca fiind selectată implicit
      const activeCafe = myCafes.find((cafe) => cafe.status === "active");
      if (activeCafe) {
        setSelectedCafe(activeCafe.id);
        // Încarc produsele pentru cafeneaua selectată
        await loadProductsForCafe(activeCafe.id);
      }
    } catch (error) {
      console.error("Error loading cafes and products:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not load data",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductsForCafe = async (cafeId: string) => {
    if (!cafeId) {
      setProducts([]);
      return;
    }

    try {
      const cafeProducts = await coffeePartnerService.getMyProductsForCafe(
        cafeId
      );
      setProducts(cafeProducts);
    } catch (error) {
      console.error("Error loading products for cafe:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not load products for this cafe",
      });
    }
  };

  const calculateBeans = (price: number): number => {
    const beans = price / 2.5;
    return Math.ceil(beans * 10) / 10; // Rotunjesc în sus la 1 zecimală
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditing(true);
    setProductName(product.name);
    setPriceLei(product.priceLei.toString());
    setSelectedCategory(product.category);
    setImage(product.imageUrl);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsEditing(false);
    setProductName("");
    setPriceLei("");
    setSelectedCategory("Coffee");
    setImage(null);
    setShowForm(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await coffeePartnerService.deleteProduct(productId);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Product deleted successfully",
      });

      // Reîmprospătez lista de produse pentru cafeneaua selectată
      await loadProductsForCafe(selectedCafe);
    } catch (error) {
      console.error("Error deleting product:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete product",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!auth.currentUser || !editingProduct) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Authentication or product data missing",
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
      let imageUrl = image;

      // Upload imaginea nouă doar dacă diferă de cea curentă
      if (image !== editingProduct.imageUrl) {
        imageUrl = await uploadImage(image);
      }

      const priceNumber = parseFloat(priceLei);
      const beansValue = calculateBeans(priceNumber);

      await coffeePartnerService.updateProduct(editingProduct.id, {
        name: productName,
        priceLei: priceNumber,
        beansValue: beansValue,
        imageUrl: imageUrl,
        category: selectedCategory,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Product updated successfully",
      });

      // Resetez formularul și starea de editare
      handleCancelEdit();

      // Reîmprospătez lista de produse pentru cafeneaua selectată
      await loadProductsForCafe(selectedCafe);
    } catch (error) {
      console.error("Error updating product:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update product",
      });
    } finally {
      setUploading(false);
    }
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

    if (!productName || !priceLei || !image || !selectedCafe) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill all fields and select a cafe",
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(image);
      const priceNumber = parseFloat(priceLei);
      const beansValue = calculateBeans(priceNumber);

      await coffeePartnerService.addProduct({
        cafeId: selectedCafe,
        name: productName,
        priceLei: priceNumber,
        beansValue: beansValue,
        imageUrl: imageUrl,
        category: selectedCategory,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Product added successfully",
      });

      // Resetez formularul
      setProductName("");
      setPriceLei("");
      setImage(null);
      setSelectedCategory("Coffee");
      setShowForm(false);
      setIsEditing(false);
      setEditingProduct(null);

      // Reîmprospătez lista de produse pentru cafeneaua selectată
      await loadProductsForCafe(selectedCafe);
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
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditProduct(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#8B4513", "#A0522D"]}
              style={styles.editButtonGradient}
            >
              <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Șterge Produs",
                `Ești sigur că vrei să ștergi "${item.name}"?`,
                [
                  { text: "Anulează", style: "cancel" },
                  {
                    text: "Șterge",
                    style: "destructive",
                    onPress: () => handleDeleteProduct(item.id),
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#F44336", "#D32F2F"]}
              style={styles.deleteButtonGradient}
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  return (
    <ScreenWrapper>
      <ImageBackground
        source={require("../../assets/images/BackGroundCoffeePartners app.jpg")}
        style={styles.container}
        resizeMode="cover"
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
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

          {/* Cafe Selection */}
          <Animatable.View animation="fadeInDown" duration={600}>
            <View style={styles.cafeSelectionContainer}>
              <Text style={styles.cafeSelectionLabel}>
                Selectează Cafeneaua:
              </Text>
              <TouchableOpacity
                style={styles.cafeDropdown}
                onPress={() => {
                  if (cafes.length === 0) {
                    Toast.show({
                      type: "info",
                      text1: "Info",
                      text2: "Nu aveți cafenele active",
                    });
                    return;
                  }
                  Alert.alert(
                    "Selectează Cafeneaua",
                    "Alege pentru care cafenea vrei să gestionezi produsele:",
                    [
                      ...cafes
                        .filter((cafe) => cafe.status === "active")
                        .map((cafe) => ({
                          text: cafe.businessName,
                          onPress: () => {
                            setSelectedCafe(cafe.id);
                            loadProductsForCafe(cafe.id);
                          },
                        })),
                      { text: "Anulează", style: "cancel" },
                    ]
                  );
                }}
              >
                <Text style={styles.cafeDropdownText}>
                  {selectedCafe
                    ? cafes.find((c) => c.id === selectedCafe)?.businessName ||
                      "Selectează cafeneaua"
                    : "Selectează cafeneaua"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInDown" duration={600}>
            <TouchableOpacity
              style={[
                styles.addButton,
                !selectedCafe && styles.addButtonDisabled,
              ]}
              onPress={() => {
                if (!selectedCafe) {
                  Toast.show({
                    type: "info",
                    text1: "Info",
                    text2: "Selectează o cafenea mai întâi",
                  });
                  return;
                }
                if (isEditing) {
                  handleCancelEdit();
                } else {
                  setShowForm(!showForm);
                }
              }}
              activeOpacity={0.8}
              disabled={!selectedCafe}
            >
              <LinearGradient
                colors={
                  !selectedCafe
                    ? ["#D7CCC8", "#BCAAA4"]
                    : showForm
                    ? ["#D32F2F", "#F44336"]
                    : ["#8B4513", "#A0522D"]
                }
                style={styles.addButtonGradient}
              >
                <Ionicons
                  name={
                    showForm
                      ? "close-circle"
                      : isEditing
                      ? "pencil"
                      : "add-circle"
                  }
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.addButtonText}>
                  {showForm
                    ? "Anulează"
                    : isEditing
                    ? "Editează Produs"
                    : "Adaugă Produs Nou"}
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
                <Text style={styles.formTitle}>
                  {isEditing ? "Editează Produs" : "Produs Nou"}
                </Text>

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

                {/* Category Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Categorie Produs</Text>
                  <View style={styles.categoriesContainer}>
                    {(["Coffee", "Tea", "Pastries", "Snacks"] as const).map(
                      (category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryChip,
                            selectedCategory === category &&
                              styles.categoryChipSelected,
                          ]}
                          onPress={() => setSelectedCategory(category)}
                        >
                          <Ionicons
                            name={
                              selectedCategory === category
                                ? "checkmark-circle"
                                : "ellipse-outline"
                            }
                            size={18}
                            color={
                              selectedCategory === category
                                ? "#FFFFFF"
                                : "#8B4513"
                            }
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              selectedCategory === category &&
                                styles.categoryChipTextSelected,
                            ]}
                          >
                            {category === "Coffee"
                              ? "Cafea"
                              : category === "Tea"
                              ? "Ceai"
                              : category === "Pastries"
                              ? "Prăjituri"
                              : "Gustări"}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
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
                    <Image
                      source={{ uri: image }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={["#F5E6D3", "#D7CCC8"]}
                      style={styles.imagePickerGradient}
                    >
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color="#8B4513"
                      />
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
                  onPress={isEditing ? handleUpdateProduct : handleAddProduct}
                  disabled={!productName || !priceLei || !image || uploading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      !productName || !priceLei || !image
                        ? ["#D7CCC8", "#BCAAA4"]
                        : isEditing
                        ? ["#FF9800", "#F57C00"]
                        : ["#4CAF50", "#66BB6A"]
                    }
                    style={styles.submitButtonGradient}
                  >
                    {uploading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons
                          name={isEditing ? "save" : "checkmark-circle"}
                          size={20}
                          color="#FFF"
                        />
                        <Text style={styles.submitButtonText}>
                          {isEditing ? "Actualizează Produs" : "Adaugă Produs"}
                        </Text>
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
      </ImageBackground>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  cafeSelectionContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  cafeSelectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2415",
    marginBottom: 10,
  },
  cafeDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7CCC8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cafeDropdownText: {
    fontSize: 16,
    color: "#3C2415",
    fontWeight: "500",
    flex: 1,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  // Stiluri pentru selecția categoriei
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2415",
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#8B4513",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: "#8B4513",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "600",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
  },
  // Stiluri pentru butoanele de acțiune
  actionButtons: {
    flexDirection: "column",
    gap: 8,
  },
  deleteButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  deleteButtonGradient: {
    padding: 10,
  },
});
