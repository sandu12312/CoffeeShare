import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { LanguageProvider } from "../context/LanguageContext";
import { FirebaseProvider } from "../context/FirebaseContext";
import { CartProvider } from "../context/CartContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { SecurityManager } from "../utils/securityManager";
import { SecurityMonitoring } from "../utils/monitoring";
import * as Sentry from "@sentry/react-native";
// import { StripeProvider } from "@stripe/stripe-react-native"; // Removed for Expo Go compatibility

Sentry.init({
  dsn: "https://9e95d16c980d636c8547f27f44d3f2d5@o4509464757010432.ingest.de.sentry.io/4509464767758416",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Enable screens for better performance
enableScreens();

SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({});

  // Initialize security systems
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        console.log("🔒 Initializing CoffeeShare Security...");

        // Initialize monitoring first
        SecurityMonitoring.initializeMonitoring();

        // Initialize security manager with development settings
        await SecurityManager.initialize();

        console.log("✅ Security initialization complete");
      } catch (error) {
        console.error("❌ Security initialization failed:", error);
        // In development, continue anyway
        if (__DEV__) {
          console.warn(
            "⚠️ Continuing in development mode despite security errors"
          );
        }
      }
    };

    initializeSecurity();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FirebaseProvider>
        <CartProvider>
          <LanguageProvider>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </View>
          </LanguageProvider>
        </CartProvider>
      </FirebaseProvider>
    </GestureHandlerRootView>
  );
});
