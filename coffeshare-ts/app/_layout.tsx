import { Stack } from "expo-router";
import { useCallback } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { LanguageProvider } from "../context/LanguageContext";
import { FirebaseProvider } from "../context/FirebaseContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <FirebaseProvider>
      <LanguageProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>
      </LanguageProvider>
    </FirebaseProvider>
  );
}
