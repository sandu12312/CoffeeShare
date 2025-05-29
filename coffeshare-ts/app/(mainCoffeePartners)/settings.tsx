import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useFirebase } from "../../context/FirebaseContext";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

interface CafeSettings {
  cafeName: string;
  address: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  acceptsStudentPack: boolean;
  acceptsElite: boolean;
  acceptsPremium: boolean;
}

export default function CafeSettingsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();

  const [settings, setSettings] = useState<CafeSettings>({
    cafeName: "",
    address: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    acceptsStudentPack: true,
    acceptsElite: true,
    acceptsPremium: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCafeSettings();
  }, [user]);

  const loadCafeSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First get the partner document to find associated cafe
      const partnerDoc = await getDoc(doc(db, "partners", user.uid));
      if (!partnerDoc.exists()) {
        console.error("Partner document not found");
        return;
      }

      const partnerData = partnerDoc.data();
      const cafeId = partnerData.associatedCafeId;

      if (!cafeId) {
        console.error("No associated cafe found");
        return;
      }

      // Get cafe data
      const cafeDoc = await getDoc(doc(db, "cafes", cafeId));
      if (cafeDoc.exists()) {
        const cafeData = cafeDoc.data();
        setSettings({
          cafeName: cafeData.businessName || cafeData.name || "",
          address: cafeData.address || "",
          description: cafeData.description || "",
          contactEmail: cafeData.email || user.email || "",
          contactPhone: cafeData.phone || "",
          acceptsStudentPack: cafeData.acceptsStudentPack ?? true,
          acceptsElite: cafeData.acceptsElite ?? true,
          acceptsPremium: cafeData.acceptsPremium ?? false,
        });
      }
    } catch (error) {
      console.error("Error loading cafe settings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Get partner's cafe ID
      const partnerDoc = await getDoc(doc(db, "partners", user.uid));
      if (!partnerDoc.exists()) {
        throw new Error("Partner document not found");
      }

      const cafeId = partnerDoc.data().associatedCafeId;
      if (!cafeId) {
        throw new Error("No associated cafe found");
      }

      // Update cafe document
      await updateDoc(doc(db, "cafes", cafeId), {
        businessName: settings.cafeName,
        name: settings.cafeName, // Keep both for compatibility
        address: settings.address,
        description: settings.description,
        email: settings.contactEmail,
        phone: settings.contactPhone,
        acceptsStudentPack: settings.acceptsStudentPack,
        acceptsElite: settings.acceptsElite,
        acceptsPremium: settings.acceptsPremium,
        updatedAt: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Settings saved successfully",
      });

      setHasChanges(false);
      router.back();
    } catch (error) {
      console.error("Error saving settings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper function to update settings state
  const updateSetting = (key: keyof CafeSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#3C2415" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setări Cafenea</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#8B4513" />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                !hasChanges && styles.saveButtonTextDisabled,
              ]}
            >
              Salvează
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Animatable.View animation="fadeInDown" duration={600}>
          <LinearGradient
            colors={["#8B4513", "#A0522D"]}
            style={styles.sectionHeader}
          >
            <Ionicons name="storefront" size={20} color="#F5E6D3" />
            <Text style={styles.sectionTitle}>Profil Cafenea</Text>
          </LinearGradient>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={200}
          style={styles.sectionContent}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="cafe-outline" size={18} color="#8B4513" />
              <Text style={styles.label}>Nume Cafenea</Text>
            </View>
            <TextInput
              style={styles.input}
              value={settings.cafeName}
              onChangeText={(text) => updateSetting("cafeName", text)}
              placeholder="Numele cafenelei tale"
              placeholderTextColor="#A0522D"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="location-outline" size={18} color="#8B4513" />
              <Text style={styles.label}>Adresă</Text>
            </View>
            <TextInput
              style={styles.input}
              value={settings.address}
              onChangeText={(text) => updateSetting("address", text)}
              placeholder="Adresa completă"
              placeholderTextColor="#A0522D"
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#8B4513"
              />
              <Text style={styles.label}>Descriere Scurtă</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings.description}
              onChangeText={(text) => updateSetting("description", text)}
              placeholder="Descrie pe scurt cafeneaua"
              placeholderTextColor="#A0522D"
              multiline
              numberOfLines={3}
            />
          </View>
        </Animatable.View>

        {/* Contact Section */}
        <Animatable.View animation="fadeInDown" delay={400} duration={600}>
          <LinearGradient
            colors={["#3C2415", "#5D3A1A"]}
            style={styles.sectionHeader}
          >
            <Ionicons name="call" size={20} color="#F5E6D3" />
            <Text style={styles.sectionTitle}>Informații Contact</Text>
          </LinearGradient>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={600}
          style={styles.sectionContent}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="mail-outline" size={18} color="#8B4513" />
              <Text style={styles.label}>Email Contact</Text>
            </View>
            <TextInput
              style={styles.input}
              value={settings.contactEmail}
              onChangeText={(text) => updateSetting("contactEmail", text)}
              placeholder="Email de contact"
              placeholderTextColor="#A0522D"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="call-outline" size={18} color="#8B4513" />
              <Text style={styles.label}>Telefon Contact</Text>
            </View>
            <TextInput
              style={styles.input}
              value={settings.contactPhone}
              onChangeText={(text) => updateSetting("contactPhone", text)}
              placeholder="Număr de telefon"
              placeholderTextColor="#A0522D"
              keyboardType="phone-pad"
            />
          </View>
        </Animatable.View>

        {/* Accepted Subscriptions Section */}
        <Animatable.View animation="fadeInDown" delay={800} duration={600}>
          <LinearGradient
            colors={["#D2691E", "#DEB887"]}
            style={styles.sectionHeader}
          >
            <Ionicons name="card" size={20} color="#F5E6D3" />
            <Text style={styles.sectionTitle}>Abonamente Acceptate</Text>
          </LinearGradient>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={styles.sectionContent}
        >
          <View style={styles.switchContainer}>
            <LinearGradient
              colors={["#FFFFFF", "#FFF8F3"]}
              style={styles.switchGradient}
            >
              <View style={styles.switchLeft}>
                <Ionicons name="school-outline" size={20} color="#8B4513" />
                <Text style={styles.switchLabel}>Student Pack</Text>
              </View>
              <Switch
                trackColor={{ false: "#D7CCC8", true: "#D2691E" }}
                thumbColor={settings.acceptsStudentPack ? "#8B4513" : "#f4f3f4"}
                ios_backgroundColor="#D7CCC8"
                onValueChange={(value) =>
                  updateSetting("acceptsStudentPack", value)
                }
                value={settings.acceptsStudentPack}
              />
            </LinearGradient>
          </View>

          <View style={styles.switchContainer}>
            <LinearGradient
              colors={["#FFFFFF", "#FFF8F3"]}
              style={styles.switchGradient}
            >
              <View style={styles.switchLeft}>
                <Ionicons name="star-outline" size={20} color="#8B4513" />
                <Text style={styles.switchLabel}>Elite</Text>
              </View>
              <Switch
                trackColor={{ false: "#D7CCC8", true: "#D2691E" }}
                thumbColor={settings.acceptsElite ? "#8B4513" : "#f4f3f4"}
                ios_backgroundColor="#D7CCC8"
                onValueChange={(value) => updateSetting("acceptsElite", value)}
                value={settings.acceptsElite}
              />
            </LinearGradient>
          </View>

          <View style={styles.switchContainer}>
            <LinearGradient
              colors={["#FFFFFF", "#FFF8F3"]}
              style={styles.switchGradient}
            >
              <View style={styles.switchLeft}>
                <Ionicons name="diamond-outline" size={20} color="#8B4513" />
                <Text style={styles.switchLabel}>Premium</Text>
              </View>
              <Switch
                trackColor={{ false: "#D7CCC8", true: "#D2691E" }}
                thumbColor={settings.acceptsPremium ? "#8B4513" : "#f4f3f4"}
                ios_backgroundColor="#D7CCC8"
                onValueChange={(value) =>
                  updateSetting("acceptsPremium", value)
                }
                value={settings.acceptsPremium}
              />
            </LinearGradient>
          </View>
        </Animatable.View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5E6D3",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
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
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
  },
  saveButtonTextDisabled: {
    color: "#A0522D",
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5E6D3",
  },
  sectionContent: {
    padding: 20,
    paddingTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: "#3C2415",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7CCC8",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#3C2415",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  switchContainer: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  switchGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  switchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: "#3C2415",
    fontWeight: "500",
  },
});
