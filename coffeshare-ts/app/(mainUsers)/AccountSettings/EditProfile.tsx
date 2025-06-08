import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Timestamp } from "firebase/firestore";
import { useLanguage } from "../../../context/LanguageContext";
import { useFirebase } from "../../../context/FirebaseContext";
import { useErrorHandler } from "../../../hooks/useErrorHandler";
import { Toast } from "../../../components/ErrorComponents";

export default function EditProfileScreen() {
  const { t } = useLanguage();
  const { user, userProfile } = useFirebase();
  const { errorState, showError, hideToast } = useErrorHandler();

  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || ""
  );
  const [email, setEmail] = useState(userProfile?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(
    userProfile?.phoneNumber || ""
  );
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      showError("Display name is required");
      return;
    }

    try {
      setSaving(true);

      const profileData = {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        updatedAt: new Date(),
      };

      // TODO: Implement profile update in Firebase context
      console.log("Updating profile:", profileData);

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeProfilePhoto = async () => {
    try {
      // Request permission to access camera roll
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Denied",
          "Please allow access to your photo library to change your profile picture."
        );
        return;
      }

      // Show options for camera or gallery
      Alert.alert(
        "Change Profile Photo",
        "Choose how you want to change your profile photo",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Camera", onPress: () => openCamera() },
          { text: "Photo Library", onPress: () => openImagePicker() },
        ]
      );
    } catch (error) {
      console.error("Error accessing image picker:", error);
      showError("Failed to access photo picker");
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Denied",
          "Please allow access to your camera to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      showError("Failed to open camera");
    }
  };

  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening image picker:", error);
      showError("Failed to open photo library");
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);

      // TODO: Implement photo upload to Firebase Storage
      console.log("Uploading photo:", uri);

      Alert.alert(
        "Photo Updated",
        "Your profile photo has been updated successfully."
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      showError("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("editProfile"),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
          headerRight: () => (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#8B4513" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={handleChangeProfilePhoto}
            disabled={uploadingPhoto}
          >
            {userProfile?.photoURL ? (
              <Image
                source={{ uri: userProfile.photoURL }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Text style={styles.placeholderText}>
                  {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
            <View style={styles.photoOverlay}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>
              Email cannot be changed from this screen
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {bio.length}/200 characters
            </Text>
          </View>
        </View>

        {/* Account Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {userProfile?.createdAt
                ? new Date(
                    (userProfile.createdAt as Timestamp).seconds * 1000
                  ).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{user?.uid || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>Standard User</Text>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              Alert.alert(
                "Change Password",
                "You will receive an email with instructions to reset your password.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Send Email",
                    onPress: () => console.log("Password reset requested"),
                  },
                ]
              );
            }}
          >
            <Ionicons name="key-outline" size={24} color="#8B4513" />
            <Text style={styles.actionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "This action cannot be undone. All your data will be permanently deleted.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => console.log("Account deletion requested"),
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#E74C3C" />
            <Text style={[styles.actionText, styles.dangerText]}>
              Delete Account
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Messages */}
      <Toast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerStyle: {
    backgroundColor: "#FFFFFF",
  },
  headerTitleStyle: {
    color: "#321E0E",
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: "#8B4513",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  photoSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  photoContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#8B4513",
  },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#8B4513",
  },
  placeholderText: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(139, 69, 19, 0.9)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  photoHint: {
    fontSize: 14,
    color: "#8B4513",
    marginTop: 5,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#321E0E",
    backgroundColor: "#FFFFFF",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#999",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: "#8B4513",
    marginTop: 5,
    fontStyle: "italic",
  },
  characterCount: {
    fontSize: 12,
    color: "#8B4513",
    textAlign: "right",
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#321E0E",
    fontWeight: "500",
  },
  actionsSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E",
    marginLeft: 15,
  },
  dangerText: {
    color: "#E74C3C",
  },
});
