import React from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack, router, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../context/LanguageContext";

// Reusable Setting Item Component
const SettingItem = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) => (
  <Link href={href} asChild>
    <TouchableOpacity style={styles.settingItem}>
      <Ionicons name={icon} size={22} color="#8B4513" />
      <Text style={styles.settingText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#8B4513" />
    </TouchableOpacity>
  </Link>
);

export default function AccountSettingsScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      {/* Configure the header */}
      <Stack.Screen
        options={{
          headerTitle: t("accountSettings"),
          headerBackTitle: t("profile"),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.settingsCard}>
          <SettingItem
            href="/(mainUsers)/AccountSettings/EditProfile"
            icon="person-outline"
            label={t("editProfile")}
          />
          <SettingItem
            href="/(mainUsers)/AccountSettings/Language"
            icon="language-outline"
            label={t("language")}
          />
          <SettingItem
            href="/(mainUsers)/AccountSettings/Notifications"
            icon="notifications-outline"
            label={t("notifications")}
          />
          <SettingItem
            href="/(mainUsers)/AccountSettings/PrivacySecurity"
            icon="lock-closed-outline"
            label={t("privacySecurity")}
          />
          <SettingItem
            href="/(mainUsers)/AccountSettings/HelpSupport"
            icon="help-circle-outline"
            label={t("helpSupport")}
          />
        </View>
      </ScrollView>
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
    fontSize: 18, // Adjust title size if needed
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
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
});
