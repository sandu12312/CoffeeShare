import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Image,
} from "react-native";
import React from "react";
import { colors } from "../styles/common";

type OnboardingItemProps = {
  item: {
    id: number;
    title: string;
    description: string;
    image: any;
  };
};

const OnboardingItem = ({ item }: OnboardingItemProps) => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.imageContainer}>
        <Image
          source={item.image}
          style={[styles.image, { width: width * 0.8, height: height * 0.5 }]}
          resizeMode="cover"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
};

export default OnboardingItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 0.7,
    justifyContent: "center",
  },
  image: {
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    flex: 0.3,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});
