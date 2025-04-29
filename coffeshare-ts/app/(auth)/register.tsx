import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFirebase } from "../../context/FirebaseContext";
import { useLanguage, TranslationKey } from "../../context/LanguageContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const { register } = useFirebase();
  const { t } = useLanguage();

  const handleRegister = async () => {
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t("common.error"), t("register.fillAllFieldsError"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("register.passwordsMismatchError"));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t("common.error"), t("register.passwordTooShortError"));
      return;
    }

    try {
      setLoading(true);

      // Register the user with Firebase Auth and create their profile
      const result = await register(email, password, name);

      if (result.success) {
        if (result.verificationSent) {
          setVerificationSent(true);
          Alert.alert(
            t("register.verificationEmailSentTitle"),
            t("register.verificationEmailSentMessage"),
            [
              {
                text: t("common.ok"),
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
        } else {
          Alert.alert(
            t("register.registrationSuccessfulTitle"),
            t("register.registrationSuccessfulMessage"),
            [
              {
                text: t("common.continue"),
                onPress: () => router.replace("/(mainUsers)/dashboard"),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          t("register.registrationErrorTitle"),
          t("register.registrationFailedDefault")
        );
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessageKey: TranslationKey =
        "register.registrationFailedDefault";

      if (error.code === "auth/email-already-in-use") {
        errorMessageKey = "register.emailInUseError";
      } else if (error.code === "auth/invalid-email") {
        errorMessageKey = "register.invalidEmailError";
      } else if (error.code === "auth/weak-password") {
        errorMessageKey = "register.weakPasswordError";
      }

      Alert.alert(t("register.registrationErrorTitle"), t(errorMessageKey));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{t("common.appName")}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>
              {t("register.createAccountTitle")}
            </Text>
            <Text style={styles.subtitleText}>
              {t("register.joinCommunitySubtitle")}
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#8B4513"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("register.fullNamePlaceholder")}
                placeholderTextColor="#8B4513"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#8B4513"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("common.emailPlaceholder")}
                placeholderTextColor="#8B4513"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8B4513"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("common.passwordPlaceholder")}
                placeholderTextColor="#8B4513"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#8B4513"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8B4513"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("register.confirmPasswordPlaceholder")}
                placeholderTextColor="#8B4513"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#8B4513"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loadingText}>
                    {t("register.creatingAccountLoading")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.registerButtonText}>
                  {t("register.registerButton")}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                {t("register.alreadyHaveAccountPrompt")}
              </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>{t("register.loginLink")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: "rgba(255, 248, 220, 0.75)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.3)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#321E0E",
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: "#8B4513",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#8B4513",
    fontSize: 14,
  },
  loginLink: {
    color: "#321E0E",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 16,
  },
});
