import { useState, useCallback } from "react";

export interface ErrorState {
  toast: {
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
    action?: {
      label: string;
      onPress: () => void;
    };
  };
  modal: {
    visible: boolean;
    title: string;
    message: string;
    type: "error" | "warning" | "success" | "info";
    primaryAction?: {
      label: string;
      onPress: () => void;
    };
    secondaryAction?: {
      label: string;
      onPress: () => void;
    };
  };
  snackbar: {
    visible: boolean;
    message: string;
    action?: {
      label: string;
      onPress: () => void;
    };
  };
  banner: {
    visible: boolean;
    message: string;
    type: "error" | "warning" | "info";
    action?: {
      label: string;
      onPress: () => void;
    };
  };
}

const initialState: ErrorState = {
  toast: {
    visible: false,
    message: "",
    type: "info",
  },
  modal: {
    visible: false,
    title: "",
    message: "",
    type: "error",
  },
  snackbar: {
    visible: false,
    message: "",
  },
  banner: {
    visible: false,
    message: "",
    type: "error",
  },
};

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>(initialState);

  // Toast methods
  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "warning" | "info" = "info",
      action?: { label: string; onPress: () => void }
    ) => {
      setErrorState((prev) => ({
        ...prev,
        toast: {
          visible: true,
          message,
          type,
          action,
        },
      }));
    },
    []
  );

  const hideToast = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      toast: { ...prev.toast, visible: false },
    }));
  }, []);

  // Modal methods
  const showModal = useCallback(
    (
      title: string,
      message: string,
      type: "error" | "warning" | "success" | "info" = "error",
      primaryAction?: { label: string; onPress: () => void },
      secondaryAction?: { label: string; onPress: () => void }
    ) => {
      setErrorState((prev) => ({
        ...prev,
        modal: {
          visible: true,
          title,
          message,
          type,
          primaryAction,
          secondaryAction,
        },
      }));
    },
    []
  );

  const hideModal = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      modal: { ...prev.modal, visible: false },
    }));
  }, []);

  // Snackbar methods
  const showSnackbar = useCallback(
    (message: string, action?: { label: string; onPress: () => void }) => {
      setErrorState((prev) => ({
        ...prev,
        snackbar: {
          visible: true,
          message,
          action,
        },
      }));
    },
    []
  );

  const hideSnackbar = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      snackbar: { ...prev.snackbar, visible: false },
    }));
  }, []);

  // Banner methods
  const showBanner = useCallback(
    (
      message: string,
      type: "error" | "warning" | "info" = "error",
      action?: { label: string; onPress: () => void }
    ) => {
      setErrorState((prev) => ({
        ...prev,
        banner: {
          visible: true,
          message,
          type,
          action,
        },
      }));
    },
    []
  );

  const hideBanner = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      banner: { ...prev.banner, visible: false },
    }));
  }, []);

  // Convenience methods for common use cases
  const showSuccess = useCallback(
    (message: string, action?: { label: string; onPress: () => void }) => {
      showToast(message, "success", action);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, action?: { label: string; onPress: () => void }) => {
      showToast(message, "error", action);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, action?: { label: string; onPress: () => void }) => {
      showToast(message, "warning", action);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, action?: { label: string; onPress: () => void }) => {
      showToast(message, "info", action);
    },
    [showToast]
  );

  const showErrorModal = useCallback(
    (
      title: string,
      message: string,
      primaryAction?: { label: string; onPress: () => void },
      secondaryAction?: { label: string; onPress: () => void }
    ) => {
      showModal(title, message, "error", primaryAction, secondaryAction);
    },
    [showModal]
  );

  const showSuccessModal = useCallback(
    (
      title: string,
      message: string,
      primaryAction?: { label: string; onPress: () => void },
      secondaryAction?: { label: string; onPress: () => void }
    ) => {
      showModal(title, message, "success", primaryAction, secondaryAction);
    },
    [showModal]
  );

  const showConfirmModal = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      showModal(
        title,
        message,
        "warning",
        { label: "Confirm", onPress: onConfirm },
        { label: "Cancel", onPress: onCancel || (() => {}) }
      );
    },
    [showModal]
  );

  const showNetworkError = useCallback(() => {
    showBanner(
      "No internet connection. Please check your network settings.",
      "error",
      { label: "Retry", onPress: () => window.location.reload() }
    );
  }, [showBanner]);

  const showUndoSnackbar = useCallback(
    (message: string, onUndo: () => void) => {
      showSnackbar(message, { label: "Undo", onPress: onUndo });
    },
    [showSnackbar]
  );

  return {
    errorState,
    // Toast methods
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    // Modal methods
    showModal,
    hideModal,
    showErrorModal,
    showSuccessModal,
    showConfirmModal,
    // Snackbar methods
    showSnackbar,
    hideSnackbar,
    showUndoSnackbar,
    // Banner methods
    showBanner,
    hideBanner,
    showNetworkError,
  };
};
