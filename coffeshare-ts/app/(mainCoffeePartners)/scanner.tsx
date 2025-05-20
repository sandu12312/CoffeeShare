import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const QrScannerScreen = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getPermissions();
  }, []);

  const processQRData = (data: string) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Parse the QR code data
      const qrData = JSON.parse(data);

      // Validate the QR code structure
      if (!qrData.cafeId || !qrData.userId || !qrData.timestamp) {
        Alert.alert(
          "Invalid QR Code",
          "This QR code is not valid for CoffeeShare.",
          [
            {
              text: "Try Again",
              onPress: () => setScanned(false),
            },
          ]
        );
        return;
      }

      // Check if the QR code is expired (5 minutes validity)
      const qrTimestamp = new Date(qrData.timestamp).getTime();
      const currentTime = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (currentTime - qrTimestamp > fiveMinutes) {
        Alert.alert(
          "Expired QR Code",
          "This QR code has expired. Please generate a new one.",
          [
            {
              text: "Try Again",
              onPress: () => setScanned(false),
            },
          ]
        );
        return;
      }

      // Verify the cafe exists
      verifyQrData(qrData);
    } catch (error) {
      console.error("Error processing QR code:", error);
      Alert.alert(
        "Error",
        "There was an error processing the QR code. Please try again.",
        [
          {
            text: "Try Again",
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const verifyQrData = async (qrData: any) => {
    try {
      // Verify the cafe exists
      const cafeRef = doc(db, "cafes", qrData.cafeId);
      const cafeDoc = await getDoc(cafeRef);

      if (!cafeDoc.exists()) {
        Alert.alert(
          "Invalid Cafe",
          "This cafe is not registered in our system.",
          [
            {
              text: "Try Again",
              onPress: () => setScanned(false),
            },
          ]
        );
        return;
      }

      // Verify the user exists
      const userRef = doc(db, "users", qrData.userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        Alert.alert(
          "Invalid User",
          "This user is not registered in our system.",
          [
            {
              text: "Try Again",
              onPress: () => setScanned(false),
            },
          ]
        );
        return;
      }

      // If all validations pass, show success message
      Alert.alert("Valid QR Code", "QR code is valid and can be redeemed!", [
        {
          text: "Scan Another",
          onPress: () => {
            setScanned(false);
            setShowManualInput(false);
          },
        },
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error verifying QR data:", error);
      Alert.alert(
        "Error",
        "There was an error verifying the QR code. Please try again.",
        [
          {
            text: "Try Again",
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled) {
        // Here you would typically process the image to extract QR code
        // Since we can't scan QR codes from images in this simple implementation,
        // we'll just show the manual input option
        setShowManualInput(true);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Could not open camera. Please try again.");
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      processQRData(manualCode);
    } else {
      Alert.alert("Error", "Please enter a valid QR code data.");
    }
  };

  if (hasPermission === null) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.permissionText}>
            Requesting camera permission...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (hasPermission === false) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
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
            <Ionicons name="arrow-back" size={24} color="#321E0E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanează Cod QR</Text>
        </View>

        {showManualInput ? (
          <View style={styles.manualInputContainer}>
            <Text style={styles.manualInputTitle}>Enter QR Code Data</Text>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Paste QR code data here"
              multiline
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowManualInput(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleManualSubmit}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Camera Preview</Text>
              <TouchableOpacity
                style={styles.takePhotoButton}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualInput(true)}
            >
              <Text style={styles.manualButtonText}>Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanned && !showManualInput && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.scanningText}>Processing QR Code...</Text>

            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default QrScannerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#FFF",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 20,
  },
  takePhotoButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
  },
  manualButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "rgba(139, 69, 19, 0.8)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  manualButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  manualInputContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  manualInputTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#321E0E",
  },
  manualInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 5,
    padding: 10,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#999",
  },
  submitButton: {
    backgroundColor: "#8B4513",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FFF",
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  instructionsText: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
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
    color: "#333",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  permissionButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanAgainButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  scanAgainButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
