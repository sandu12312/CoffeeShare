import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Stack } from "expo-router";
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
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("language")}</Text>
      </View>

      <View style={styles.content}>
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
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 20,
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
