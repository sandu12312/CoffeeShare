import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// import { CameraView, useCameraPermissions } from 'expo-camera'; // Will be needed later

export default function QrScannerScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  // const [facing, setFacing] = useState('back');
  // const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // useEffect(() => {
  //   (async () => {
  //     const { status } = await requestPermission();
  //     if (status !== 'granted') {
  //       Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes.');
  //       router.back();
  //     }
  //   })();
  // }, []);

  // if (!permission) {
  //   // Camera permissions are still loading
  //   return <View />;
  // }

  // if (!permission.granted) {
  //   // Camera permissions are not granted yet
  //   return (
  //     <ScreenWrapper>
  //       <View style={styles.permissionContainer}>
  //         <Text style={styles.permissionText}>We need your permission to show the camera</Text>
  //         <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
  //           <Text style={styles.permissionButtonText}>Grant Permission</Text>
  //         </TouchableOpacity>
  //          <TouchableOpacity onPress={() => router.back()} style={[styles.permissionButton, styles.backButton]}>
  //           <Text style={styles.permissionButtonText}>Go Back</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </ScreenWrapper>
  //   );
  // }

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    // TODO: Validate the QR code data (check if it's a valid CoffeeShare code)
    Alert.alert(`Cod QR Scanat!`, `Tip: ${type}\nDate: ${data}`, [
      { text: "Scanează din nou", onPress: () => setScanned(false) },
      { text: "OK", onPress: () => router.back() }, // Or navigate to confirmation screen
    ]);
    console.log(`Scanned QR: Type=${type}, Data=${data}`);
    // TODO: Send data to backend for validation and processing
  };

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
          {/* TODO: Add translation key 'scanQrCodeTitle' */}
          <Text style={styles.headerTitle}>Scanează Cod QR</Text>
        </View>

        {/* Placeholder for Camera View */}
        <View style={styles.cameraContainer}>
          {/* <CameraView
            style={styles.camera}
            facing={facing}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          /> */}
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="camera-outline" size={100} color="#E0E0E0" />
            <Text style={styles.placeholderText}>Camera View Area</Text>
          </View>
          {/* Overlay with viewfinder */}
          <View style={styles.overlay}>
            <View style={styles.viewfinder} />
            {/* TODO: Add translation key 'positionQrCode' */}
            <Text style={styles.instructionsText}>
              Poziționează codul QR în cadru
            </Text>
          </View>
        </View>

        {/* Optional: Add flash toggle button if needed */}
        {/* <TouchableOpacity style={styles.flashButton}> 
          <Ionicons name="flash-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>*/}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Black background for scanner
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50, // Adjust for status bar height
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
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholder: {
    width: "80%",
    aspectRatio: 1, // Square aspect ratio
    backgroundColor: "#333",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#E0E0E0",
    marginTop: 10,
  },
  // camera: { // Style for actual CameraView
  //   ...StyleSheet.absoluteFillObject,
  // },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
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
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Add styles for flash button if needed
});
