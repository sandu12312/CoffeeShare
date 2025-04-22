import { StyleSheet, ViewStyle } from "react-native";
import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

export const containers = StyleSheet.create({
  screen: {
    flex: 1,
    height: height + (Platform.OS === "android" ? 25 : 0),
    width: width,
  },
  main: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginVertical: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const colors = {
  primary: "#4A90E2",
  secondary: "#F5A623",
  background: "#FFFFFF",
  text: "#333333",
  textLight: "#666666",
  border: "#E0E0E0",
  error: "#D0021B",
  success: "#7ED321",
  warning: "#F5A623",
  info: "#4A90E2",
};
