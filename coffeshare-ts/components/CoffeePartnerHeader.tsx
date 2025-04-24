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

const HEADER_TEXT_COLOR = "#4E342E"; // Darker, richer brown

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
          {/* Wrap rightAction in TouchableOpacity if it's just text */}
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
    backgroundColor: "#FFFFFF", // Plain white background
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    // paddingTop is set dynamically
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 60, // Fixed height for consistency
  },
  leftContainer: {
    width: 50, // Fixed width for the left button area
    alignItems: "flex-start",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1, // Title takes remaining space
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5, // Add small margin to prevent overlap with buttons if title is long
  },
  rightContainer: {
    width: 70, // Fixed width for the right action area, adjust as needed
    alignItems: "flex-end",
    justifyContent: "center",
  },
  buttonStyle: {
    padding: 8, // Consistent padding for tap area
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600", // Semi-bold
    color: HEADER_TEXT_COLOR,
  },
  actionText: {
    // Style for string actions passed to rightAction
    fontSize: 16,
    fontWeight: "600",
    color: HEADER_TEXT_COLOR,
  },
});

export default CoffeePartnerHeader;
