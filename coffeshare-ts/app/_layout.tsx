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

// Configurez Sentry pentru monitoring și raportarea erorilor
Sentry.init({
  dsn: "https://9e95d16c980d636c8547f27f44d3f2d5@o4509464757010432.ingest.de.sentry.io/4509464767758416",

  // Adaug context suplimentar pentru debug
  sendDefaultPii: true,

  // Configurez session replay pentru debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // Spotlight pentru development - comentat momentan
  // spotlight: __DEV__,
});

// Activez ecranele pentru performanță mai bună
enableScreens();

SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({});

  // Inițializez sistemele de securitate
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        console.log("🔒 Initializing CoffeeShare Security...");

        // Inițializez primul sistemul de monitorizare
        SecurityMonitoring.initializeMonitoring();

        // Inițializez managerul de securitate cu setări de dezvoltare
        await SecurityManager.initialize();

        console.log("✅ Security initialization complete");
      } catch (error) {
        console.error("❌ Security initialization failed:", error);
        // În dezvoltare, continui oricum
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
