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
import coffeePartnerService, {
  CafeDetails,
} from "../../services/coffeePartnerService";
import {
  SubscriptionService,
  SubscriptionPlan,
} from "../../services/subscriptionService";

interface CafeSettings {
  cafeName: string;
  address: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  acceptedSubscriptions: { [key: string]: boolean };
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
    acceptedSubscriptions: {},
  });

  const [cafes, setCafes] = useState<CafeDetails[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<string>("");
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCafesAndSubscriptions();
  }, [user]);

  const loadCafesAndSubscriptions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load cafes owned by current user
      const userCafes = await coffeePartnerService.getMyCafes();
      setCafes(userCafes);
      console.log("Loaded cafes:", userCafes);

      // Load subscription plans
      const unsubscribe = SubscriptionService.subscribeToActivePlans(
        (plans) => {
          console.log("Loaded subscription plans:", plans);
          setSubscriptionPlans(plans);

          // Load cafe settings after plans are loaded
          if (userCafes.length > 0 && !selectedCafe) {
            const firstCafe = userCafes[0];
            setSelectedCafe(firstCafe.id);
            // Small delay to ensure state updates
            setTimeout(() => {
              loadCafeSettings(firstCafe.id);
            }, 100);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error loading cafes and subscriptions:", error);
      Toast.show({
        type: "error",
        text1: "Eroare",
        text2: "Nu s-au putut încărca datele",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCafeSettings = async (cafeId: string) => {
    try {
      const cafe = await coffeePartnerService.getCafeById(cafeId);
      if (cafe) {
        console.log("Loaded cafe data:", cafe);

        // Build accepted subscriptions object from subscription plans
        const acceptedSubscriptions: { [key: string]: boolean } = {};
        subscriptionPlans.forEach((plan) => {
          const planId = plan.id || plan.name;
          const fieldName = `accepts${plan.name.replace(/\s+/g, "")}`;
          acceptedSubscriptions[planId] = cafe[fieldName] ?? false;
        });

        console.log("Built accepted subscriptions:", acceptedSubscriptions);

        setSettings({
          cafeName: cafe.businessName || "",
          address: cafe.address || "",
          description: cafe.description || "",
          contactEmail: cafe.email || cafe.phoneNumber || user?.email || "",
          contactPhone: cafe.phone || cafe.phoneNumber || "",
          acceptedSubscriptions,
        });
      }
    } catch (error) {
      console.error("Error loading cafe settings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load cafe settings",
      });
    }
  };

  const handleCafeChange = (cafeId: string) => {
    setSelectedCafe(cafeId);
    // Small delay to ensure state updates, then load settings
    setTimeout(() => {
      loadCafeSettings(cafeId);
    }, 100);
    setHasChanges(false); // Reset changes when switching cafes
  };

  const handleSave = async () => {
    if (!user || !selectedCafe) {
      console.log("Cannot save: missing user or selected cafe", {
        user: !!user,
        selectedCafe,
      });
      return;
    }

    console.log("Starting save process with settings:", settings);

    setSaving(true);
    try {
      // Prepare subscription updates
      const subscriptionUpdates: { [key: string]: boolean } = {};
      Object.entries(settings.acceptedSubscriptions).forEach(
        ([planId, accepted]) => {
          const plan = subscriptionPlans.find(
            (p) => (p.id || p.name) === planId
          );
          if (plan) {
            const fieldName = `accepts${plan.name.replace(/\s+/g, "")}`;
            subscriptionUpdates[fieldName] = accepted;
            console.log(
              `Mapping subscription: ${planId} -> ${fieldName} = ${accepted}`
            );
          }
        }
      );

      console.log("Subscription updates:", subscriptionUpdates);

      // Prepare complete update object
      const updateData = {
        businessName: settings.cafeName.trim(),
        address: settings.address.trim(),
        description: settings.description.trim(),
        email: settings.contactEmail.trim(),
        phone: settings.contactPhone.trim(),
        ...subscriptionUpdates,
      };

      console.log("Complete update data:", updateData);

      // Update cafe using the service
      await coffeePartnerService.updateCafe(selectedCafe, updateData);

      Toast.show({
        type: "success",
        text1: "Succes",
        text2: "Setările au fost salvate cu succes",
      });

      setHasChanges(false);

      // Reload the settings to confirm they were saved
      setTimeout(() => {
        loadCafeSettings(selectedCafe);
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      Toast.show({
        type: "error",
        text1: "Eroare",
        text2:
          error instanceof Error
            ? error.message
            : "Nu s-au putut salva setările",
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

  // Helper function to update subscription acceptance
  const updateSubscriptionSetting = (planId: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      acceptedSubscriptions: {
        ...prev.acceptedSubscriptions,
        [planId]: value,
      },
    }));
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
        {/* Cafe Selection */}
        {cafes.length > 1 && (
          <Animatable.View animation="fadeInDown" duration={400}>
            <View style={styles.cafeSelectionContainer}>
              <Text style={styles.cafeSelectionLabel}>
                Selectează Cafeneaua
              </Text>
              <TouchableOpacity
                style={styles.cafeDropdown}
                onPress={() => {
                  // Simple dropdown - could be enhanced with a modal
                  Alert.alert(
                    "Selectează Cafeneaua",
                    "Alege cafeneaua pe care vrei să o editezi:",
                    [
                      ...cafes.map((cafe) => ({
                        text: cafe.businessName,
                        onPress: () => handleCafeChange(cafe.id),
                      })),
                      { text: "Anulează", style: "cancel" },
                    ]
                  );
                }}
              >
                <Text style={styles.cafeDropdownText}>
                  {cafes.find((c) => c.id === selectedCafe)?.businessName ||
                    "Selectează cafeneaua"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

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
          {subscriptionPlans.map((plan) => {
            const planId = plan.id || plan.name;
            const isAccepted = settings.acceptedSubscriptions[planId] || false;

            // Get icon based on plan name
            const getIcon = (name: string) => {
              if (name.toLowerCase().includes("student"))
                return "school-outline";
              if (name.toLowerCase().includes("elite")) return "star-outline";
              if (name.toLowerCase().includes("premium"))
                return "diamond-outline";
              return "card-outline";
            };

            return (
              <View key={planId} style={styles.switchContainer}>
                <LinearGradient
                  colors={["#FFFFFF", "#FFF8F3"]}
                  style={styles.switchGradient}
                >
                  <View style={styles.switchLeft}>
                    <Ionicons
                      name={getIcon(plan.name) as any}
                      size={20}
                      color="#8B4513"
                    />
                    <Text style={styles.switchLabel}>{plan.name}</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#D7CCC8", true: "#D2691E" }}
                    thumbColor={isAccepted ? "#8B4513" : "#f4f3f4"}
                    ios_backgroundColor="#D7CCC8"
                    onValueChange={(value) =>
                      updateSubscriptionSetting(planId, value)
                    }
                    value={isAccepted}
                  />
                </LinearGradient>
              </View>
            );
          })}
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
  cafeSelectionContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  cafeSelectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2415",
    marginBottom: 10,
  },
  cafeDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7CCC8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cafeDropdownText: {
    fontSize: 16,
    color: "#3C2415",
    fontWeight: "500",
    flex: 1,
  },
});
