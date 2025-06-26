import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ButtonProps = {
  label: string;
  theme: "welcome->login" | "login->welcome";
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function Button({ label, theme, onPress, icon }: ButtonProps) {
  // Gestionez butonul de înapoi pentru tema login->welcome
  if (theme === "login->welcome") {
    return (
      <TouchableOpacity style={styles.backButton} onPress={onPress}>
        {icon && <Ionicons name={icon} size={28} color="#FFFFFF" />}
      </TouchableOpacity>
    );
  }

  // Randez butonul standard pentru tema welcome->login
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#321E0E",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});
