import { StyleSheet, View, FlatList, useWindowDimensions } from "react-native";
import React, { useState, useRef } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import slides from "../../constants/slides";
import OnboardingItem from "../../components/OnboardingItem";
import Paginator from "../../components/Paginator";
import Button from "../../components/Button";
import { router } from "expo-router";

const Welcome = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <ScreenWrapper
      bg={require("../../assets/images/coffee-beans-textured-background.jpg")}
    >
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={({ item }) => <OnboardingItem item={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            bounces={false}
            keyExtractor={(item) => item.id.toString()}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
            initialNumToRender={1}
          />
        </View>
        <Paginator data={slides} currentIndex={currentIndex} />
        <View style={styles.buttonContainer}>
          <Button
            label="Get Started"
            theme="welcome->login"
            onPress={handleLogin}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
});
