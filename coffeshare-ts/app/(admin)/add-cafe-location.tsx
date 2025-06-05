import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { collection, addDoc, GeoPoint } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import adminService from "../../services/adminService";

const DEFAULT_REGION: Region = {
  latitude: 45.7579, // Timisoara Latitude
  longitude: 21.2287, // Timisoara Longitude
  latitudeDelta: 0.04,
  longitudeDelta: 0.02,
};

export default function AddCafeLocationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(true);
  const [formData, setFormData] = useState({
    businessName: "",
    address: "",
    phoneNumber: "",
    website: "",
    description: "",
    openingHours: "",
    ownerEmail: "", // Email of the coffee partner
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coffeePartners, setCoffeePartners] = useState<
    Array<{ email: string; name: string; uid: string }>
  >([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Get user's current location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const userLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.01,
          };
          setMapRegion(userLocation);
        }
      } catch (error) {
        console.log("Error getting location:", error);
      } finally {
        setLocatingUser(false);
      }
    };

    getUserLocation();
  }, []);

  // Load coffee partners for dropdown
  useEffect(() => {
    const loadCoffeePartners = async () => {
      try {
        const partners = await adminService.getCoffeePartners();
        setCoffeePartners(partners);
      } catch (error) {
        console.error("Error loading coffee partners:", error);
        Alert.alert("Error", "Failed to load coffee partners");
      } finally {
        setLoadingPartners(false);
      }
    };

    loadCoffeePartners();
  }, []);

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = "Coffee partner selection is required";
    }

    if (!selectedLocation) {
      newErrors.location = "Please select a location on the map";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCafe = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Find the selected partner to get their email
      const selectedPartner = coffeePartners.find(
        (p) => p.email === formData.ownerEmail
      );

      // Create a new cafe document in Firestore
      const cafeData = {
        businessName: formData.businessName,
        address: formData.address,
        phoneNumber: formData.phoneNumber || null,
        website: formData.website || null,
        description: formData.description || null,
        openingHours: formData.openingHours || null,
        ownerEmail: formData.ownerEmail, // Connect cafe to coffee partner
        location: {
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
        },
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add contact info fields for compatibility with settings
        email: selectedPartner?.email || formData.ownerEmail,
        phone: formData.phoneNumber || null,
        // Initialize subscription acceptance fields (defaults to false)
        acceptsStudentSubscription: false,
        acceptsEliteSubscription: false,
        acceptsPremiumSubscription: false,
        acceptsBasicSubscription: false,
      };

      await addDoc(collection(db, "cafes"), cafeData);

      Alert.alert("Success", "Cafe has been added successfully", [
        {
          text: "OK",
          onPress: () => {
            // Reset the form
            setFormData({
              businessName: "",
              address: "",
              phoneNumber: "",
              website: "",
              description: "",
              openingHours: "",
              ownerEmail: "",
            });
            setSelectedLocation(null);
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding cafe:", error);
      Alert.alert("Error", "Failed to add cafe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title="Add Cafe Location" showBackButton={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Select Location</Text>
          <Text style={styles.instructions}>
            Tap on the map to select the cafe's location
          </Text>

          <View style={styles.mapContainer}>
            {locatingUser ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color="#8B4513" />
                <Text style={styles.loadingText}>Getting your location...</Text>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                provider={Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={mapRegion}
                onRegionChangeComplete={setMapRegion}
                onPress={handleMapPress}
                showsUserLocation
              >
                {selectedLocation && (
                  <Marker
                    coordinate={selectedLocation}
                    pinColor="#8B4513"
                    draggable
                    onDragEnd={(e) =>
                      setSelectedLocation(e.nativeEvent.coordinate)
                    }
                  />
                )}
              </MapView>
            )}
          </View>

          {errors.location ? (
            <Text style={styles.errorText}>{errors.location}</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Cafe Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={[
                styles.input,
                errors.businessName ? styles.inputError : null,
              ]}
              value={formData.businessName}
              onChangeText={(text) =>
                setFormData({ ...formData, businessName: text })
              }
              placeholder="Enter business name"
              placeholderTextColor="#999"
            />
            {errors.businessName ? (
              <Text style={styles.errorText}>{errors.businessName}</Text>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, errors.address ? styles.inputError : null]}
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              placeholder="Enter address"
              placeholderTextColor="#999"
            />
            {errors.address ? (
              <Text style={styles.errorText}>{errors.address}</Text>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Coffee Partner *</Text>
            {loadingPartners ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8B4513" />
                <Text style={styles.loadingText}>Loading partners...</Text>
              </View>
            ) : (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    errors.ownerEmail ? styles.inputError : null,
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Select Coffee Partner",
                      "Choose who will manage this cafe:",
                      [
                        ...coffeePartners.map((partner) => ({
                          text: `${partner.name} (${partner.email})`,
                          onPress: () =>
                            setFormData({
                              ...formData,
                              ownerEmail: partner.email,
                            }),
                        })),
                        { text: "Cancel", style: "cancel" },
                      ]
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      !formData.ownerEmail && styles.placeholderText,
                    ]}
                  >
                    {formData.ownerEmail
                      ? coffeePartners.find(
                          (p) => p.email === formData.ownerEmail
                        )?.name || formData.ownerEmail
                      : "Select a coffee partner"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {errors.ownerEmail ? (
              <Text style={styles.errorText}>{errors.ownerEmail}</Text>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) =>
                setFormData({ ...formData, website: text })
              }
              placeholder="Enter website URL"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Opening Hours</Text>
            <TextInput
              style={styles.input}
              value={formData.openingHours}
              onChangeText={(text) =>
                setFormData({ ...formData, openingHours: text })
              }
              placeholder="e.g. Mon-Fri: 7am-8pm, Sat-Sun: 8am-6pm"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Enter cafe description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              !selectedLocation && styles.disabledButton,
            ]}
            onPress={handleAddCafe}
            disabled={loading || !selectedLocation}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add Cafe</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  mapContainer: {
    height: 250,
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  inputError: {
    borderColor: "#FF6B6B",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: "#D3D3D3",
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
});
