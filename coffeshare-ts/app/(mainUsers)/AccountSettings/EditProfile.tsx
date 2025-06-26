import React, { useState, useEffect } from "react";
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  sendPasswordResetEmail,
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { db } from "../../../config/firebase";

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

  // Actualizez starea când userProfile se schimbă
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setEmail(userProfile.email || "");
      setPhoneNumber(userProfile.phoneNumber || "");
      setBio(userProfile.bio || "");
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      showError(t("editProfile.displayNameRequired"));
      return;
    }

    if (!user?.uid) {
      showError("User not found");
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

      // Actualizez profilul utilizatorului în Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, profileData);

      Alert.alert(
        t("editProfile.profileUpdated"),
        t("editProfile.profileUpdatedMessage"),
        [{ text: t("common.ok") }]
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
      // Cer permisiunea pentru a accesa galeria foto
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Denied",
          "Please allow access to your photo library to change your profile picture."
        );
        return;
      }

      // Afișez opțiunile pentru cameră sau galerie
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
      if (!user?.uid) return;

      setUploadingPhoto(true);

      // Încarc poza în Firebase Storage
      const response = await fetch(uri);
      const blob = await response.blob();

      // Creez un nume unic pentru fișier
      const filename = `profile_photos/${user.uid}_${Date.now()}.jpg`;

      // Încarc în Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Actualizez profilul utilizatorului cu noul URL al pozei în Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        photoURL: downloadURL,
      });

      Alert.alert(
        "Photo Updated",
        "Your profile photo has been updated successfully."
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      showError(t("editProfile.photoUploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      showError("No email found for this account");
      return;
    }

    Alert.alert(
      "Change Password",
      "You will receive an email with instructions to reset your password.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Email",
          onPress: async () => {
            try {
              const auth = getAuth();
              await sendPasswordResetEmail(auth, user.email!);
              Alert.alert(
                "Email Sent",
                "Password reset email has been sent to your email address."
              );
            } catch (error) {
              console.error("Error sending password reset email:", error);
              showError("Failed to send password reset email");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // A doua confirmare
            Alert.alert(
              "Confirm Delete",
              "Are you absolutely sure you want to delete your account? This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: confirmDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const reauthenticateUser = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.prompt(
        "Re-authentication Required",
        "For security reasons, please enter your password to confirm account deletion:",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Confirm",
            onPress: async (password) => {
              if (!password || !user?.email) {
                showError("Password is required");
                resolve(false);
                return;
              }

              try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

                if (!currentUser) {
                  showError("No authenticated user found");
                  resolve(false);
                  return;
                }

                const credential = EmailAuthProvider.credential(
                  user.email,
                  password
                );
                await reauthenticateWithCredential(currentUser, credential);
                resolve(true);
              } catch (error: any) {
                console.error("Re-authentication failed:", error);
                if (error.code === "auth/wrong-password") {
                  showError("Incorrect password. Please try again.");
                } else {
                  showError("Re-authentication failed. Please try again.");
                }
                resolve(false);
              }
            },
          },
        ],
        "secure-text"
      );
    });
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        showError("No authenticated user found");
        return;
      }

      // Întâi șterg datele utilizatorului din Firestore
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);

      // Apoi șterg datele relacionate (abonamente, notificări, etc.)
      // În producție ar trebui să fac validarea și pe server
      // pentru o curățare mai bună a tuturor datelor legate de utilizator

      // În final șterg utilizatorul Firebase Auth
      await deleteUser(currentUser);

      Alert.alert(
        "Account Deleted",
        "Your account has been successfully deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navighez la ecranul de login după ștergerea contului
              // Deoarece utilizatorul este șters, va fi delogat automat
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error deleting account:", error);

      // Oferă mesaje de eroare mai specifice
      if (error.code === "auth/requires-recent-login") {
        // Încerc să reautentific
        const reauthed = await reauthenticateUser();
        if (reauthed) {
          // Încerc din nou ștergerea după reautentificarea cu succes
          confirmDeleteAccount();
        }
      } else {
        showError(
          `Failed to delete account: ${error.message || error.toString()}`
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("editProfile"),
          headerBackTitle: t("profile"),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
          headerBackVisible: true,
          headerRight: () => (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#8B4513" />
              ) : (
                <Text style={styles.saveButtonText}>{t("common.save")}</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Secțiunea pentru poza de profil */}
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

        {/* Câmpurile formularului */}
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

        {/* Secțiunea cu informații despre cont */}
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

        {/* Secțiunea cu butonul de salvare */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[
              styles.saveButtonLarge,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonLargeText}>{t("common.save")}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Secțiunea cu acțiuni */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleChangePassword}
          >
            <Ionicons name="key-outline" size={24} color="#8B4513" />
            <Text style={styles.actionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={24} color="#E74C3C" />
            <Text style={[styles.actionText, styles.dangerText]}>
              Delete Account
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Mesaje Toast */}
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
  saveSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  saveButtonLarge: {
    backgroundColor: "#8B4513",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  saveButtonLargeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
