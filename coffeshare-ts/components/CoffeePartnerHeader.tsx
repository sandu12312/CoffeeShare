import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CoffeePartnerHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

const HEADER_TEXT_COLOR = "#4E342E"; // Maro mai întunecat și mai bogat

const CoffeePartnerHeader: React.FC<CoffeePartnerHeaderProps> = ({
  title,
  showBackButton = true,
  rightAction,
}) => {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const canGoBack = navigation.canGoBack();

  const handleBackPress = () => {
    if (canGoBack) {
      router.back();
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <View style={styles.leftContainer}>
          {showBackButton && canGoBack && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.buttonStyle}
            >
              <Ionicons
                name="arrow-back-outline"
                size={26}
                color={HEADER_TEXT_COLOR}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
        <View style={styles.rightContainer}>
          {/* Înfășor rightAction în TouchableOpacity dacă este doar text */}
          {typeof rightAction === "string" ? (
            <TouchableOpacity style={styles.buttonStyle}>
              <Text style={styles.actionText}>{rightAction}</Text>
            </TouchableOpacity>
          ) : (
            rightAction
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#FFFFFF", // Fundal alb simplu
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    // paddingTop se setează dinamic
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 60, // Înălțime fixă pentru consistență
  },
  leftContainer: {
    width: 50, // Lățime fixă pentru zona butonului din stânga
    alignItems: "flex-start",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1, // Titlul ocupă spațiul rămas
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5, // Adaug margine mică pentru a preveni suprapunerea cu butoanele dacă titlul e lung
  },
  rightContainer: {
    width: 70, // Lățime fixă pentru zona acțiunii din dreapta, ajustez după necesitate
    alignItems: "flex-end",
    justifyContent: "center",
  },
  buttonStyle: {
    padding: 8, // Padding consistent pentru zona de tap
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600", // Semi-bold
    color: HEADER_TEXT_COLOR,
  },
  actionText: {
    // Stil pentru acțiunile de tip string transmise la rightAction
    fontSize: 16,
    fontWeight: "600",
    color: HEADER_TEXT_COLOR,
  },
});

export default CoffeePartnerHeader;
