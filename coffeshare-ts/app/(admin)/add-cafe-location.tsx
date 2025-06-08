import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc, GeoPoint } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../config/firebase";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import adminService from "../../services/adminService";
import { Toast, ErrorModal, Snackbar } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

const DEFAULT_REGION: Region = {
  latitude: 45.7579, // Timisoara Latitude
  longitude: 21.2287, // Timisoara Longitude
  latitudeDelta: 0.04,
  longitudeDelta: 0.02,
};

export default function AddCafeLocationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const {
    errorState,
    showError,
    showSuccess,
    showConfirmModal,
    showErrorModal,
    hideToast,
    hideModal,
    showWarning,
  } = useErrorHandler();
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedBannerImage, setSelectedBannerImage] = useState<string | null>(
    null
  );
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showBannerImagePicker, setShowBannerImagePicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showHoursDropdown, setShowHoursDropdown] = useState(false);
  const [showPartnersDropdown, setShowPartnersDropdown] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Predefined opening hours options
  const openingHoursOptions = [
    "Mon-Fri: 7:00-20:00, Sat-Sun: 8:00-18:00",
    "Mon-Sun: 6:00-22:00",
    "Mon-Fri: 8:00-18:00, Sat-Sun: 9:00-17:00",
    "Mon-Fri: 7:00-18:00, Sat-Sun: 8:00-16:00",
    "Mon-Sun: 24/7",
    "Mon-Fri: 6:30-19:00, Sat-Sun: 7:00-18:00",
    "Custom (enter manually)",
  ];

  // Product categories available
  const productCategories = ["Coffee", "Tea", "Pastries", "Snacks"];

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
        showError("Failed to load coffee partners");
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

  // Image picker functions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showErrorModal(
        "Permission needed",
        "Please grant camera roll permissions to upload images."
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setShowImagePicker(false);
    }
  };

  const pickBannerFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedBannerImage(result.assets[0].uri);
      setShowBannerImagePicker(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showErrorModal(
        "Permission needed",
        "Please grant camera permissions to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setShowImagePicker(false);
    }
  };

  const takeBannerPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showErrorModal(
        "Permission needed",
        "Please grant camera permissions to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedBannerImage(result.assets[0].uri);
      setShowBannerImagePicker(false);
    }
  };

  const uploadImageToStorage = async (imageUri: string) => {
    try {
      const storage = getStorage();
      const filename = `cafes/${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.jpg`;
      const storageRef = ref(storage, filename);

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Category handlers
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Opening hours handler
  const handleOpeningHoursSelect = (hours: string) => {
    if (hours === "Custom (enter manually)") {
      setFormData({ ...formData, openingHours: "" });
    } else {
      setFormData({ ...formData, openingHours: hours });
    }
    setShowHoursDropdown(false);
  };

  // Coffee partner selection handler
  const handlePartnerSelect = (partnerEmail: string) => {
    setFormData({ ...formData, ownerEmail: partnerEmail });
    setShowPartnersDropdown(false);
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
      // Upload profile image if selected
      let imageUrl = null;
      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImageToStorage(selectedImage);
        } catch (error) {
          console.error("Error uploading profile image:", error);
          showWarning(
            "Failed to upload profile image, but cafe will be created without photo."
          );
        } finally {
          setUploadingImage(false);
        }
      }

      // Upload banner image if selected
      let bannerImageUrl = null;
      if (selectedBannerImage) {
        setUploadingBannerImage(true);
        try {
          bannerImageUrl = await uploadImageToStorage(selectedBannerImage);
        } catch (error) {
          console.error("Error uploading banner image:", error);
          showWarning(
            "Failed to upload banner image, but cafe will be created without banner."
          );
        } finally {
          setUploadingBannerImage(false);
        }
      }

      // Find the selected partner to get their email
      const selectedPartner = coffeePartners.find(
        (p) => p.email === formData.ownerEmail
      );

      // Create opening hours object
      const openingHoursData = formData.openingHours
        ? {
            monday: { open: "08:00", close: "20:00" },
            tuesday: { open: "08:00", close: "20:00" },
            wednesday: { open: "08:00", close: "20:00" },
            thursday: { open: "08:00", close: "20:00" },
            friday: { open: "08:00", close: "20:00" },
            saturday: { open: "09:00", close: "20:00" },
            sunday: { open: "09:00", close: "18:00" },
          }
        : null;

      // Create a new cafe document in Firestore
      const cafeData = {
        businessName: formData.businessName,
        address: formData.address,
        phoneNumber: formData.phoneNumber || null,
        website: formData.website || null,
        description: formData.description || null,
        openingHours: openingHoursData,
        ownerEmail: formData.ownerEmail, // Connect cafe to coffee partner
        location: {
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
        },
        imageUrl: imageUrl, // Profile image URL
        bannerImageUrl: bannerImageUrl, // Banner image URL
        mainImageUrl: bannerImageUrl || imageUrl, // For backward compatibility
        galleryImages: [], // Initialize empty gallery
        menuCategories: selectedCategories, // Add selected product categories
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

      showSuccess("Cafe has been added successfully");
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
      setSelectedImage(null);
      setSelectedBannerImage(null);
      setSelectedCategories([]);
    } catch (error) {
      console.error("Error adding cafe:", error);
      showError("Failed to add cafe. Please try again.");
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
                  onPress={() => setShowPartnersDropdown(true)}
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

          {/* Banner Photo Upload Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Banner Photo (16:9)</Text>
            <Text style={styles.subLabel}>
              This will be displayed as the main banner in cafe details
            </Text>
            <TouchableOpacity
              style={styles.photoUploadContainer}
              onPress={() => setShowBannerImagePicker(true)}
            >
              {selectedBannerImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: selectedBannerImage }}
                    style={styles.selectedImage}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={24} color="#FFFFFF" />
                    <Text style={styles.imageOverlayText}>Tap to change</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                  <Text style={styles.photoPlaceholderText}>
                    Add banner photo
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B4513" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Photo Upload Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Profile Photo (1:1)</Text>
            <Text style={styles.subLabel}>
              This will be used as the cafe's profile picture
            </Text>
            <TouchableOpacity
              style={styles.photoUploadContainer}
              onPress={() => setShowImagePicker(true)}
            >
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={24} color="#FFFFFF" />
                    <Text style={styles.imageOverlayText}>Tap to change</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#999" />
                  <Text style={styles.photoPlaceholderText}>
                    Add profile photo
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B4513" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Menu Categories Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Menu Categories</Text>
            <Text style={styles.subLabel}>
              Select what products this cafe can serve:
            </Text>
            <View style={styles.categoriesContainer}>
              {productCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(category) &&
                      styles.categoryChipSelected,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Ionicons
                    name={
                      selectedCategories.includes(category)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={20}
                    color={
                      selectedCategories.includes(category)
                        ? "#FFFFFF"
                        : "#8B4513"
                    }
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategories.includes(category) &&
                        styles.categoryChipTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Opening Hours</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowHoursDropdown(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !formData.openingHours && styles.placeholderText,
                ]}
              >
                {formData.openingHours || "Select opening hours"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {formData.openingHours === "" && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={formData.openingHours}
                onChangeText={(text) =>
                  setFormData({ ...formData, openingHours: text })
                }
                placeholder="Enter custom opening hours"
                placeholderTextColor="#999"
              />
            )}
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
            disabled={
              loading ||
              !selectedLocation ||
              uploadingImage ||
              uploadingBannerImage
            }
          >
            {loading || uploadingImage || uploadingBannerImage ? (
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

      {/* Profile Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Add Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color="#8B4513" />
              <Text style={styles.bottomSheetOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={pickImageFromGallery}
            >
              <Ionicons name="images" size={24} color="#8B4513" />
              <Text style={styles.bottomSheetOptionText}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomSheetOption, styles.cancelOption]}
              onPress={() => setShowImagePicker(false)}
            >
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              <Text style={[styles.bottomSheetOptionText, styles.cancelText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Banner Image Picker Modal */}
      <Modal
        visible={showBannerImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBannerImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Add Banner Photo</Text>
              <TouchableOpacity onPress={() => setShowBannerImagePicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={takeBannerPhoto}
            >
              <Ionicons name="camera" size={24} color="#8B4513" />
              <Text style={styles.bottomSheetOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={pickBannerFromGallery}
            >
              <Ionicons name="images" size={24} color="#8B4513" />
              <Text style={styles.bottomSheetOptionText}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomSheetOption, styles.cancelOption]}
              onPress={() => setShowBannerImagePicker(false)}
            >
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              <Text style={[styles.bottomSheetOptionText, styles.cancelText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Coffee Partners Dropdown Modal */}
      <Modal
        visible={showPartnersDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPartnersDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Coffee Partner</Text>
              <TouchableOpacity onPress={() => setShowPartnersDropdown(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dropdownList}>
              {coffeePartners.map((partner, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownOption,
                    formData.ownerEmail === partner.email &&
                      styles.selectedOption,
                  ]}
                  onPress={() => handlePartnerSelect(partner.email)}
                >
                  <View style={styles.partnerOptionContent}>
                    <Text style={styles.partnerName}>{partner.name}</Text>
                    <Text style={styles.partnerEmail}>{partner.email}</Text>
                  </View>
                  {formData.ownerEmail === partner.email && (
                    <Ionicons name="checkmark" size={20} color="#8B4513" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Opening Hours Dropdown Modal */}
      <Modal
        visible={showHoursDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHoursDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Opening Hours</Text>
              <TouchableOpacity onPress={() => setShowHoursDropdown(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dropdownList}>
              {openingHoursOptions.map((hours, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOption}
                  onPress={() => handleOpeningHoursSelect(hours)}
                >
                  <Text style={styles.dropdownOptionText}>{hours}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Error Components */}
      <Toast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
        action={errorState.toast.action}
      />

      <ErrorModal
        visible={errorState.modal.visible}
        title={errorState.modal.title}
        message={errorState.modal.message}
        type={errorState.modal.type}
        onDismiss={hideModal}
        primaryAction={errorState.modal.primaryAction}
        secondaryAction={errorState.modal.secondaryAction}
      />
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

  // Photo Upload Styles
  photoUploadContainer: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  selectedImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  imageOverlayText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
  },
  photoPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 4,
  },

  // Category Selection Styles
  subLabel: {
    fontSize: 14,
    color: "#666",
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  bottomSheetOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  bottomSheetOptionText: {
    fontSize: 16,
    color: "#333",
  },
  cancelOption: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cancelText: {
    color: "#FF6B6B",
  },

  // Dropdown Modal Styles
  dropdownModal: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: "80%",
    marginVertical: "10%",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#333",
  },

  // Coffee Partner Selection Styles
  selectedOption: {
    backgroundColor: "#F5F5F5",
    borderLeftWidth: 3,
    borderLeftColor: "#8B4513",
  },
  partnerOptionContent: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  partnerEmail: {
    fontSize: 14,
    color: "#666",
  },
});
