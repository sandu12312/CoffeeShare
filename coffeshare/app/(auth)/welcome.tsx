import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ScreenWrapper from "../../components/ScreenWrapper";

const Welcome = () => {
  return (
    <ScreenWrapper
      bg={require("../../assets/images/coffee-beans-textured-background.jpg")}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to CoffeShare</Text>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});
