import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useLanguage, TranslationKey } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import { useSubscriptionStatus } from "../../hooks/useSubscriptionStatus";
import { Toast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

type IconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  title: string;
  icon: IconName;
  onPress: () => void;
}

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { user, userProfile, logout } = useFirebase();
  const { errorState, showError, hideToast } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Folosesc hook-ul pentru starea abonamentului pentru a obține date în timp real
  const subscriptionStatus = useSubscriptionStatus(user?.uid);

  // Curăț listener-ii când utilizatorul este null (după ștergerea contului)
  useEffect(() => {
    if (!user) {
      // Utilizatorul a fost șters sau s-a delogat, curăț orice listener activ
      console.log("User is null, cleaning up profile screen");
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh-ez datele profilului utilizatorului
      if (user?.uid) {
        // Datele profilului vor fi refresh-ate automat de către context
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangeProfilePhoto = async () => {
    try {
      // Cer permisiunea pentru a accesa galeria foto
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          t("profile.permissionDenied"),
          t("profile.permissionDeniedMessage")
        );
        return;
      }

      // Afișez opțiunile pentru cameră sau galerie
      Alert.alert(
        t("editProfile.changeProfilePhoto"),
        t("editProfile.photoOptions"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("editProfile.camera"), onPress: () => openCamera() },
          {
            text: t("editProfile.photoLibrary"),
            onPress: () => openImagePicker(),
          },
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
          t("editProfile.cameraPermissionDenied"),
          t("editProfile.cameraPermissionMessage")
        );
        return;
      }

      setUploadingPhoto(true);
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
      showError(t("editProfile.photoUploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openImagePicker = async () => {
    try {
      setUploadingPhoto(true);
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
      showError(t("editProfile.photoUploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      if (!user?.uid) return;

      // Încarc poza în Firebase Storage și actualizez profilul utilizatorului
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

      Alert.alert(t("profile.photoUpdated"), t("profile.photoUpdatedMessage"));
    } catch (error) {
      console.error("Error uploading photo:", error);
      showError(t("profile.photoUpdateError"));
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      showError(t("dashboard.logoutError"));
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: t("editProfile"),
      icon: "person-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/EditProfile"),
    },
    {
      title: t("subscriptions"),
      icon: "card-outline",
      onPress: () => router.push("/(mainUsers)/subscriptions"),
    },
    {
      title: t("language"),
      icon: "language-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/Language"),
    },
    {
      title: t("notifications"),
      icon: "notifications-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/Notifications"),
    },
    {
      title: t("privacySecurity"),
      icon: "shield-outline",
      onPress: () =>
        router.push("/(mainUsers)/AccountSettings/PrivacySecurity"),
    },
    {
      title: t("helpSupport"),
      icon: "help-circle-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/HelpSupport"),
    },
    {
      title: t("about"),
      icon: "information-circle-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/About"),
    },
  ];

  if (!userProfile) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>{t("profile.loading")}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      bg={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.fullScreen}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.overlay}>
        <View style={styles.customHeader}>
          <Text style={styles.customHeaderTitle}>{t("profile")}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeProfilePhoto}
              disabled={uploadingPhoto}
            >
              {userProfile.photoURL ? (
                <Image
                  source={{ uri: userProfile.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.placeholderText}>
                    {userProfile.displayName
                      ? userProfile.displayName.charAt(0).toUpperCase()
                      : t("profile.initialPlaceholder")}
                  </Text>
                </View>
              )}
              <View style={styles.editPhotoOverlay}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{userProfile.displayName}</Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>
            <Text style={styles.memberSince}>
              {t("memberSince")} {formatDate(userProfile.createdAt)}
            </Text>
          </View>

          <View style={styles.subscriptionCard}>
            <Text style={styles.sectionTitle}>
              {t("profile.subscriptionTitle")}
            </Text>
            <View style={styles.subscriptionDetails}>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>
                  {t("profile.planLabel")}
                </Text>
                <Text style={styles.subscriptionValue}>
                  {subscriptionStatus.subscriptionName ||
                    t("profile.noSubscriptionPlan")}
                </Text>
              </View>

              {subscriptionStatus.isActive && (
                <>
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>
                      {t("profile.statusLabel")}
                    </Text>
                    <Text
                      style={[
                        styles.subscriptionValue,
                        subscriptionStatus.isActive
                          ? styles.activeText
                          : styles.inactiveText,
                      ]}
                    >
                      {subscriptionStatus.isActive
                        ? t("profile.statusActive")
                        : t("profile.statusInactive")}
                    </Text>
                  </View>

                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>
                      Beans Remaining
                    </Text>
                    <Text style={[styles.subscriptionValue, styles.beansValue]}>
                      {subscriptionStatus.beansLeft || 0} /{" "}
                      {subscriptionStatus.beansTotal || 0} beans
                    </Text>
                  </View>

                  {subscriptionStatus.expiresAt && (
                    <View style={styles.subscriptionRow}>
                      <Text style={styles.subscriptionLabel}>
                        {t("profile.expiresLabel")}
                      </Text>
                      <Text style={styles.subscriptionValue}>
                        {formatDate(subscriptionStatus.expiresAt)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name={item.icon} size={24} color="#8B4513" />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#C0392B" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={22} color="#C0392B" />
                  <Text style={[styles.settingText, styles.logoutText]}>
                    {t("logout")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomTabBar />

        {/* Componentele pentru erori */}
        <Toast
          visible={errorState.toast.visible}
          message={errorState.toast.message}
          type={errorState.toast.type}
          onHide={hideToast}
        />
      </View>
    </ScreenWrapper>
  );
}

const { width, height } = Dimensions.get("screen");

const styles = StyleSheet.create({
  fullScreen: {
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingBottom: 75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  loadingText: {
    marginTop: 10,
    color: "#8B4513",
    fontSize: 16,
  },
  customHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6C7",
    alignItems: "center",
  },
  customHeaderTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#321E0E",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#8B4513",
    backgroundColor: "#E0D6C7",
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8B4513",
  },
  placeholderText: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  editPhotoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(139, 69, 19, 0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: 16,
    color: "#F0F0F0",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  memberSince: {
    fontSize: 14,
    color: "#F0F0F0",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subscriptionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  subscriptionDetails: {
    marginTop: 10,
  },
  subscriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  subscriptionLabel: {
    fontSize: 16,
    color: "#321E0E",
  },
  subscriptionValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#321E0E",
  },
  activeText: {
    color: "#27AE60",
  },
  inactiveText: {
    color: "#E74C3C",
  },
  beansValue: {
    fontWeight: "600",
    color: "#8B4513",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
  },
  settingsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.08)",
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E",
    marginLeft: 15,
  },
  logoutText: {
    color: "#C0392B",
    fontWeight: "500",
  },
  menuContainer: {
    backgroundColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#1A1A1A",
    marginLeft: 12,
  },
});
