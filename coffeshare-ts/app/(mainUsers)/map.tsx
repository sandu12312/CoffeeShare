import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  FlatList,
  RefreshControl,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage } from "../../context/LanguageContext";
import coffeePartnerService, {
  Product,
} from "../../services/coffeePartnerService";
import cartService from "../../services/cartService";
import { useFirebase } from "../../context/FirebaseContext";
import { useCart } from "../../context/CartContext";
import Toast from "react-native-toast-message";
import * as Animatable from "react-native-animatable";
import { Toast as ErrorToast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

// Coordonatele importante pentru România
const DEFAULT_REGION: Region = {
  latitude: 45.7579, // Latitudinea Timișoarei
  longitude: 21.2287, // Longitudinea Timișoarei
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
  address: string; // Adaug adresa dacă e disponibilă în datele Firestore
  imageUrl?: string; // Adăugat pentru imaginea cafenelei
}

interface RomanianCity {
  name: string;
  latitude: number;
  longitude: number;
  region: string;
}

// Orașele importante din România cu coordonatele lor
const ROMANIAN_CITIES: RomanianCity[] = [
  {
    name: "București",
    latitude: 44.4268,
    longitude: 26.1025,
    region: "București",
  },
  {
    name: "Bucharest",
    latitude: 44.4268,
    longitude: 26.1025,
    region: "București",
  },
  {
    name: "Cluj-Napoca",
    latitude: 46.7712,
    longitude: 23.6236,
    region: "Cluj",
  },
  { name: "Cluj", latitude: 46.7712, longitude: 23.6236, region: "Cluj" },
  { name: "Timișoara", latitude: 45.7489, longitude: 21.2087, region: "Timiș" },
  { name: "Timisoara", latitude: 45.7489, longitude: 21.2087, region: "Timiș" },
  { name: "Iași", latitude: 47.1585, longitude: 27.6014, region: "Iași" },
  { name: "Iasi", latitude: 47.1585, longitude: 27.6014, region: "Iași" },
  {
    name: "Constanța",
    latitude: 44.1598,
    longitude: 28.6348,
    region: "Constanța",
  },
  {
    name: "Constanta",
    latitude: 44.1598,
    longitude: 28.6348,
    region: "Constanța",
  },
  { name: "Craiova", latitude: 44.3302, longitude: 23.7949, region: "Dolj" },
  { name: "Brașov", latitude: 45.6427, longitude: 25.5887, region: "Brașov" },
  { name: "Brasov", latitude: 45.6427, longitude: 25.5887, region: "Brașov" },
  { name: "Galați", latitude: 45.4353, longitude: 28.008, region: "Galați" },
  { name: "Galati", latitude: 45.4353, longitude: 28.008, region: "Galați" },
  {
    name: "Ploiești",
    latitude: 44.9322,
    longitude: 26.0183,
    region: "Prahova",
  },
  {
    name: "Ploiesti",
    latitude: 44.9322,
    longitude: 26.0183,
    region: "Prahova",
  },
  { name: "Brăila", latitude: 45.2692, longitude: 27.9574, region: "Brăila" },
  { name: "Braila", latitude: 45.2692, longitude: 27.9574, region: "Brăila" },
  { name: "Oradea", latitude: 47.0465, longitude: 21.9189, region: "Bihor" },
  { name: "Bacău", latitude: 46.567, longitude: 26.9146, region: "Bacău" },
  { name: "Bacau", latitude: 46.567, longitude: 26.9146, region: "Bacău" },
  { name: "Pitești", latitude: 44.8565, longitude: 24.8692, region: "Argeș" },
  { name: "Pitesti", latitude: 44.8565, longitude: 24.8692, region: "Argeș" },
  { name: "Sibiu", latitude: 45.7983, longitude: 24.1256, region: "Sibiu" },
  { name: "Arad", latitude: 46.1866, longitude: 21.3123, region: "Arad" },
  {
    name: "Târgu Mureș",
    latitude: 46.5427,
    longitude: 24.5574,
    region: "Mureș",
  },
  {
    name: "Targu Mures",
    latitude: 46.5427,
    longitude: 24.5574,
    region: "Mureș",
  },
  {
    name: "Baia Mare",
    latitude: 47.6593,
    longitude: 23.5683,
    region: "Maramureș",
  },
  { name: "Buzău", latitude: 45.15, longitude: 26.8207, region: "Buzău" },
  { name: "Buzau", latitude: 45.15, longitude: 26.8207, region: "Buzău" },
  {
    name: "Satu Mare",
    latitude: 47.7925,
    longitude: 22.8875,
    region: "Satu Mare",
  },
  {
    name: "Botoșani",
    latitude: 47.7322,
    longitude: 26.6656,
    region: "Botoșani",
  },
  {
    name: "Botosani",
    latitude: 47.7322,
    longitude: 26.6656,
    region: "Botoșani",
  },
  {
    name: "Piatra Neamț",
    latitude: 46.9281,
    longitude: 26.3811,
    region: "Neamț",
  },
  {
    name: "Piatra Neamt",
    latitude: 46.9281,
    longitude: 26.3811,
    region: "Neamț",
  },
  {
    name: "Râmnicu Vâlcea",
    latitude: 45.1167,
    longitude: 24.3667,
    region: "Vâlcea",
  },
  {
    name: "Ramnicu Valcea",
    latitude: 45.1167,
    longitude: 24.3667,
    region: "Vâlcea",
  },
  { name: "Suceava", latitude: 47.6514, longitude: 26.254, region: "Suceava" },
  { name: "Tulcea", latitude: 45.1644, longitude: 28.8059, region: "Tulcea" },
  {
    name: "Târgoviște",
    latitude: 44.9336,
    longitude: 25.456,
    region: "Dâmbovița",
  },
  {
    name: "Targoviste",
    latitude: 44.9336,
    longitude: 25.456,
    region: "Dâmbovița",
  },
  { name: "Focșani", latitude: 45.6953, longitude: 27.1836, region: "Vrancea" },
  { name: "Focsani", latitude: 45.6953, longitude: 27.1836, region: "Vrancea" },
  {
    name: "Bistrița",
    latitude: 47.1333,
    longitude: 24.5,
    region: "Bistrița-Năsăud",
  },
  {
    name: "Bistrita",
    latitude: 47.1333,
    longitude: 24.5,
    region: "Bistrița-Năsăud",
  },
];

export default function MapScreen() {
  const { t } = useLanguage();
  const { user } = useFirebase();
  const { cartItemCount, refreshCartCount } = useCart();
  const { errorState, showInfo, hideToast } = useErrorHandler();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Valoarea animației pentru glisarea bottom sheet-ului
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const { height: screenHeight } = Dimensions.get("window");

  // Referințe pentru funcționalitatea de căutare
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<MapView | null>(null);

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

  // Funcția pentru a cere permisiuni și a obține locația
  const getLocationAsync = async () => {
    setLocationError(null); // Resetez eroarea de locație
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationError(t("map.locationPermissionDenied")); // Tradus
      console.warn("Location permission denied.");
      return null; // Indic eșecul permisiunii
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

  const loadMapData = useCallback(async () => {
    setLoading(true);
    await getLocationAsync();
    await fetchCafes();
    setLoading(false);
  }, []);

  // Adaug useFocusEffect pentru a refresh-a datele hărții când ecranul intră în focus
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadMapData();
      }
    }, [user?.uid, loadMapData])
  );

  useEffect(() => {
    if (user?.uid) {
      loadMapData();
    }
  }, [user?.uid, loadMapData]);

  // Debounce pentru query-ul de căutare
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Gestionez vizibilitatea sugestiilor de căutare
  useEffect(() => {
    setShowSearchSuggestions(searchQuery.length > 0);
  }, [searchQuery]);

  // Contorul coșului este acum gestionat de CartContext

  // Încarc produsele când o cafenea este selectată
  const loadCafeProducts = async (cafeId: string) => {
    try {
      setLoadingProducts(true);
      console.log(`Loading products for cafe: ${cafeId}`);
      const cafeProducts = await coffeePartnerService.getProductsForCafe(
        cafeId
      );
      console.log(
        `Loaded ${cafeProducts.length} products for cafe ${cafeId}:`,
        cafeProducts
      );
      setProducts(cafeProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handler pentru refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLocationError(null);
    setFetchError(null);
    await getLocationAsync();
    await fetchCafes();
    setRefreshing(false);
  }, []);

  // Gestionez apăsarea marker-ului
  const handleMarkerPress = async (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setBottomSheetVisible(true);
    setBottomSheetExpanded(false);
    setProducts([]);

    // Încarc produsele pentru această cafenea
    await loadCafeProducts(cafe.id);

    // Animez bottom sheet-ul să alunece în sus
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Comutez expansiunea bottom sheet-ului
  const toggleBottomSheet = () => {
    const newExpanded = !bottomSheetExpanded;
    setBottomSheetExpanded(newExpanded);

    Animated.timing(slideAnim, {
      toValue: newExpanded ? -screenHeight * 0.6 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Adaug produsul în coș cu actualizare optimistă a UI-ului
  const handleAddToCart = async (product: Product) => {
    if (!user?.uid || !selectedCafe) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please login to add items to cart",
      });
      return;
    }

    // Previn adăugirile rapide multiple ale aceluiași produs
    if (addingToCart === product.id) return;

    setAddingToCart(product.id);

    try {
      const result = await cartService.addToCart(
        user.uid,
        product,
        selectedCafe.id,
        selectedCafe.businessName,
        1
      );

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Added!",
          text2: `${product.name}`,
        });
        // Refresh-ez contorul coșului pentru a afișa numărul corect
        refreshCartCount();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add item",
      });
    } finally {
      setAddingToCart(null);
    }
  };

  // Navighez la ecranul de detalii al cafenelei
  const navigateToCafeDetails = () => {
    if (selectedCafe) {
      router.push({
        pathname: "/(mainUsers)/cafeDetails",
        params: { cafeId: selectedCafe.id },
      });
    }
  };

  // Închid bottom sheet-ul
  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setBottomSheetVisible(false);
    });
  };

  // Caut orașe românești care se potrivesc cu query-ul
  const searchCitySuggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];

    return ROMANIAN_CITIES.filter((city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // Limitez la 5 sugestii
  }, [searchQuery]);

  // Filtrez cafenelele în funcție de query-ul de căutare
  const filteredCafes = useMemo(() => {
    if (debouncedSearchQuery.length === 0) return cafes;

    return cafes.filter(
      (cafe) =>
        cafe.businessName
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        cafe.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [cafes, debouncedSearchQuery]);

  // Gestionez selecția orașelor
  const handleCitySelect = useCallback((city: RomanianCity) => {
    const newRegion: Region = {
      latitude: city.latitude,
      longitude: city.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    setMapRegion(newRegion);
    setSearchQuery(city.name);
    setShowSearchSuggestions(false);

    // Animez harta către noua regiune
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }

    // Afișez toast cu informații
    Toast.show({
      type: "info",
      text1: `Navigated to ${city.name}`,
      text2: `Showing ${city.region} region`,
      visibilityTime: 2000,
    });
  }, []);

  // Gestionez schimbarea input-ului de căutare
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Șterg căutarea
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setShowSearchSuggestions(false);
  }, []);

  // Imaginea implicită pentru cafenele
  const defaultCafeImage =
    "https://via.placeholder.com/400x200?text=No+Image+Available";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        onRegionChangeComplete={setMapRegion}
        onPress={() => setShowSearchSuggestions(false)}
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
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#8B4513"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cafes or cities in Romania..."
            placeholderTextColor="#A08C7D"
            value={searchQuery}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={clearSearch}
            >
              <Ionicons name="close-circle" size={20} color="#8B4513" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() =>
            showInfo(
              "Search for cities like 'București', 'Cluj', 'Timișoara' or cafe names"
            )
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#8B4513"
          />
        </TouchableOpacity>
      </View>

      {/* Search Suggestions Dropdown */}
      {showSearchSuggestions && searchCitySuggestions.length > 0 && (
        <View style={styles.searchSuggestions}>
          <Text style={styles.suggestionsHeader}>Cities in Romania</Text>
          {searchCitySuggestions.map((city, index) => (
            <TouchableOpacity
              key={`${city.name}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleCitySelect(city)}
            >
              <Ionicons name="location" size={16} color="#8B4513" />
              <View style={styles.suggestionText}>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.regionName}>{city.region} Region</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom Sheet for Selected Cafe */}
      {bottomSheetVisible && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
              height: bottomSheetExpanded ? screenHeight * 0.7 : "auto",
            },
          ]}
        >
          <TouchableOpacity onPress={toggleBottomSheet} activeOpacity={0.8}>
            <View style={styles.bottomSheetHandle} />
          </TouchableOpacity>

          {selectedCafe && (
            <>
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
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#8B4513"
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Quick Actions */}
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => {
                    router.push({
                      pathname: "/(mainUsers)/fullMenu",
                      params: {
                        cafeId: selectedCafe.id,
                        cafeName: selectedCafe.businessName,
                      },
                    });
                  }}
                >
                  <Ionicons name="cafe" size={20} color="#8B4513" />
                  <Text style={styles.quickActionText}>Menu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push("/(mainUsers)/cart")}
                >
                  <View style={styles.cartIconContainer}>
                    <Ionicons name="cart" size={20} color="#8B4513" />
                    {cartItemCount > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>
                          {cartItemCount > 99 ? "99+" : cartItemCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.quickActionText}>Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={navigateToCafeDetails}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#8B4513"
                  />
                  <Text style={styles.quickActionText}>Info</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Product Selection - Always visible */}
              {!bottomSheetExpanded && (
                <View style={styles.quickProductsContainer}>
                  <Text style={styles.quickProductsTitle}>Quick Order</Text>
                  {loadingProducts ? (
                    <ActivityIndicator size="small" color="#8B4513" />
                  ) : products.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.quickProductsList}
                    >
                      {products.slice(0, 5).map((product) => (
                        <TouchableOpacity
                          key={product.id}
                          style={[
                            styles.quickProductItem,
                            addingToCart === product.id &&
                              styles.quickProductItemDisabled,
                          ]}
                          onPress={() => handleAddToCart(product)}
                          disabled={addingToCart === product.id}
                        >
                          <Image
                            source={{ uri: product.imageUrl }}
                            style={styles.quickProductImage}
                            resizeMode="cover"
                          />
                          <Text
                            style={styles.quickProductName}
                            numberOfLines={1}
                          >
                            {product.name}
                          </Text>
                          <View style={styles.quickProductPriceContainer}>
                            <Ionicons
                              name="ellipse"
                              size={12}
                              color="#8B4513"
                            />
                            <Text style={styles.quickProductPrice}>
                              {product.beansValue}
                            </Text>
                          </View>
                          <Ionicons
                            name="add-circle"
                            size={24}
                            color="#8B4513"
                            style={styles.quickAddIcon}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noQuickProductsText}>
                      No products available
                    </Text>
                  )}
                </View>
              )}

              {/* Products List */}
              {bottomSheetExpanded && (
                <View style={styles.productsContainer}>
                  <View style={styles.menuHeader}>
                    <Text style={styles.productsTitle}>Menu</Text>
                    <TouchableOpacity
                      style={styles.refreshMenuButton}
                      onPress={() =>
                        selectedCafe && loadCafeProducts(selectedCafe.id)
                      }
                    >
                      <Ionicons name="refresh" size={20} color="#8B4513" />
                    </TouchableOpacity>
                  </View>
                  {loadingProducts ? (
                    <ActivityIndicator size="small" color="#8B4513" />
                  ) : products.length > 0 ? (
                    <FlashList
                      data={products}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item, index }) => (
                        <Animatable.View
                          animation="fadeInUp"
                          delay={index * 150}
                          style={styles.productItem}
                        >
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                          <View style={styles.productInfo}>
                            <Text style={styles.productName}>{item.name}</Text>
                            <View style={styles.productPriceContainer}>
                              <View style={styles.beansContainer}>
                                <Ionicons
                                  name="ellipse"
                                  size={16}
                                  color="#8B4513"
                                />
                                <Text style={styles.productPrice}>
                                  {item.beansValue} beans
                                </Text>
                              </View>
                              <Text style={styles.productPriceLei}>
                                {item.priceLei} RON
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.addToCartButton}
                            onPress={() => handleAddToCart(item)}
                          >
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                          </TouchableOpacity>
                        </Animatable.View>
                      )}
                      contentContainerStyle={styles.productsList}
                      showsVerticalScrollIndicator={false}
                      estimatedItemSize={80}
                    />
                  ) : (
                    <Text style={styles.noProductsText}>
                      No products available
                    </Text>
                  )}
                </View>
              )}
            </>
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
      {!loading &&
        filteredCafes.length === 0 &&
        cafes.length > 0 &&
        debouncedSearchQuery.length > 0 && (
          <View style={styles.noResultsOverlay}>
            <Text style={styles.noResultsText}>
              No cafes found for "{debouncedSearchQuery}"
            </Text>
            <Text style={styles.noResultsSubtext}>
              Try searching for a Romanian city or a different cafe name
            </Text>
          </View>
        )}
      {!loading && cafes.length === 0 && !fetchError && (
        <View style={styles.noResultsOverlay}>
          <Text style={styles.noResultsText}>No cafes found in this area</Text>
          <Text style={styles.noResultsSubtext}>
            Try searching for a major Romanian city
          </Text>
        </View>
      )}

      {/* Bottom Navigation Bar */}
      <BottomTabBar />

      {/* Error Components */}
      <ErrorToast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
      />
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
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E0D6C7",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E", // Dark brown text
    paddingVertical: 4,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    padding: 5,
  },
  // Search suggestions styles
  searchSuggestions: {
    position: "absolute",
    top: Platform.OS === "android" ? 95 : 115,
    left: 15,
    right: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E0D6C7",
    zIndex: 10,
    maxHeight: 250,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B4513",
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E6D3",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E6D3",
  },
  suggestionText: {
    marginLeft: 12,
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 2,
  },
  regionName: {
    fontSize: 12,
    color: "#8B4513",
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
  noResultsSubtext: {
    color: "#A08C7D",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  // Bottom sheet styles
  bottomSheet: {
    position: "absolute",
    bottom: 75,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
    zIndex: 6,
    borderWidth: 1,
    borderColor: "#F5E6D3",
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
  // Quick actions styles
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0D6C7",
    marginTop: 10,
  },
  quickActionButton: {
    alignItems: "center",
    padding: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: "#8B4513",
    marginTop: 5,
    fontWeight: "500",
  },
  cartIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  // Products styles
  productsContainer: {
    flex: 1,
    paddingTop: 15,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  refreshMenuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF8F3",
    borderWidth: 1,
    borderColor: "#E0D6C7",
  },
  productsList: {
    paddingBottom: 30,
    paddingHorizontal: 5,
  },
  productItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    width: 75,
    height: 75,
    borderRadius: 12,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#F5E6D3",
  },
  productInfo: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#321E0E",
    marginBottom: 6,
    lineHeight: 22,
  },
  productPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  beansContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D6C7",
  },
  productPrice: {
    fontSize: 14,
    color: "#8B4513",
    marginLeft: 6,
    fontWeight: "600",
  },
  productPriceLei: {
    fontSize: 13,
    color: "#6A4028",
    fontWeight: "500",
  },
  addToCartButton: {
    backgroundColor: "#8B4513",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  noProductsText: {
    textAlign: "center",
    color: "#8B4513",
    fontSize: 16,
    marginTop: 30,
    fontStyle: "italic",
  },
  // Quick products styles
  quickProductsContainer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#F5E6D3",
  },
  quickProductsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  quickProductsList: {
    paddingHorizontal: 10,
  },
  quickProductItem: {
    backgroundColor: "#FFF8F3",
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    width: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D6C7",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickProductItemDisabled: {
    opacity: 0.6,
  },
  quickProductImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 6,
  },
  quickProductName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#321E0E",
    textAlign: "center",
    marginBottom: 4,
  },
  quickProductPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  quickProductPrice: {
    fontSize: 11,
    color: "#8B4513",
    marginLeft: 2,
    fontWeight: "600",
  },
  quickAddIcon: {
    marginTop: 2,
  },
  noQuickProductsText: {
    textAlign: "center",
    color: "#8B4513",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },
});
