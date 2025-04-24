import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomTabBar from "../../components/BottomTabBar";

export default function QRScreen() {
  const { t } = useLanguage();

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("scanQRCode")}</Text>
          <Text style={styles.subtitle}>{t("scanQRDescription")}</Text>

          <View style={styles.scannerPlaceholder}>
            <Text style={styles.scannerText}>{t("scannerArea")}</Text>
          </View>
        </View>
      </View>
      <BottomTabBar />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4A4A4A",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
  },
  scannerPlaceholder: {
    width: "80%",
    aspectRatio: 1,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerText: {
    fontSize: 18,
    color: "#666666",
  },
});
