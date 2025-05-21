import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage } from "../../context/LanguageContext";

const DEFAULT_REGION: Region = {
  latitude: 45.7579, // Timisoara Latitude
  longitude: 21.2287, // Timisoara Longitude
  latitudeDelta: 0.04,
  longitudeDelta: 0.02,
};

interface Cafe {
  id: string;
  businessName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string; // Add address if available in your Firestore data
  imageUrl?: string; // Added for café image
}

// Static list of "5 to Go" locations in Timisoara
const FIVE_TO_GO_LOCATIONS: Cafe[] = [
  {
    id: "5togo-savoya",
    businessName: "5 to Go Eugeniu de Savoya",
    location: { latitude: 45.7573, longitude: 21.228 },
    address: "Strada Eugeniu de Savoya 1",
    imageUrl:
      "https://lh3.googleusercontent.com/p/AF1QipPzDZlVUUkRqwGS1q39H4UfJaGc8znUT9myd1eA=s1360-w1360-h1020",
  },
  {
    id: "5togo-victoriei",
    businessName: "5 to Go Piața Victoriei",
    location: { latitude: 45.7549, longitude: 21.2265 },
    address: "Piața Victoriei 5",
    imageUrl:
      "https://lh3.googleusercontent.com/p/AF1QipPsigUBwdtBx_ECHEJczh-CVmiKeuXxSx8NIz0L=s1360-w1360-h1020",
  },
  {
    id: "5togo-shoppingcity",
    businessName: "5 to Go Shopping City",
    location: { latitude: 45.7433, longitude: 21.1967 },
    address: "Bulevardul Cetății 70",
    imageUrl:
      "https://lh3.googleusercontent.com/p/AF1QipM8p8VMbLlxRvHI3VNKDR6_vk2QurgtRZIVXPux=s1360-w1360-h1020",
  },
  {
    id: "5togo-lazar",
    businessName: "5 to Go Gheorghe Lazăr",
    location: { latitude: 45.7604, longitude: 21.2238 },
    address: "Strada Gheorghe Lazăr 24",
    imageUrl:
      "https://lh3.googleusercontent.com/p/AF1QipNV2r64-ZZknUVsXz--MPUvxQ-lUDo1BNk_oJ81=s1360-w1360-h1020",
  },
  {
    id: "5togo-iuliustown",
    businessName: "5 to Go Iulius Town",
    location: { latitude: 45.7639, longitude: 21.2301 },
    address: "Strada Circumvalatiunii 8-12",
    imageUrl:
      "https://lh3.googleusercontent.com/p/AF1QipOd_TmcuXOAR_FylS4GyH9c36EwD49LzsjdQj5F=s1360-w1360-h1020",
  },
  {
    id: "5togo-martirilor",
    businessName: "5 to Go Calea Martirilor",
    location: { latitude: 45.7407, longitude: 21.2343 },
    address: "Calea Martirilor 1989 nr. 60",
    imageUrl:
      "https://lh3.googleusercontent.com/p/AF1QipObkYcDEYYBSrq9i_yO2Tq3DsSo_qELqpQ7yg4w=s1360-w1360-h1020",
  },
  // Add more locations here if known
];

export default function MapScreen() {
  const { t } = useLanguage();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // Animation value for sliding in bottom sheet
  const slideAnim = useRef(new Animated.Value(-200)).current;

  const fetchCafes = async () => {
    setFetchError(null);
    try {
      const cafesQuery = query(
        collection(db, "cafes"),
        where("status", "==", "active")
      );
      const querySnapshot = await getDocs(cafesQuery);
      const cafesData: Cafe[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.location &&
          typeof data.location.latitude === "number" &&
          typeof data.location.longitude === "number"
        ) {
          cafesData.push({
            id: doc.id,
            businessName: data.businessName || t("map.unnamedCafe"),
            location: data.location,
            address: data.address || t("map.noAddress"),
            imageUrl: data.imageUrl || undefined,
          });
        } else {
          console.warn(`Cafe ${doc.id} missing or has invalid location data.`);
        }
      });
      setCafes(cafesData);
    } catch (error) {
      console.error("Error fetching cafes:", error);
      setFetchError(t("map.cafesFetchError")); // Tradus
    }
  };

  // Function to request permissions and get location
  const getLocationAsync = async () => {
    setLocationError(null); // Reset location error
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationError(t("map.locationPermissionDenied")); // Tradus
      console.warn("Location permission denied.");
      return null; // Indicate permission failure
    }

    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const currentUserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(currentUserLocation);
      console.log("User location obtained:", currentUserLocation);
      return currentUserLocation;
    } catch (error) {
      console.error("Error getting current location:", error);
      setLocationError(t("map.locationFetchError"));
    }
  };

  useEffect(() => {
    const loadMapData = async () => {
      setLoading(true);
      await getLocationAsync();
      await fetchCafes();
      setLoading(false);
    };
    loadMapData();
  }, []);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLocationError(null);
    setFetchError(null);
    await getLocationAsync();
    await fetchCafes();
    setRefreshing(false);
  }, []);

  // Handle marker press
  const handleMarkerPress = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setBottomSheetVisible(true);

    // Animate the bottom sheet sliding up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Navigate to cafe details screen
  const navigateToCafeDetails = () => {
    if (selectedCafe) {
      router.push({
        pathname: "/(mainUsers)/cafeDetails",
        params: { cafeId: selectedCafe.id },
      });
    }
  };

  // Close bottom sheet
  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setBottomSheetVisible(false);
    });
  };

  const allCafes = [...cafes, ...FIVE_TO_GO_LOCATIONS];
  const filteredCafes = allCafes.filter((cafe) =>
    cafe.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Default cafe image
  const defaultCafeImage =
    "https://via.placeholder.com/400x200?text=No+Image+Available";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Map View */}
      <MapView
        provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        onRegionChangeComplete={setMapRegion}
      >
        {filteredCafes.map((cafe) => (
          <Marker
            key={cafe.id}
            coordinate={cafe.location}
            title={cafe.businessName}
            description={cafe.address}
            pinColor={"#8B4513"}
            onPress={() => handleMarkerPress(cafe)}
          />
        ))}
      </MapView>

      {/* Header/Search Bar Overlay */}
      <View style={styles.headerOverlay}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("map.searchPlaceholder")}
          placeholderTextColor="#A08C7D"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() =>
            Alert.alert(t("map.filterAlertTitle"), t("map.filterAlertMessage"))
          }
        >
          <Ionicons name="options-outline" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet for Selected Cafe */}
      {bottomSheetVisible && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.bottomSheetHandle} />

          {selectedCafe && (
            <TouchableOpacity
              style={styles.cafeCardContainer}
              onPress={navigateToCafeDetails}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: selectedCafe.imageUrl || defaultCafeImage }}
                style={styles.cafeCardImage}
                resizeMode="cover"
              />
              <View style={styles.cafeCardInfo}>
                <Text style={styles.cafeCardName}>
                  {selectedCafe.businessName}
                </Text>
                <View style={styles.addressContainer}>
                  <Ionicons name="location" size={16} color="#8B4513" />
                  <Text style={styles.cafeCardAddress}>
                    {selectedCafe.address}
                  </Text>
                </View>
                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>
                    {t("map.viewDetails")}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8B4513" />
                </View>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeBottomSheet}
          >
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>{t("map.loading")}</Text>
        </View>
      )}

      {/* Refresh Button */}
      {!loading && (
        <TouchableOpacity
          style={[
            styles.refreshButton,
            refreshing ? styles.refreshButtonDisabled : null,
          ]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}

      {/* Error Overlays */}
      {locationError && !loading && (
        <View style={[styles.errorOverlay, styles.errorOverlayLocation]}>
          <Ionicons
            name="warning-outline"
            size={18}
            color="#FFA500"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}
      {fetchError && !loading && (
        <View style={[styles.errorOverlay, styles.errorOverlayFetch]}>
          <Ionicons
            name="cloud-offline-outline"
            size={18}
            color="#FF6347"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      {/* No Results Message */}
      {!loading && filteredCafes.length === 0 && allCafes.length > 0 && (
        <View style={styles.noResultsOverlay}>
          <Text style={styles.noResultsText}>
            {t("map.noResultsFound", { searchQuery: searchQuery })}
          </Text>
        </View>
      )}
      {!loading && allCafes.length === 0 && !fetchError && (
        <View style={styles.noResultsOverlay}>
          <Text style={styles.noResultsText}>{t("map.noCafesNearby")}</Text>
        </View>
      )}

      {/* Bottom Navigation Bar */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

// Reusing and adapting styles from Dashboard
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Light background for the screen
    paddingBottom: 75, // Adjusted padding for new tab bar height
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245, 245, 245, 0.8)", // Semi-transparent overlay
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10, // Ensure it's above the map
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
  },
  headerOverlay: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 60, // Adjust for status bar
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.98)", // Slightly more opaque
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
    zIndex: 5, // Above map, below loading/error overlays
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E", // Dark brown text
    marginRight: 8,
  },
  filterButton: {
    padding: 5,
  },
  refreshButton: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 40 : 20, // Adjust position for different platforms
    backgroundColor: "#8B4513", // Brown background
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  refreshButtonDisabled: {
    backgroundColor: "#A0522D", // Lighter brown when disabled
  },
  errorOverlay: {
    position: "absolute",
    left: 15,
    right: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row", // Align icon and text
    justifyContent: "center",
    zIndex: 6, // Above header/refresh, below loading
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  errorOverlayLocation: {
    bottom: Platform.OS === "ios" ? 100 : 80, // Position above potential tab bar area
    backgroundColor: "rgba(255, 248, 220, 0.95)", // Light yellow warning
  },
  errorOverlayFetch: {
    bottom: Platform.OS === "ios" ? 150 : 130, // Position above location error
    backgroundColor: "rgba(255, 228, 225, 0.95)", // Light red error
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6A4028", // Darker brown text for better contrast
    textAlign: "center",
    flexShrink: 1, // Allow text to wrap
  },
  noResultsOverlay: {
    position: "absolute",
    top: Platform.OS === "android" ? 120 : 140, // Below header
    left: 15,
    right: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 5, // Above map
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  noResultsText: {
    color: "#8B4513",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  // Bottom sheet styles
  bottomSheet: {
    position: "absolute",
    bottom: 75,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 6,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0D6C7",
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 7,
  },
  cafeCardContainer: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
  },
  cafeCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  cafeCardInfo: {
    flex: 1,
  },
  cafeCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cafeCardAddress: {
    fontSize: 13,
    color: "#6A4028",
    marginLeft: 4,
    flex: 1,
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8B4513",
    marginRight: 4,
  },
});
