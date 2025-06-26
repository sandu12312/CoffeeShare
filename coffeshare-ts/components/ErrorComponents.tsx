import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Componenta Toast Message
export interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 3000,
  onHide,
  action,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Afișez toast-ul
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();

      // Ascund automat după durata specificată
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#4CAF50",
          iconName: "checkmark-circle" as const,
        };
      case "error":
        return {
          backgroundColor: "#FF4444",
          iconName: "close-circle" as const,
        };
      case "warning":
        return { backgroundColor: "#FF9800", iconName: "warning" as const };
      default:
        return {
          backgroundColor: "#2196F3",
          iconName: "information-circle" as const,
        };
    }
  };

  const { backgroundColor, iconName } = getToastStyle();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={iconName} size={24} color="white" />
        <Text style={styles.toastText}>{message}</Text>
        {action && (
          <TouchableOpacity
            style={styles.toastAction}
            onPress={() => {
              action.onPress();
              hideToast();
            }}
          >
            <Text style={styles.toastActionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={hideToast} style={styles.toastClose}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Componenta Modal Eroare
export interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "error" | "warning" | "success" | "info";
  onDismiss: () => void;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title,
  message,
  type = "error",
  onDismiss,
  primaryAction,
  secondaryAction,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getModalStyle = () => {
    switch (type) {
      case "success":
        return { iconName: "checkmark-circle" as const, iconColor: "#4CAF50" };
      case "error":
        return { iconName: "close-circle" as const, iconColor: "#FF4444" };
      case "warning":
        return { iconName: "warning" as const, iconColor: "#FF9800" };
      default:
        return {
          iconName: "information-circle" as const,
          iconColor: "#2196F3",
        };
    }
  };

  const { iconName, iconColor } = getModalStyle();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          <View style={styles.modalHeader}>
            <Ionicons name={iconName} size={60} color={iconColor} />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>

          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalActions}>
            {secondaryAction && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  secondaryAction.onPress();
                  onDismiss();
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>
                  {secondaryAction.label}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => {
                primaryAction?.onPress();
                onDismiss();
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>
                {primaryAction?.label || "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Componenta Snackbar
export interface SnackbarProps {
  visible: boolean;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
  onDismiss: () => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  action,
  duration = 4000,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        hideSnackbar();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideSnackbar = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.snackbarContainer, { transform: [{ translateY }] }]}
    >
      <Text style={styles.snackbarText}>{message}</Text>
      {action && (
        <TouchableOpacity
          style={styles.snackbarAction}
          onPress={() => {
            action.onPress();
            hideSnackbar();
          }}
        >
          <Text style={styles.snackbarActionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// Componenta Banner Eroare
export interface ErrorBannerProps {
  visible: boolean;
  message: string;
  type?: "error" | "warning" | "info";
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  visible,
  message,
  type = "error",
  onDismiss,
  action,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const hideBanner = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const getBannerStyle = () => {
    switch (type) {
      case "error":
        return { backgroundColor: "#FF4444", iconName: "warning" as const };
      case "warning":
        return { backgroundColor: "#FF9800", iconName: "warning" as const };
      default:
        return { backgroundColor: "#2196F3", iconName: "information" as const };
    }
  };

  const { backgroundColor, iconName } = getBannerStyle();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        { backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.bannerContent}>
        <Ionicons name={iconName} size={20} color="white" />
        <Text style={styles.bannerText}>{message}</Text>

        <View style={styles.bannerActions}>
          {action && (
            <TouchableOpacity
              style={styles.bannerAction}
              onPress={action.onPress}
            >
              <Text style={styles.bannerActionText}>{action.label}</Text>
            </TouchableOpacity>
          )}

          {onDismiss && (
            <TouchableOpacity onPress={hideBanner} style={styles.bannerClose}>
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Stiluri Toast
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 30,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginLeft: 12,
  },
  toastAction: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  toastActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  toastClose: {
    padding: 4,
    marginLeft: 8,
  },

  // Stiluri Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  modalButtonPrimary: {
    backgroundColor: "#8B4513",
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#8B4513",
  },
  modalButtonTextPrimary: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modalButtonTextSecondary: {
    color: "#8B4513",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  // Stiluri Snackbar
  snackbarContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  snackbarText: {
    color: "white",
    fontSize: 16,
    flex: 1,
  },
  snackbarAction: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  snackbarActionText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
  },

  // Stiluri Banner
  bannerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  bannerActionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  bannerClose: {
    padding: 4,
  },
});
