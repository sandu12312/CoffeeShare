import React from "react";
import { View, StyleSheet } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import UserManagementBox from "../../components/UserManagementBox";
import useAuth from "../../hooks/useAuth";

export default function ManageUsersScreen() {
  const { refreshUser } = useAuth();

  const handleUserUpdated = () => {
    // Reîmprospătez utilizatorul auth în caz că permisiunile s-au schimbat
    refreshUser();
  };

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title="User Management" showBackButton={true} />

      <View style={styles.container}>
        <UserManagementBox onUserUpdated={handleUserUpdated} />
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
