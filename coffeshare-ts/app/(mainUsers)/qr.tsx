import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AppState,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomTabBar from "../../components/BottomTabBar";
import QRCode from "react-native-qrcode-svg";
import { useFirebase } from "../../context/FirebaseContext";
import * as SecureStore from "expo-secure-store";
import { TOTP } from "otpauth";

const getTotpSecret = async (userId: string): Promise<string | null> => {
  try {
    const secret = await SecureStore.getItemAsync(`userTotpSecret_${userId}`);
    if (secret) {
      return secret;
    }
    console.warn(
      "Secretul TOTP nu a fost găsit în SecureStore. Folosind placeholder!"
    );
    const placeholderSecret = "KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRW";
    await SecureStore.setItemAsync(
      `userTotpSecret_${userId}`,
      placeholderSecret
    );
    return placeholderSecret;
  } catch (error) {
    console.error("Eroare la obținerea secretului TOTP:", error);
    return null;
  }
};

export default function QRScreen() {
  const { t } = useLanguage();
  const { user } = useFirebase();
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totpInstanceRef = useRef<TOTP | null>(null);
  const appState = useRef(AppState.currentState);

  const generateNewOtp = useCallback(() => {
    if (totpInstanceRef.current) {
      try {
        const token = totpInstanceRef.current.generate();
        setCurrentOtp(token);
        if (user?.uid) {
          const valueToEncode = JSON.stringify({
            userId: user.uid,
            totp: token,
          });
          setQrValue(valueToEncode);
        }
        setError(null);
      } catch (err) {
        console.error("Eroare la generarea tokenului TOTP:", err);
        setError(t("common.error"));
      }
    }
  }, [user?.uid, t]);

  const setupOtpGenerator = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentOtp(null);
    setQrValue("");
    if (intervalRef.current) clearInterval(intervalRef.current);

    const secret = await getTotpSecret(user.uid);

    if (secret) {
      try {
        totpInstanceRef.current = new TOTP({
          issuer: "CoffeShare",
          label: user.email || user.uid,
          algorithm: "SHA1",
          digits: 6,
          period: 15,
          secret: secret,
        });
        generateNewOtp();

        intervalRef.current = setInterval(generateNewOtp, 15 * 1000);
      } catch (err) {
        console.error("Eroare la inițializarea TOTP:", err);
        setError(t("common.error"));
        totpInstanceRef.current = null;
      }
    } else {
      setError(t("common.error"));
    }
    setIsLoading(false);
  }, [user?.uid, user?.email, generateNewOtp, t]);

  useEffect(() => {
    setupOtpGenerator();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
        setupOtpGenerator();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [setupOtpGenerator]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t("scanQRCode")}</Text>
          <Text style={styles.subtitle}>{t("scanQRDescription")}</Text>

          <View style={styles.qrContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4A4A4A" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : qrValue ? (
              <QRCode
                value={qrValue}
                size={250}
                backgroundColor="white"
                color="black"
              />
            ) : (
              <Text style={styles.errorText}>{t("common.error")}</Text>
            )}
          </View>

          {currentOtp && !isLoading && !error && (
            <Text style={styles.otpText}>
              {currentOtp.match(/.{1,3}/g)?.join(" ")}
            </Text>
          )}
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
  },
  qrContainer: {
    width: 280,
    height: 280,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    marginBottom: 20,
  },
  otpText: {
    marginTop: 15,
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 3,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
