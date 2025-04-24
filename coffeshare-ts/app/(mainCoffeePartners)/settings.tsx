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

// Dummy data for settings
const initialSettings = {
  cafeName: "Cafeneaua Aromată",
  address: "Str. Principală nr. 10, București",
  description: "O cafenea primitoare cu cafea de specialitate.",
  contactEmail: "contact@cafea-aromata.ro",
  contactPhone: "0722 123 456",
  acceptsStudentPack: true,
  acceptsElite: true,
  acceptsPremium: false,
};

export default function CafeSettingsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    // TODO: Implement saving logic (e.g., update Firestore)
    console.log("Saving settings:", settings);
    alert("Setări salvate (simulat)!");
    router.back(); // Go back after saving
  };

  // Helper function to update settings state
  const updateSetting = (
    key: keyof typeof initialSettings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#321E0E" />
        </TouchableOpacity>
        {/* TODO: Add translation key 'cafeSettingsTitle' */}
        <Text style={styles.headerTitle}>Setări Cafenea</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          {/* TODO: Add translation key 'save' */}
          <Text style={styles.saveButtonText}>Salvează</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profil Cafenea</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nume Cafenea</Text>
          <TextInput
            style={styles.input}
            value={settings.cafeName}
            onChangeText={(text) => updateSetting("cafeName", text)}
            placeholder="Numele cafenelei tale"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Adresă</Text>
          <TextInput
            style={styles.input}
            value={settings.address}
            onChangeText={(text) => updateSetting("address", text)}
            placeholder="Adresa completă"
            multiline
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descriere Scurtă</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.description}
            onChangeText={(text) => updateSetting("description", text)}
            placeholder="Descrie pe scurt cafeneaua"
            multiline
          />
        </View>

        {/* Contact Section */}
        <Text style={styles.sectionTitle}>Informații Contact</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Contact</Text>
          <TextInput
            style={styles.input}
            value={settings.contactEmail}
            onChangeText={(text) => updateSetting("contactEmail", text)}
            placeholder="Email de contact"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Telefon Contact</Text>
          <TextInput
            style={styles.input}
            value={settings.contactPhone}
            onChangeText={(text) => updateSetting("contactPhone", text)}
            placeholder="Număr de telefon"
            keyboardType="phone-pad"
          />
        </View>

        {/* Accepted Subscriptions Section */}
        <Text style={styles.sectionTitle}>Abonamente Acceptate</Text>
        <View style={styles.switchContainer}>
          {/* TODO: Add translation key 'studentPack' */}
          <Text style={styles.switchLabel}>Student Pack</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#A0522D" }} // SaddleBrown shade
            thumbColor={settings.acceptsStudentPack ? "#8B4513" : "#f4f3f4"} // Darker brown / grey
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) =>
              updateSetting("acceptsStudentPack", value)
            }
            value={settings.acceptsStudentPack}
          />
        </View>
        <View style={styles.switchContainer}>
          {/* TODO: Add translation key 'elitePack' */}
          <Text style={styles.switchLabel}>Elite</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#A0522D" }}
            thumbColor={settings.acceptsElite ? "#8B4513" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => updateSetting("acceptsElite", value)}
            value={settings.acceptsElite}
          />
        </View>
        <View style={styles.switchContainer}>
          {/* TODO: Add translation key 'premiumPack' */}
          <Text style={styles.switchLabel}>Premium</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#A0522D" }}
            thumbColor={settings.acceptsPremium ? "#8B4513" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => updateSetting("acceptsPremium", value)}
            value={settings.acceptsPremium}
          />
        </View>

        {/* TODO: Add Operating Hours section */}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Align items with space between
    paddingHorizontal: 15,
    paddingTop: 50, // Adjust for status bar height
    paddingBottom: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    // Takes space automatically due to justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
    // Takes space automatically
  },
  saveButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513", // Use brown color
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
    marginTop: 15,
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
    color: "#555",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top", // Align text to the top for multiline
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
});
