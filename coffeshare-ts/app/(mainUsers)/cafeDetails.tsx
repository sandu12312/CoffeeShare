import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useLanguage } from "../../context/LanguageContext";
import BottomTabBar from "../../components/BottomTabBar";

// Screen width to calculate image dimensions
const { width } = Dimensions.get("window");

// Types
interface CafeDetails {
  id: string;
  businessName: string;
  address: string;
  description: string;
  mainImageUrl: string;
  galleryImages: string[];
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  products: {
    name: string;
    price: number;
    description?: string;
    category: string;
  }[];
  phoneNumber?: string;
  websiteUrl?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Default opening hours format if not specified
const DEFAULT_OPENING_HOURS = {
  monday: { open: "08:00", close: "20:00" },
  tuesday: { open: "08:00", close: "20:00" },
  wednesday: { open: "08:00", close: "20:00" },
  thursday: { open: "08:00", close: "20:00" },
  friday: { open: "08:00", close: "20:00" },
  saturday: { open: "09:00", close: "20:00" },
  sunday: { open: "09:00", close: "18:00" },
};

// Mock data for development in case the cafe doesn't exist in Firestore
const MOCK_CAFE_DETAILS: Record<string, CafeDetails> = {
  "5togo-savoya": {
    id: "5togo-savoya",
    businessName: "5 to Go Eugeniu de Savoya",
    address: "Strada Eugeniu de Savoya 1, Timisoara",
    description:
      "5 to Go is the largest coffee shop chain in Eastern Europe. With fixed prices (5 RON) for all basic products, 5 to Go offers a unique and affordable coffee experience. Visit us to enjoy quality coffee and a relaxed atmosphere.",
    mainImageUrl:
      "https://lh3.googleusercontent.com/p/AF1QipPzDZlVUUkRqwGS1q39H4UfJaGc8znUT9myd1eA=s1360-w1360-h1020",
    galleryImages: [
      "https://lh3.googleusercontent.com/p/AF1QipPzDZlVUUkRqwGS1q39H4UfJaGc8znUT9myd1eA=s1360-w1360-h1020",
      "https://lh3.googleusercontent.com/p/AF1QipMHpgAQE4JGU9oi4ubo1zJCFVjexSZnVQKf2TkE=s1360-w1360-h1020",
      "https://lh3.googleusercontent.com/p/AF1QipO8YrMjQJL_v5hvFq4Wjdj0gNx4rfdJQZ_0Hd5X=s1360-w1360-h1020",
    ],
    openingHours: {
      monday: { open: "07:30", close: "20:00" },
      tuesday: { open: "07:30", close: "20:00" },
      wednesday: { open: "07:30", close: "20:00" },
      thursday: { open: "07:30", close: "20:00" },
      friday: { open: "07:30", close: "20:00" },
      saturday: { open: "08:00", close: "20:00" },
      sunday: { open: "09:00", close: "18:00" },
    },
    products: [
      { name: "Espresso", price: 5, category: "Coffee" },
      { name: "Cappuccino", price: 5, category: "Coffee" },
      { name: "Latte", price: 5, category: "Coffee" },
      { name: "Americano", price: 5, category: "Coffee" },
      { name: "Hot Chocolate", price: 5, category: "Hot Drinks" },
      { name: "Croissant", price: 5, category: "Pastries" },
      { name: "Brownie", price: 5, category: "Pastries" },
    ],
    phoneNumber: "+40721234567",
    websiteUrl: "https://5togo.ro",
    coordinates: {
      latitude: 45.7573,
      longitude: 21.228,
    },
  },
  // Add more mock cafes as needed
};

export default function CafeDetailsScreen() {
  const { cafeId } = useLocalSearchParams();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [cafe, setCafe] = useState<CafeDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCafeDetails = async () => {
      if (!cafeId) {
        setError("No cafe ID provided");
        setLoading(false);
        return;
      }

      try {
        // Try to fetch from Firestore first
        const cafeRef = doc(db, "cafes", cafeId as string);
        const cafeSnapshot = await getDoc(cafeRef);

        if (cafeSnapshot.exists()) {
          const cafeData = cafeSnapshot.data();
          setCafe({
            id: cafeSnapshot.id,
            businessName: cafeData.businessName || "Unnamed Cafe",
            address: cafeData.address || "No address provided",
            description: cafeData.description || "No description available",
            mainImageUrl:
              cafeData.mainImageUrl ||
              "https://via.placeholder.com/400x200?text=No+Image+Available",
            galleryImages: cafeData.galleryImages || [],
            openingHours: cafeData.openingHours || DEFAULT_OPENING_HOURS,
            products: cafeData.products || [],
            phoneNumber: cafeData.phoneNumber,
            websiteUrl: cafeData.websiteUrl,
            coordinates: cafeData.location || { latitude: 0, longitude: 0 },
          });
        } else {
          // If not in Firestore, try to use mock data
          const mockCafe = MOCK_CAFE_DETAILS[cafeId as string];
          if (mockCafe) {
            setCafe(mockCafe);
          } else {
            setError("Cafe not found");
          }
        }
      } catch (err) {
        console.error("Error fetching cafe details:", err);
        setError("Failed to load cafe details");
      } finally {
        setLoading(false);
      }
    };

    fetchCafeDetails();
  }, [cafeId]);

  const openMaps = () => {
    if (!cafe) return;

    const { coordinates } = cafe;
    const label = encodeURIComponent(cafe.businessName);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${coordinates.latitude},${coordinates.longitude}`,
      android: `geo:0,0?q=${coordinates.latitude},${coordinates.longitude}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const callPhone = () => {
    if (cafe?.phoneNumber) {
      Linking.openURL(`tel:${cafe.phoneNumber}`);
    }
  };

  const openWebsite = () => {
    if (cafe?.websiteUrl) {
      Linking.openURL(cafe.websiteUrl);
    }
  };

  const getDayOfWeek = () => {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  };

  const isOpenNow = () => {
    if (!cafe?.openingHours) return false;

    const today = getDayOfWeek();
    const hours = cafe.openingHours[today];

    if (!hours) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const [openHour, openMinute] = hours.open.split(":").map(Number);
    const [closeHour, closeMinute] = hours.close.split(":").map(Number);

    const currentTimeValue = currentHour * 60 + currentMinute;
    const openTimeValue = openHour * 60 + openMinute;
    const closeTimeValue = closeHour * 60 + closeMinute;

    return (
      currentTimeValue >= openTimeValue && currentTimeValue <= closeTimeValue
    );
  };

  const renderDayHours = () => {
    if (!cafe?.openingHours) return null;

    const days = [
      { key: "monday", label: "Monday" },
      { key: "tuesday", label: "Tuesday" },
      { key: "wednesday", label: "Wednesday" },
      { key: "thursday", label: "Thursday" },
      { key: "friday", label: "Friday" },
      { key: "saturday", label: "Saturday" },
      { key: "sunday", label: "Sunday" },
    ];

    const today = getDayOfWeek();

    return days.map((day) => {
      const hours = cafe.openingHours[day.key] || { open: "Closed", close: "" };
      const isToday = day.key === today;

      return (
        <View
          key={day.key}
          style={[styles.scheduleRow, isToday && styles.todayRow]}
        >
          <Text style={[styles.dayText, isToday && styles.todayText]}>
            {day.label}
          </Text>
          <Text style={[styles.hoursText, isToday && styles.todayText]}>
            {hours.open === "Closed"
              ? "Closed"
              : `${hours.open} - ${hours.close}`}
          </Text>
        </View>
      );
    });
  };

  // Group products by category
  const groupedProducts = () => {
    if (!cafe?.products || cafe.products.length === 0) return {};

    return cafe.products.reduce((groups: Record<string, any[]>, product) => {
      const category = product.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading cafe details...</Text>
      </View>
    );
  }

  if (error || !cafe) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#8B4513" />
        <Text style={styles.errorText}>
          {error || "Failed to load cafe information"}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: cafe.businessName,
          headerBackTitle: "Map",
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cover Image */}
          <Image
            source={{ uri: cafe.mainImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* Open/Closed Status Banner */}
          <View
            style={[
              styles.statusBanner,
              isOpenNow() ? styles.openBanner : styles.closedBanner,
            ]}
          >
            <Text style={styles.statusText}>
              {isOpenNow() ? "Open Now" : "Closed"}
            </Text>
            {isOpenNow() && (
              <Text style={styles.statusDetails}>
                Until {cafe.openingHours[getDayOfWeek()]?.close}
              </Text>
            )}
          </View>

          {/* Cafe Name and Address */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{cafe.businessName}</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={16} color="#8B4513" />
              <Text style={styles.address}>{cafe.address}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={openMaps}>
              <Ionicons name="navigate-outline" size={22} color="#8B4513" />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>

            {cafe.phoneNumber && (
              <TouchableOpacity style={styles.actionButton} onPress={callPhone}>
                <Ionicons name="call-outline" size={22} color="#8B4513" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}

            {cafe.websiteUrl && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openWebsite}
              >
                <Ionicons name="globe-outline" size={22} color="#8B4513" />
                <Text style={styles.actionButtonText}>Website</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={22} color="#8B4513" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{cafe.description}</Text>
          </View>

          {/* Gallery */}
          {cafe.galleryImages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.galleryContainer}
              >
                {cafe.galleryImages.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Menu/Products */}
          {cafe.products.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Menu</Text>
              {Object.entries(groupedProducts()).map(([category, products]) => (
                <View key={category} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {products.map((product, index) => (
                    <View key={index} style={styles.productItem}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        {product.description && (
                          <Text style={styles.productDescription}>
                            {product.description}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.productPrice}>
                        {product.price} RON
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Opening Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            <View style={styles.scheduleContainer}>{renderDayHours()}</View>
          </View>
        </ScrollView>

        <BottomTabBar />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100, // Ensure content is not hidden behind the tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8B4513",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#8B4513",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  coverImage: {
    width: width,
    height: 250,
    marginHorizontal: -15, // Offset the scroll content padding
  },
  statusBanner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: -15, // Offset the scroll content padding
  },
  openBanner: {
    backgroundColor: "#E6F7E9",
  },
  closedBanner: {
    backgroundColor: "#FAE6E6",
  },
  statusText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333333",
  },
  statusDetails: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  headerContainer: {
    padding: 15,
    marginHorizontal: -15, // Offset the scroll content padding
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#321E0E",
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  address: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 5,
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F0EAE2",
    marginHorizontal: 0, // Keep this aligned with scroll content padding
  },
  actionButton: {
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: "#8B4513",
  },
  section: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE2",
    marginHorizontal: -15, // Offset the scroll content padding
    paddingHorizontal: 15, // Add back horizontal padding
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
  },
  galleryContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  galleryImage: {
    width: 140,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
    marginBottom: 8,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE2",
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
  },
  productDescription: {
    fontSize: 12,
    color: "#777777",
    marginTop: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8B4513",
  },
  scheduleContainer: {
    backgroundColor: "#F9F6F2",
    borderRadius: 8,
    padding: 10,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE2",
  },
  todayRow: {
    backgroundColor: "#F7EFE7",
    borderRadius: 6,
  },
  dayText: {
    fontSize: 14,
    color: "#555555",
  },
  hoursText: {
    fontSize: 14,
    color: "#555555",
  },
  todayText: {
    fontWeight: "600",
    color: "#8B4513",
  },
});
