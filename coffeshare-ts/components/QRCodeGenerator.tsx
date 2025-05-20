import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useFirebase } from "../context/FirebaseContext";
import { useLanguage } from "../context/LanguageContext";
import { QRCodeData } from "../types";
import { Ionicons } from "@expo/vector-icons";

interface QRCodeGeneratorProps {
  cafeId: string;
  cafeName: string;
  productId?: string;
  productName?: string;
  onClose?: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  cafeId,
  cafeName,
  productId,
  productName,
  onClose,
}) => {
  const { generateQRCode, canRedeemCoffee } = useFirebase();
  const { t } = useLanguage();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    generateNewQRCode();
  }, [cafeId, productId]);

  useEffect(() => {
    if (!qrData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-refresh QR code when it expires
          generateNewQRCode();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData]);

  const generateNewQRCode = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);

      // First check if user can redeem coffee
      const canRedeem = await canRedeemCoffee();
      if (!canRedeem.canRedeem) {
        setError(canRedeem.reason || "You cannot redeem a coffee at this time");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Generate QR code
      const newQRData = await generateQRCode(cafeId, productId);
      setQrData(newQRData);
      setTimeLeft(300); // Reset timer to 5 minutes
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code");
      console.error("QR Code generation error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const timeTextStyle = {
    fontWeight: "bold" as const,
    color: timeLeft < 60 ? "#e74c3c" : "#321E0E",
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Generating QR Code...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle" size={50} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Create a string representation of qrData to use in the QR code
  const qrCodeContent = qrData
    ? JSON.stringify({
        userId: qrData.userId,
        cafeId: qrData.cafeId,
        timestamp: qrData.timestamp,
        subscriptionType: qrData.subscriptionType,
        uniqueCode: qrData.uniqueCode,
        validUntil: qrData.validUntil,
        productId: qrData.productId,
      })
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        {refreshing ? (
          <View style={styles.refreshingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.refreshingText}>Refreshing QR code...</Text>
          </View>
        ) : null}

        {qrData && (
          <>
            <QRCode
              value={qrCodeContent}
              size={200}
              color="#321E0E"
              backgroundColor="#FFF"
            />

            <View style={styles.infoContainer}>
              <Text style={styles.cafeText}>{cafeName}</Text>
              {productName && (
                <Text style={styles.productText}>{productName}</Text>
              )}
              <Text style={styles.expiresText}>
                Expires in{" "}
                <Text style={timeTextStyle}>{formatTime(timeLeft)}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={generateNewQRCode}
              disabled={refreshing}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
  },
  qrContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  infoContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  cafeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
  },
  productText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  expiresText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  timeText: {
    fontWeight: "bold",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  refreshButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: "#333",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    margin: 20,
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  refreshingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  refreshingText: {
    color: "#FFF",
    marginTop: 10,
    fontSize: 14,
  },
});

export default QRCodeGenerator;
