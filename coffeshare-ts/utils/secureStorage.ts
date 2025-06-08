import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Security configuration for different platforms
const SECURITY_OPTIONS = {
  android: {
    requireAuthentication: false,
    showModal: false,
    kLocalizedFallbackTitle: "Please use your passcode",
  },
  ios: {
    requireAuthentication: false,
    showModal: false,
    kLocalizedFallbackTitle: "Please use your passcode",
  },
};

export class SecureStorage {
  /**
   * Store sensitive data securely
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const options =
        Platform.OS === "ios" ? SECURITY_OPTIONS.ios : SECURITY_OPTIONS.android;
      await SecureStore.setItemAsync(key, value, options);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw new Error(`Failed to store ${key} securely`);
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const options =
        Platform.OS === "ios" ? SECURITY_OPTIONS.ios : SECURITY_OPTIONS.android;
      return await SecureStore.getItemAsync(key, options);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw new Error(`Failed to remove ${key}`);
    }
  }

  /**
   * Check if key exists
   */
  static async hasItem(key: string): Promise<boolean> {
    try {
      const value = await this.getItem(key);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store authentication token
   */
  static async setAuthToken(token: string): Promise<void> {
    await this.setItem("auth_token", token);
  }

  /**
   * Get authentication token
   */
  static async getAuthToken(): Promise<string | null> {
    return await this.getItem("auth_token");
  }

  /**
   * Remove authentication token
   */
  static async removeAuthToken(): Promise<void> {
    await this.removeItem("auth_token");
  }

  /**
   * Store user credentials (encrypted)
   */
  static async setUserCredentials(
    userId: string,
    encryptedData: string
  ): Promise<void> {
    await this.setItem(`user_creds_${userId}`, encryptedData);
  }

  /**
   * Get user credentials
   */
  static async getUserCredentials(userId: string): Promise<string | null> {
    return await this.getItem(`user_creds_${userId}`);
  }

  /**
   * Store Firebase refresh token
   */
  static async setRefreshToken(token: string): Promise<void> {
    await this.setItem("firebase_refresh_token", token);
  }

  /**
   * Get Firebase refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    return await this.getItem("firebase_refresh_token");
  }

  /**
   * Clear all stored data (for logout)
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = ["auth_token", "firebase_refresh_token"];
      await Promise.all(keys.map((key) => this.removeItem(key)));
    } catch (error) {
      console.error("Error clearing all secure data:", error);
    }
  }

  /**
   * Store encrypted session data
   */
  static async setSessionData(sessionId: string, data: string): Promise<void> {
    await this.setItem(`session_${sessionId}`, data);
  }

  /**
   * Get session data
   */
  static async getSessionData(sessionId: string): Promise<string | null> {
    return await this.getItem(`session_${sessionId}`);
  }
}
