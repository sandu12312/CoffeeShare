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
import { QRService, QRValidationResult } from "../../services/qrService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

const QrScannerScreen = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase(); // This should be the coffee partner user
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastRedemption, setLastRedemption] =
    useState<QRValidationResult | null>(null);
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
        Animated.delay(3000),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setScanSuccess(false);
        setLastRedemption(null);
      });
    }
  }, [scanSuccess]);

  const processQRData = async (data: string) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    setScanError(null);

    try {
      // The QR data should be the token hash
      const token = data.trim();

      if (!token) {
        setScanError("Invalid QR code format");
        setProcessing(false);
        setTimeout(() => {
          setScanned(false);
          setScanError(null);
        }, 2000);
        return;
      }

      // Get partner and cafe information
      if (!user?.uid) {
        setScanError("Partner not authenticated");
        setProcessing(false);
        setTimeout(() => {
          setScanned(false);
          setScanError(null);
        }, 2000);
        return;
      }

      // Get partner's cafe information
      let cafeId = user.uid; // Use partner's UID as default cafe ID
      let cafeName = "Partner Cafe";

      try {
        // Try to get cafe from user's profile or associated cafes
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log(
            "🔍 SCANNER DEBUG - User data:",
            JSON.stringify(userData, null, 2)
          );

          // First, try to get cafe name from user's own business data
          if (userData.businessName) {
            cafeName = userData.businessName;
            cafeId = user.uid;
            console.log(
              `✅ SCANNER: Using businessName from user: ${cafeName}`
            );
          } else if (userData.displayName) {
            cafeName = userData.displayName;
            cafeId = user.uid;
            console.log(`✅ SCANNER: Using displayName from user: ${cafeName}`);
          } else {
            console.log(
              "⚠️ SCANNER: No businessName or displayName found in user data"
            );
          }

          // Check if there's an associated cafe ID and try to get more specific data
          if (userData.associatedCafeId) {
            const associatedCafeId = userData.associatedCafeId;
            console.log(
              `🔍 SCANNER: Found associatedCafeId: ${associatedCafeId}`
            );

            // Try to get cafe details from cafes collection
            try {
              const cafeDoc = await getDoc(doc(db, "cafes", associatedCafeId));
              if (cafeDoc.exists()) {
                const cafeData = cafeDoc.data();
                console.log(
                  "🔍 SCANNER DEBUG - Cafe data:",
                  JSON.stringify(cafeData, null, 2)
                );
                if (cafeData.businessName) {
                  cafeName = cafeData.businessName;
                  cafeId = associatedCafeId;
                  console.log(
                    `✅ SCANNER: Using businessName from cafes collection: ${cafeName}`
                  );
                } else {
                  console.log(
                    "⚠️ SCANNER: No businessName found in cafe document"
                  );
                }
              } else {
                console.log(
                  `❌ SCANNER: Cafe document ${associatedCafeId} does not exist`
                );
              }
            } catch (cafeDocError) {
              console.log(
                "❌ SCANNER: Error fetching cafe document:",
                cafeDocError
              );
            }
          } else {
            console.log("⚠️ SCANNER: No associatedCafeId found in user data");
          }
        } else {
          console.log(`❌ SCANNER: User document ${user.uid} does not exist`);
        }
      } catch (cafeError) {
        console.warn(
          "❌ SCANNER: Could not fetch cafe info, using defaults:",
          cafeError
        );
      }

      console.log(
        `🎯 SCANNER FINAL RESULT - Cafe ID: ${cafeId}, Cafe Name: ${cafeName}`
      );

      console.log("🔍 Processing QR token with partner analytics...");

      // Use the new method with partner analytics
      const result = await QRService.validateAndRedeemQRTokenWithPartner(
        token,
        user.uid,
        user.email || "",
        user.displayName || "Partner",
        cafeId,
        cafeName
      );

      if (result.success) {
        setLastRedemption(result);
        setScanSuccess(true);
        setProcessing(false);
        setTimeout(() => {
          setScanned(false);
        }, 4000);
      } else {
        setScanError(result.message);
        setProcessing(false);
        setTimeout(() => {
          setScanned(false);
          setScanError(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error("Error processing QR code:", error);
      setScanError(
        error.message || "An error occurred while processing the QR code"
      );
      setProcessing(false);
      setTimeout(() => {
        setScanned(false);
        setScanError(null);
      }, 3000);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      processQRData(manualCode);
    } else {
      Alert.alert(t("common.error"), "Please enter a valid QR code");
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
            <Text style={styles.manualInputTitle}>Enter QR Code Token</Text>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Paste QR token here..."
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
                <Text style={styles.buttonText}>Validate</Text>
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
                Position the customer's QR code within the frame
              </Text>
            </View>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualInput(true)}
            >
              <Ionicons name="keypad-outline" size={24} color="#FFF" />
              <Text style={styles.manualButtonText}>Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanSuccess && lastRedemption && (
          <Animated.View
            style={[styles.statusOverlay, { opacity: successOpacity }]}
          >
            <View style={styles.statusContent}>
              <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
              <Text style={styles.successText}>
                QR Code Successfully Redeemed!
              </Text>
              {lastRedemption.userInfo && (
                <View style={styles.redemptionInfo}>
                  <Text style={styles.redemptionText}>
                    Customer ID:{" "}
                    {lastRedemption.userInfo.userId.substring(0, 8)}...
                  </Text>
                  <Text style={styles.redemptionText}>
                    Beans Remaining: {lastRedemption.userInfo.beansLeft}
                  </Text>
                </View>
              )}
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
            <Text style={styles.scanningText}>Validating QR Code...</Text>
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
  redemptionInfo: {
    marginTop: 10,
    alignItems: "center",
  },
  redemptionText: {
    color: "#FFF",
    fontSize: 14,
    marginBottom: 5,
  },
});

export default QrScannerScreen;
