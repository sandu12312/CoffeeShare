import React from "react";
import { View, StyleSheet } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import CafeManagementBox from "../../components/CafeManagementBox";
import useAuth from "../../hooks/useAuth";

export default function ManageCafesScreen() {
  const { refreshUser } = useAuth();

  const handleCafeUpdated = () => {
    // Reîmprospătez utilizatorul auth în caz că permisiunile s-au schimbat
    refreshUser();
  };

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader
        title="Manage Cafes & Requests"
        showBackButton={true}
      />

      <View style={styles.container}>
        <CafeManagementBox onCafeUpdated={handleCafeUpdated} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
