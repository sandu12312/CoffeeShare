import React from "react";
import { StyleSheet, View, Text, SafeAreaView } from "react-native";
import { Stack } from "expo-router";
import BottomTabBar from "../../components/BottomTabBar";

export default function QRScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <Text style={styles.title}>QR Scanner</Text>
        <Text style={styles.subtitle}>
          Scan a cafe's QR code to redeem your coffee
        </Text>

        {/* Placeholder for QR scanner */}
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrPlaceholderText}>QR Scanner Area</Text>
        </View>
      </View>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 30,
    textAlign: "center",
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
  qrPlaceholderText: {
    color: "#A0A0A0",
    fontSize: 16,
    fontWeight: "bold",
  },
});
