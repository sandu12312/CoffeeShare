import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Define the props interface
interface BoxesPlanProps {
  id: string;
  title: string;
  price: string;
  beans: number;
  description: string;
  icon: string;
  tag?: string | null;
  isSelected: boolean;
  animatedScale: Animated.Value;
  onSelect: () => void;
}

const BoxesPlan: React.FC<BoxesPlanProps> = ({
  id,
  title,
  price,
  beans,
  description,
  icon,
  tag,
  isSelected,
  animatedScale,
  onSelect,
}) => {
  // Render bean icons for visual representation of quantity
  const renderBeanIcons = (count: number) => {
    const maxVisibleBeans = 5;
    const beanArray = [];

    for (let i = 0; i < Math.min(count, maxVisibleBeans); i++) {
      beanArray.push(
        <Ionicons
          key={i}
          name="cafe"
          size={12}
          color="#8B4513"
          style={styles.beanIcon}
        />
      );
    }

    if (count > maxVisibleBeans) {
      beanArray.push(
        <Text key="more" style={styles.moreBeans}>
          +{count - maxVisibleBeans}
        </Text>
      );
    }

    return <View style={styles.beansContainer}>{beanArray}</View>;
  };

  return (
    <Animated.View
      style={[
        styles.planCard,
        isSelected && styles.selectedPlanCard,
        { transform: [{ scale: animatedScale }] },
      ]}
    >
      <TouchableOpacity
        style={styles.planCardTouchable}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        {tag && (
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        )}

        <View style={styles.planIconContainer}>
          <Ionicons name={icon as any} size={32} color="#8B4513" />
        </View>

        <Text style={styles.planName}>{title}</Text>
        <Text style={styles.planPrice}>{price}</Text>

        <View style={styles.beansInfoContainer}>
          <Text style={styles.beansCount}>{beans} Beans</Text>
          {renderBeanIcons(beans / 10)}
        </View>

        <Text style={styles.planDescription}>{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default BoxesPlan;

const styles = StyleSheet.create({
  planCard: {
    width: width * 0.28,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    marginHorizontal: 5,
  },
  planCardTouchable: {
    flex: 1,
  },
  selectedPlanCard: {
    borderColor: "#8B4513",
    borderWidth: 2,
  },
  tagContainer: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  tagText: {
    backgroundColor: "#8B4513",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  planIconContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F4EF",
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 12,
    marginTop: 10,
  },
  planName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#321E0E",
    textAlign: "center",
    marginBottom: 6,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 8,
  },
  beansInfoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  beansCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 4,
  },
  beansContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  beanIcon: {
    marginHorizontal: 1,
  },
  moreBeans: {
    fontSize: 10,
    color: "#8B4513",
    marginLeft: 2,
  },
  planDescription: {
    fontSize: 11,
    color: "#666666",
    textAlign: "center",
    lineHeight: 14,
  },
});
