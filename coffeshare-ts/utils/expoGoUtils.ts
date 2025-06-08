import { Platform } from "react-native";
import Constants from "expo-constants";

// Check if running in Expo Go
export const isExpoGo = Constants.appOwnership === "expo";

// Fallback for react-native-device-info when running in Expo Go
export const deviceInfoFallback = {
  getModel: () => Promise.resolve(`${Platform.OS} Device`),
  getSystemVersion: () =>
    Promise.resolve(Platform.Version?.toString() || "1.0"),
  getUniqueId: () => Promise.resolve("expo-go-unique-id"),
  getDeviceId: () => Promise.resolve(`expo-go-${Platform.OS}`),
  isEmulator: () => Promise.resolve(true), // Assume emulator in Expo Go
  hasSystemFeature: () => Promise.resolve(false),
  getSystemName: () => Promise.resolve(Platform.OS),
  getVersion: () => Promise.resolve("1.0.0"),
  getBuildNumber: () => Promise.resolve("1"),
  getBundleId: () => Promise.resolve("com.expo.client"),
  getApplicationName: () => Promise.resolve("Expo Go"),
  getDeviceType: () => (Platform.OS === "ios" ? "phone" : "unknown"),
  hasNotch: () => Promise.resolve(false),
  isTablet: () => Promise.resolve(false),
  getCarrier: () => Promise.resolve("Unknown"),
  getTotalMemory: () => Promise.resolve(0),
  getMaxMemory: () => Promise.resolve(0),
  getUsedMemory: () => Promise.resolve(0),
  getUserAgent: () => Promise.resolve("Expo Go"),
  getInstallReferrer: () => Promise.resolve(""),
  getInstallerPackageName: () => Promise.resolve("com.expo.client"),
  isAirplaneMode: () => Promise.resolve(false),
  isBatteryCharging: () => Promise.resolve(false),
  isPinOrFingerprintSet: () => Promise.resolve(false),
  getFirstInstallTime: () => Promise.resolve(Date.now()),
  getLastUpdateTime: () => Promise.resolve(Date.now()),
  getSerialNumber: () => Promise.resolve("unknown"),
  getAndroidId: () => Promise.resolve("unknown"),
  getIpAddress: () => Promise.resolve("127.0.0.1"),
  isCameraPresent: () => Promise.resolve(true),
  getBrightness: () => Promise.resolve(0.5),
  getDevice: () => Promise.resolve("unknown"),
  getDisplay: () => Promise.resolve("unknown"),
  getFingerprint: () => Promise.resolve("unknown"),
  getHardware: () => Promise.resolve("unknown"),
  getHost: () => Promise.resolve("unknown"),
  getProduct: () => Promise.resolve("unknown"),
  getTags: () => Promise.resolve("unknown"),
  getType: () => Promise.resolve("unknown"),
  getBaseOs: () => Promise.resolve("unknown"),
  getPreviewSdkInt: () => Promise.resolve(0),
  getSecurityPatch: () => Promise.resolve("unknown"),
  getCodename: () => Promise.resolve("unknown"),
  getIncremental: () => Promise.resolve("unknown"),
  supported32BitAbis: () => Promise.resolve([]),
  supported64BitAbis: () => Promise.resolve([]),
  supportedAbis: () => Promise.resolve([]),
};

// Safe DeviceInfo import with fallback
export const getDeviceInfo = () => {
  if (isExpoGo) {
    return deviceInfoFallback;
  }

  try {
    return require("react-native-device-info").default;
  } catch (error) {
    console.warn("react-native-device-info not available, using fallback");
    return deviceInfoFallback;
  }
};
