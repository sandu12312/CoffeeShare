import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../context/LanguageContext";

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: "ro", name: t("romanian") },
    { code: "en", name: t("english") },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("language"),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
          headerShown: true,
          headerBackVisible: false,
          presentation: "card",
        }}
      />

      <View style={styles.content}>
        {/* Buton custom pentru înapoi */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(mainUsers)/profile")}
        >
          <Ionicons name="arrow-back" size={20} color="#8B4513" />
          <Text style={styles.backButtonText}>Înapoi la Profil</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t("selectLanguage")}</Text>

        <View style={styles.languageList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                language === lang.code && styles.selectedLanguage,
              ]}
              onPress={() => setLanguage(lang.code as "ro" | "en")}
            >
              <Text
                style={[
                  styles.languageText,
                  language === lang.code && styles.selectedLanguageText,
                ]}
              >
                {lang.name}
              </Text>
              {language === lang.code && (
                <Ionicons name="checkmark" size={24} color="#8B4513" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 20,
  },
  languageList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  selectedLanguage: {
    backgroundColor: "#FFF8F0",
  },
  languageText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  selectedLanguageText: {
    color: "#8B4513",
    fontWeight: "600",
  },
});
