import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useFirebase } from "../../context/FirebaseContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

const QrScannerScreen = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { verifyAndRedeemQRCode } = useFirebase();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);

  useEffect(() => {
    const getPerms = async () => {
      if (!permission) {
        await requestPermission();
      } else if (!permission.granted && permission.canAskAgain) {
        await requestPermission();
      } else if (!permission.granted && !permission.canAskAgain) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to scan QR codes.",
          [
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      }
    };

    getPerms();
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission?.granted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [permission, scanLineAnimation]);

  useEffect(() => {
    if (scanSuccess) {
      Animated.sequence([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setScanSuccess(false);
      });
    }
  }, [scanSuccess]);

  const processQRData = (data: string) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    setScanError(null);

    try {
      const qrData = JSON.parse(data);
      if (
        !qrData.cafeId ||
        !qrData.userId ||
        !qrData.timestamp ||
        !qrData.uniqueCode
      ) {
        setScanError(t("scanner.invalidQrMissingFields"));
        setProcessing(false);
        setTimeout(() => {
          setScanned(false);
          setScanError(null);
        }, 2000);
        return;
      }
      verifyAndRedeemQrCode(qrData);
    } catch (error) {
      console.error("Error processing QR code:", error);
      setScanError(t("scanner.invalidQrFormat"));
      setProcessing(false);
      setTimeout(() => {
        setScanned(false);
        setScanError(null);
      }, 2000);
    }
  };

  const verifyAndRedeemQrCode = async (qrData: any) => {
    try {
      const validUntil = qrData.validUntil ? new Date(qrData.validUntil) : null;
      const now = new Date();

      if (validUntil && now > validUntil) {
        setScanError(t("scanner.qrExpired"));
        setProcessing(false);
        setTimeout(() => {
          setScanned(false);
          setScanError(null);
        }, 2000);
        return;
      }

      const result = await verifyAndRedeemQRCode(qrData);

      if (result.success) {
        setScanSuccess(true);
        setProcessing(false);
        setTimeout(() => {
          setScanned(false);
        }, 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error verifying QR data:", error);
      setScanError(error.message || t("scanner.errorVerifying"));
      setProcessing(false);
      setTimeout(() => {
        setScanned(false);
        setScanError(null);
      }, 2000);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      processQRData(manualCode);
    } else {
      Alert.alert(t("common.error"), t("scanner.enterValidQrCode"));
    }
  };

  if (!permission) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.permissionText}>
            {t("scanner.checkingPermission")}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.permissionText}>
            {t("scanner.noCameraAccess")}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              {t("scanner.grantPermission")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, { marginTop: 10 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>
              {t("common.goBack")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("scanQRCode")}</Text>
          <View style={styles.headerRight} />
        </View>

        {showManualInput ? (
          <View style={styles.manualInputContainer}>
            <Text style={styles.manualInputTitle}>
              {t("scanner.enterQrCodeData")}
            </Text>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder={t("scanner.pasteQrCodeHere")}
              multiline
              placeholderTextColor="#666"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowManualInput(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.buttonText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleManualSubmit}
              >
                <Text style={styles.buttonText}>{t("select")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            {permission.granted && (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={
                  scanned
                    ? undefined
                    : (scanningResult: BarcodeScanningResult) => {
                        if (scanningResult.data) {
                          processQRData(scanningResult.data);
                        }
                      }
                }
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            )}
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={styles.scanAreaCorner} />
                <View style={[styles.scanAreaCorner, styles.topRight]} />
                <View style={[styles.scanAreaCorner, styles.bottomLeft]} />
                <View style={[styles.scanAreaCorner, styles.bottomRight]} />
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, SCAN_AREA_SIZE],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <Text style={styles.scanInstructions}>
                {t("scanner.positionQrCode")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualInput(true)}
            >
              <Ionicons name="keypad-outline" size={24} color="#FFF" />
              <Text style={styles.manualButtonText}>
                {t("scanner.enterCodeManually")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {scanSuccess && (
          <Animated.View
            style={[styles.statusOverlay, { opacity: successOpacity }]}
          >
            <View style={styles.statusContent}>
              <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
              <Text style={styles.successText}>
                {t("scanner.qrSuccessfullyRedeemed")}
              </Text>
            </View>
          </Animated.View>
        )}

        {scanError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={24} color="#FFF" />
            <Text style={styles.errorBannerText}>{scanError}</Text>
          </View>
        )}

        {processing && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.scanningText}>
              {t("scanner.processingQrCode")}
            </Text>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => {
                setProcessing(false);
                setScanned(false);
              }}
            >
              <Text style={styles.scanAgainButtonText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? 40 : 50,
    paddingBottom: 15,
    backgroundColor: "transparent",
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    backgroundColor: "transparent",
  },
  scanAreaCorner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#FFF",
    borderWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopRightRadius: 5,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 5,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 5,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#FFF",
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  scanInstructions: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  manualButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  manualButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  manualInputContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  manualInputTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFF",
  },
  manualInput: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20,
    color: "#FFF",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  submitButton: {
    backgroundColor: "#8B4513",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanningText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  permissionText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  permissionButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: "center",
    minWidth: 200,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanAgainButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
  },
  scanAgainButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  statusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  statusContent: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 15,
    textAlign: "center",
  },
  errorBanner: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(231, 76, 60, 0.9)",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  errorBannerText: {
    color: "#FFF",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});

export default QrScannerScreen;
