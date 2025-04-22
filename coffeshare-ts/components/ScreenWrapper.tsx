import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ImageBackground,
  StatusBar,
  Platform,
} from "react-native";
import React from "react";
import { ScreenWrapperProps } from "../types";
import { containers } from "../styles/common";

const { width, height } = Dimensions.get("window");
const ScreenWrapper = ({ style, children, bg }: ScreenWrapperProps) => {
  return bg ? (
    <ImageBackground
      source={bg}
      style={[containers.screen, style]}
      resizeMode="cover"
    >
      {children}

      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
    </ImageBackground>
  ) : (
    <View style={[containers.screen, style]}>
      {children}
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
    </View>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: height + (Platform.OS === "android" ? 25 : 0),
  },
});
