import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import { LogBox } from "react-native";
import App from "./app/_layout"; // Points to your root layout

// Optional: Ignore specific logs if they are noisy during development
LogBox.ignoreLogs([
  "Reanimated 2",
  // Add any other specific warnings you want to ignore
]);

registerRootComponent(App);
