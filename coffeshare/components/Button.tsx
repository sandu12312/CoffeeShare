import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";

type ButtonProps = {
  label: string;
  theme:
    | "welcome->login"
    | "login->singUp"
    | "login->forgotPassword"
    | "register->EmailValidation"
    | "VerifyCode";
  onPress: () => void;
};

const Button = ({ label, theme, onPress }: ButtonProps) => {
  if (theme === "welcome->login") {
    return (
      <TouchableOpacity style={styles.welcomeToLoginButton} onPress={onPress}>
        <Text style={styles.welcomeToLoginText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // Default button for other themes
  return (
    <TouchableOpacity style={styles.defaultButton} onPress={onPress}>
      <Text style={styles.defaultText}>{label}</Text>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  welcomeToLoginButton: {
    backgroundColor: "#8B4513", // Coffee brown
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 10,
    width: "80%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  welcomeToLoginText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  defaultButton: {
    backgroundColor: "#D2B48C", // Tan
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  defaultText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
