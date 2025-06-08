import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFirebase } from "../../context/FirebaseContext";
import { useLanguage } from "../../context/LanguageContext";
import BottomTabBar from "../../components/BottomTabBar";
import wishlistService, { WishlistItem } from "../../services/wishlistService";
import { Toast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

const { width } = Dimensions.get("window");

export default function WishlistScreen() {
  const { t } = useLanguage();
  const { user } = useFirebase();
  const { errorState, showError, showSuccess, hideToast } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadWishlist = useCallback(
    async (isRefresh = false) => {
      if (!user?.uid) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const favorites = await wishlistService.getUserWishlist(user.uid);
        setWishlist(favorites);
      } catch (error: any) {
        showError(error.message || "Failed to load favorites");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid, showError]
  );

  // Reload wishlist when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadWishlist(false);
      }
    }, [loadWishlist, user?.uid])
  );

  useEffect(() => {
    if (user?.uid) {
      loadWishlist(false);
    }
  }, [loadWishlist, user?.uid]);

  const handleRemoveFromWishlist = async (cafeId: string, cafeName: string) => {
    Alert.alert(
      "Remove from Favorites",
      `Are you sure you want to remove "${cafeName}" from your favorites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!user?.uid) return;

            setDeletingId(cafeId);
            try {
              await wishlistService.removeFromWishlist(user.uid, cafeId);
              setWishlist((prev) =>
                prev.filter((item) => item.cafeId !== cafeId)
              );
              showSuccess("Removed from favorites!");
            } catch (error: any) {
              showError(error.message || "Failed to remove from favorites");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCafePress = (cafeId: string) => {
    router.push(`/(mainUsers)/cafeDetails?cafeId=${cafeId}`);
  };

  const renderWishlistItem = (item: WishlistItem) => {
    const isDeleting = deletingId === item.cafeId;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.wishlistItem, isDeleting && styles.wishlistItemDeleting]}
        onPress={() => handleCafePress(item.cafeId)}
        disabled={isDeleting}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.cafeBannerImageUrl ||
                item.cafeImageUrl ||
                "https://via.placeholder.com/120x80?text=No+Image",
            }}
            style={styles.cafeImage}
            resizeMode="cover"
          />
          <View style={styles.favoriteIndicator}>
            <Ionicons name="heart" size={16} color="#E74C3C" />
          </View>
        </View>

        <View style={styles.cafeInfo}>
          <Text style={styles.cafeName} numberOfLines={1}>
            {item.cafeName}
          </Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={14} color="#8B4513" />
            <Text style={styles.cafeAddress} numberOfLines={2}>
              {item.cafeAddress}
            </Text>
          </View>
          {item.cafeDescription && (
            <Text style={styles.cafeDescription} numberOfLines={2}>
              {item.cafeDescription}
            </Text>
          )}
          <Text style={styles.addedDate}>
            Added on {item.addedAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFromWishlist(item.cafeId, item.cafeName)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size={20} color="#E74C3C" />
            ) : (
              <Ionicons name="heart-dislike" size={20} color="#E74C3C" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => handleCafePress(item.cafeId)}
            disabled={isDeleting}
          >
            <Ionicons name="restaurant-outline" size={20} color="#8B4513" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Favorite Cafes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start exploring cafes and save your favorites to see them here!
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push("/(mainUsers)/findCafes")}
      >
        <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
        <Text style={styles.exploreButtonText}>Explore Cafes</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerTitle: "My Favorites",
            headerBackTitle: "Dashboard",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: `My Favorites${
            wishlist.length > 0 ? ` (${wishlist.length})` : ""
          }`,
          headerBackTitle: "Dashboard",
        }}
      />

      {wishlist.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadWishlist(true)}
              colors={["#8B4513"]}
              tintColor="#8B4513"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Favorite Cafes</Text>
            <Text style={styles.headerSubtitle}>
              {wishlist.length} cafe{wishlist.length !== 1 ? "s" : ""} saved
            </Text>
          </View>

          <View style={styles.wishlistContainer}>
            {wishlist.map(renderWishlistItem)}
          </View>
        </ScrollView>
      )}

      <BottomTabBar />

      {/* Toast for feedback */}
      <Toast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
        action={errorState.toast.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8B4513",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Account for bottom tab bar
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE2",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#321E0E",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#8B4513",
  },
  wishlistContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  wishlistItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
    padding: 16,
  },
  wishlistItemDeleting: {
    opacity: 0.6,
  },
  imageContainer: {
    position: "relative",
    marginRight: 16,
  },
  cafeImage: {
    width: 120,
    height: 90,
    borderRadius: 12,
  },
  favoriteIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cafeInfo: {
    flex: 1,
    marginRight: 12,
  },
  cafeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#321E0E",
    marginBottom: 6,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cafeAddress: {
    fontSize: 14,
    color: "#8B4513",
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  cafeDescription: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
    marginBottom: 8,
  },
  addedDate: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
  },
  actionContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    width: 44,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 69, 19, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100, // Account for bottom tab bar
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#8B4513",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
});
