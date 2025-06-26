import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useFirebase } from "../context/FirebaseContext";
import { useLanguage } from "../context/LanguageContext";

interface QRCodeGeneratorProps {
  cafeId: string;
  productId?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  cafeId,
  productId,
}) => {
  const { t } = useLanguage();
  const { generateQRCode } = useFirebase();
  const [qrValue, setQrValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(15);

  const screenWidth = Dimensions.get("window").width;
  const qrSize = screenWidth * 0.7;

  // Generez un cod QR nou
  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const qrData = await generateQRCode(cafeId, productId);

      // Adaug uniqueCode pentru securitate și timestamp-ul curent
      const qrCodeWithTime = {
        ...qrData,
        refreshedAt: new Date().toISOString(),
      };

      setQrValue(JSON.stringify(qrCodeWithTime));
      setRemainingTime(15); // Resetez countdown-ul la 15 secunde
    } catch (error: any) {
      console.error("Error generating QR code:", error);
      setError(error.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generez codul QR la primul render
  useEffect(() => {
    fetchQRCode();
  }, [cafeId, productId]);

  // Refresh-ez codul QR la fiecare 15 secunde
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (remainingTime > 0) {
        setRemainingTime((prev) => prev - 1);
      } else {
        setRefreshing(true);
        fetchQRCode();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingTime]);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>{t("scanning.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        {refreshing ? (
          <View
            style={[styles.refreshOverlay, { width: qrSize, height: qrSize }]}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.refreshText}>{t("scanning.refreshing")}</Text>
          </View>
        ) : null}

        <QRCode
          value={qrValue}
          size={qrSize}
          color="#000000"
          backgroundColor="#FFFFFF"
        />

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {t("scanning.refreshIn", { seconds: remainingTime })}
          </Text>
        </View>
      </View>

      <Text style={styles.infoText}>{t("scanning.qrValidityInfo")}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qrContainer: {
    position: "relative",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginHorizontal: 20,
  },
  timerContainer: {
    position: "absolute",
    bottom: -15,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  timerText: {
    backgroundColor: "#8B4513",
    color: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 14,
    fontWeight: "bold",
    overflow: "hidden",
  },
  refreshOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  refreshText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});

export default QRCodeGenerator;
