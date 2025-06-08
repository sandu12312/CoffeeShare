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

  // Error states for inline validation
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const { register } = useFirebase();
  const { t } = useLanguage();

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError("Full name is required");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }

    // Check minimum length
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      setPasswordError("Password must contain at least one uppercase letter");
      return false;
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      setPasswordError("Password must contain at least one lowercase letter");
      return false;
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      setPasswordError("Password must contain at least one number");
      return false;
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setPasswordError(
        "Password must contain at least one special character (!@#$%^&*...)"
      );
      return false;
    }

    setPasswordError("");
    return true;
  };

  const validatePassword = (password: string) => {
    return validatePasswordStrength(password);
  };

  const getPasswordStrengthInfo = (password: string) => {
    if (!password) return { strength: 0, message: "Enter a password" };

    let strength = 0;
    const requirements = [];

    // Length check
    if (password.length >= 8) {
      strength += 20;
    } else {
      requirements.push("8+ characters");
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 20;
    } else {
      requirements.push("uppercase letter");
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 20;
    } else {
      requirements.push("lowercase letter");
    }

    // Number check
    if (/[0-9]/.test(password)) {
      strength += 20;
    } else {
      requirements.push("number");
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength += 20;
    } else {
      requirements.push("special character");
    }

    let message = "";
    if (strength === 100) {
      message = "Strong password! ✓";
    } else if (strength >= 80) {
      message = `Missing: ${requirements.join(", ")}`;
    } else if (strength >= 60) {
      message = `Needs: ${requirements.join(", ")}`;
    } else {
      message = `Required: ${requirements.join(", ")}`;
    }

    return { strength, message };
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string
  ) => {
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleRegister = async () => {
    // Clear previous errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate inputs
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(
      confirmPassword,
      password
    );

    if (
      !isNameValid ||
      !isEmailValid ||
      !isPasswordValid ||
      !isConfirmPasswordValid
    ) {
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

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  nameError ? styles.inputContainerError : null,
                ]}
              >
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
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) validateName(text);
                  }}
                  onBlur={() => validateName(name)}
                  autoCapitalize="words"
                />
              </View>
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  emailError ? styles.inputContainerError : null,
                ]}
              >
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
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  onBlur={() => validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  passwordError ? styles.inputContainerError : null,
                ]}
              >
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
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                    // Also revalidate confirm password if it exists
                    if (confirmPassword && confirmPasswordError) {
                      validateConfirmPassword(confirmPassword, text);
                    }
                  }}
                  onBlur={() => validatePassword(password)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8B4513"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : password ? (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width: `${
                            getPasswordStrengthInfo(password).strength
                          }%`,
                          backgroundColor:
                            getPasswordStrengthInfo(password).strength === 100
                              ? "#4CAF50"
                              : getPasswordStrengthInfo(password).strength >= 60
                              ? "#FF9800"
                              : "#F44336",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.passwordStrengthText,
                      {
                        color:
                          getPasswordStrengthInfo(password).strength === 100
                            ? "#4CAF50"
                            : "#8B4513",
                      },
                    ]}
                  >
                    {getPasswordStrengthInfo(password).message}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  confirmPasswordError ? styles.inputContainerError : null,
                ]}
              >
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
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError)
                      validateConfirmPassword(text, password);
                  }}
                  onBlur={() =>
                    validateConfirmPassword(confirmPassword, password)
                  }
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#8B4513"
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
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
  inputGroup: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.3)",
  },
  inputContainerError: {
    borderColor: "#FF4444",
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#321E0E",
    fontSize: 16,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    fontWeight: "500",
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
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: "rgba(139, 69, 19, 0.2)",
    borderRadius: 2,
    marginBottom: 4,
  },
  passwordStrengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
