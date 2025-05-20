import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useLanguage } from "../../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFirebase } from "../../context/FirebaseContext";
import { CafeProfile } from "../../types";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const GenerateQRScreen = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { cafeId } = useLocalSearchParams<{ cafeId: string }>();
  const { canRedeemCoffee } = useFirebase();

  const [cafe, setCafe] = useState<CafeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string | null>(
    null
  );
  const [showQRCode, setShowQRCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cafeId) {
      setError("No cafe selected");
      setLoading(false);
      return;
    }

    const fetchCafeData = async () => {
      try {
        const cafeRef = doc(db, "cafes", cafeId);
        const cafeDoc = await getDoc(cafeRef);

        if (!cafeDoc.exists()) {
          setError("Cafe not found");
          setLoading(false);
          return;
        }

        const cafeData = cafeDoc.data() as CafeProfile;
        setCafe(cafeData);

        // Check if user can redeem coffee
        const canRedeem = await canRedeemCoffee();
        if (!canRedeem.canRedeem) {
          setError(canRedeem.reason || "Cannot redeem coffee at this time");
        }
      } catch (err) {
        console.error("Error fetching cafe data:", err);
        setError("Failed to load cafe data");
      } finally {
        setLoading(false);
      }
    };

    fetchCafeData();
  }, [cafeId]);

  const handleProductSelect = (productId: string, productName: string) => {
    setSelectedProduct(productId);
    setSelectedProductName(productName);
  };

  const handleGenerateQR = async () => {
    try {
      // Additional check before showing QR
      const canRedeem = await canRedeemCoffee();
      if (!canRedeem.canRedeem) {
        Alert.alert(
          "Cannot Redeem",
          canRedeem.reason || "You cannot redeem a coffee at this time"
        );
        return;
      }

      setShowQRCode(true);
    } catch (err) {
      console.error("Error checking redemption:", err);
      Alert.alert("Error", "Failed to generate QR code. Please try again.");
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading cafe details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  if (showQRCode && cafe) {
    return (
      <ScreenWrapper>
        <QRCodeGenerator
          cafeId={cafeId}
          cafeName={cafe.name}
          productId={selectedProduct || undefined}
          productName={selectedProductName || undefined}
          onClose={() => setShowQRCode(false)}
        />
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
            <Ionicons name="arrow-back" size={24} color="#321E0E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate QR Code</Text>
        </View>

        {cafe && (
          <View style={styles.cafeInfoContainer}>
            <Text style={styles.cafeName}>{cafe.name}</Text>
            <Text style={styles.cafeAddress}>
              {cafe.address.street}, {cafe.address.city}
            </Text>

            <Text style={styles.sectionTitle}>Select Your Coffee</Text>

            <ScrollView style={styles.productList}>
              {cafe.products && cafe.products.length > 0 ? (
                cafe.products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productCard,
                      selectedProduct === product.id &&
                        styles.selectedProductCard,
                    ]}
                    onPress={() =>
                      handleProductSelect(product.id, product.name)
                    }
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription}>
                        {product.description}
                      </Text>
                    </View>
                    {selectedProduct === product.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#4CAF50"
                      />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noProductsText}>No products available</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateQR}
            >
              <Text style={styles.generateButtonText}>Generate QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    margin: 20,
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#FFF",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  cafeInfoContainer: {
    flex: 1,
    padding: 20,
  },
  cafeName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
  },
  cafeAddress: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginTop: 20,
    marginBottom: 15,
  },
  productList: {
    flex: 1,
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedProductCard: {
    backgroundColor: "#F0E4D7",
    borderColor: "#8B4513",
    borderWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#321E0E",
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  noProductsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  generateButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  generateButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GenerateQRScreen;
