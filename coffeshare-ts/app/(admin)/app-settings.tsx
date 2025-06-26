import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import { Toast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

// --- Date demonstrative ---
const initialAppSettings = {
  appName: "CoffeeShare",
  supportEmail: "support@coffeeshare.app",
  maintenanceMode: false,
  newRegistrations: true,
  stripeApiKey: "sk_test_•••••••••••••••••••••••XYZ", // Placeholder pentru demo
  googleMapsApiKey: "AIzaS•••••••••••••••••••••••ABC", // Placeholder pentru demo
};
// ------------------

export default function AppSettingsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { errorState, showSuccess, hideToast } = useErrorHandler();
  const [settings, setSettings] = useState(initialAppSettings);

  const handleSave = () => {
    // Salvez setările în Firebase - momentan log pentru debugging
    console.log("Saving app settings:", settings);
    showSuccess("Modificările au fost salvate cu succes!");
  };

  // Actualizez setările local înainte de salvare
  const updateSetting = (
    key: keyof typeof initialAppSettings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Buton de salvare pentru header
  const renderSaveButton = () => (
    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
      <Text style={styles.saveButtonText}>{t("select") || "Salvează"}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader
        title={"Setări Aplicație"}
        rightAction={renderSaveButton()}
      />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Secțiunea generală cu setări de bază */}
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nume Aplicație</Text>
          <TextInput
            style={styles.input}
            value={settings.appName}
            onChangeText={(text) => updateSetting("appName", text)}
            placeholder="Numele vizibil al aplicației"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Suport</Text>
          <TextInput
            style={styles.input}
            value={settings.supportEmail}
            onChangeText={(text) => updateSetting("supportEmail", text)}
            placeholder="Adresa de email pentru suport clienți"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Permite Înregistrări Noi</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81C784" }}
            thumbColor={settings.newRegistrations ? "#4CAF50" : "#f4f3f4"}
            onValueChange={(value) => updateSetting("newRegistrations", value)}
            value={settings.newRegistrations}
          />
        </View>

        {/* Setări pentru modul de mentenanță */}
        <Text style={styles.sectionTitle}>Mentenanță</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Mod Mentenanță Activat</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#FFB74D" }} // Nuanță portocalie pentru avertisment
            thumbColor={settings.maintenanceMode ? "#FFA726" : "#f4f3f4"}
            onValueChange={(value) => updateSetting("maintenanceMode", value)}
            value={settings.maintenanceMode}
          />
        </View>
        <Text style={styles.settingDescription}>
          Când este activat, utilizatorii normali nu vor putea accesa aplicația.
        </Text>

        {/* Configurări pentru servicii externe */}
        <Text style={styles.sectionTitle}>Chei API & Integrații</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cheie API Stripe (Secret)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]} // Fac să arate ca needitabil
            value={settings.stripeApiKey}
            placeholder="sk_test_•••••••••••••••••••••••XYZ"
            editable={false} // Needitabil în UI pentru siguranță
          />
          <Text style={styles.settingDescription}>
            Modifică doar din configurația serverului/variabile de mediu.
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cheie API Google Maps</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={settings.googleMapsApiKey}
            placeholder="AIzaS•••••••••••••••••••••••ABC"
            editable={false}
          />
          <Text style={styles.settingDescription}>
            Modifică doar din configurația serverului/variabile de mediu.
          </Text>
        </View>

        {/* Add more settings sections as needed (Notifications, etc.) */}
      </ScrollView>

      {/* Error Components */}
      <Toast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
        action={errorState.toast.action}
      />
    </ScreenWrapper>
  );
}

// --- Stiluri ---
const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#888",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  switchLabel: {
    fontSize: 15,
    color: "#333",
    flex: 1, // Permit textului să se împacheteze
    marginRight: 10,
  },
  settingDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    marginLeft: 2,
    fontStyle: "italic",
  },
  saveButton: {
    // Copied from CafeSettingsScreen for consistency
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  saveButtonText: {
    // Copied from CafeSettingsScreen for consistency
    fontSize: 17,
    fontWeight: "600",
    color: "#4E342E", // Match header text color
  },
});
// --------------
