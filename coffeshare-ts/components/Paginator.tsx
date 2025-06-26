import { StyleSheet, View, Animated, useWindowDimensions } from "react-native";
import React from "react";

type PaginatorProps = {
  data: any[];
  currentIndex: number;
};

const Paginator = ({ data, currentIndex }: PaginatorProps) => {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {data.map((_, index) => {
        const isActive = currentIndex === index;
        return (
          <View
            key={index.toString()}
            style={[
              styles.dot,
              isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        );
      })}
    </View>
  );
};

export default Paginator;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  activeDot: {
    width: 20,
    backgroundColor: "#D2B48C", // Maro-cafeniu - o culoare bogată de cafea
  },
  inactiveDot: {
    width: 8,
    backgroundColor: "#D2B48C", // Tan - o culoare de cafea mai deschisă
  },
});
