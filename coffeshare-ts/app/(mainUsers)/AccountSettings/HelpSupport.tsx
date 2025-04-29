import React from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useLanguage } from "../../../context/LanguageContext";

export default function HelpSupportScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("helpSupport"),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
        }}
      />
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          {t("helpSupport.infoPlaceholder")}
        </Text>
        {/* TODO: Implement FAQ, Contact links, etc. */}
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#8B4513",
  },
});
