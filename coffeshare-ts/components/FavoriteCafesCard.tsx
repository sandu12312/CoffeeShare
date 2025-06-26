import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WishlistItem } from "../services/wishlistService";

interface FavoriteCafesCardProps {
  favoriteCafes: WishlistItem[];
  onViewAll: () => void;
  onCafePress: (cafeId: string) => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2.2; // Ajustez pentru padding și spațiere

export default function FavoriteCafesCard({
  favoriteCafes,
  onViewAll,
  onCafePress,
}: FavoriteCafesCardProps) {
  if (favoriteCafes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="heart" size={24} color="#E74C3C" />
            <Text style={styles.title}>Favorite Cafes</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start exploring cafes and save your favorites!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push("/(mainUsers)/findCafes")}
          >
            <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
            <Text style={styles.exploreButtonText}>Explore Cafes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="heart" size={24} color="#E74C3C" />
          <Text style={styles.title}>Favorite Cafes</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{favoriteCafes.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#8B4513" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.cafesScroll}
      >
        {favoriteCafes.map((cafe, index) => (
          <TouchableOpacity
            key={cafe.id}
            style={[styles.cafeCard, index === 0 && styles.firstCard]}
            onPress={() => onCafePress(cafe.cafeId)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri:
                    cafe.cafeBannerImageUrl ||
                    cafe.cafeImageUrl ||
                    "https://via.placeholder.com/200x120?text=No+Image",
                }}
                style={styles.cafeImage}
                resizeMode="cover"
              />
              <View style={styles.favoriteIndicator}>
                <Ionicons name="heart" size={14} color="#E74C3C" />
              </View>
            </View>

            <View style={styles.cafeInfo}>
              <Text style={styles.cafeName} numberOfLines={1}>
                {cafe.cafeName}
              </Text>
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={12} color="#8B4513" />
                <Text style={styles.cafeAddress} numberOfLines={1}>
                  {cafe.cafeAddress}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Adaug buton "mai multe" dacă sunt mai multe cafenele */}
        {favoriteCafes.length >= 3 && (
          <TouchableOpacity
            style={styles.moreCard}
            onPress={onViewAll}
            activeOpacity={0.8}
          >
            <View style={styles.moreContent}>
              <Ionicons name="add-circle-outline" size={32} color="#8B4513" />
              <Text style={styles.moreText}>View All</Text>
              <Text style={styles.moreSubtext}>
                {favoriteCafes.length}+ favorites
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 248, 220, 0.9)",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#321E0E",
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: "#E74C3C",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(139, 69, 19, 0.1)",
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B4513",
    marginRight: 4,
  },
  cafesScroll: {
    paddingBottom: 20,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  cafeCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstCard: {
    marginLeft: 4,
  },
  imageContainer: {
    position: "relative",
    height: 90,
  },
  cafeImage: {
    width: "100%",
    height: "100%",
  },
  favoriteIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cafeInfo: {
    padding: 12,
  },
  cafeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cafeAddress: {
    fontSize: 12,
    color: "#8B4513",
    marginLeft: 4,
    flex: 1,
  },
  moreCard: {
    width: CARD_WIDTH,
    backgroundColor: "rgba(139, 69, 19, 0.05)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(139, 69, 19, 0.2)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    height: 150,
  },
  moreContent: {
    alignItems: "center",
  },
  moreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B4513",
    marginTop: 8,
  },
  moreSubtext: {
    fontSize: 12,
    color: "#8B4513",
    opacity: 0.7,
    marginTop: 2,
  },

  // Stiluri pentru starea goală
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8B4513",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8B4513",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
