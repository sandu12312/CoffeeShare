import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function Index() {
  // For web platform, redirect to the landing page directory
  if (Platform.OS === "web") {
    return <Redirect href="/landing-page" />;
  }

  // For mobile platforms, redirect to the welcome/auth flow
  return <Redirect href="/(auth)/welcome" />;
}
