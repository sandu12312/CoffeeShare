import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

export default function Login() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Login",
        }}
      />
      <Text style={styles.title}>Login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
