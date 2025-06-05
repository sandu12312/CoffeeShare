import { useState, useEffect, useCallback } from "react";
import { authService, AuthUser, AuthState } from "../services/authService";
import { UserRole } from "../services/roleManagementService";

/**
 * Enhanced Auth Hook with Role-Based Collections Support
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.addAuthStateListener((user) => {
      setAuthState((prev) => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * Sign in user
   */
  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        await authService.signIn(email, password);
        // User state will be updated via the listener
      } catch (error: any) {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to sign in",
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Sign out user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      await authService.signOut();
      // User state will be updated via the listener
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to sign out",
      }));
      throw error;
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (data: {
      displayName?: string;
      photoURL?: string;
    }): Promise<void> => {
      try {
        await authService.updateUserProfile(data);
        // Refresh user data
        const refreshedUser = await authService.refreshUser();
        setAuthState((prev) => ({ ...prev, user: refreshedUser }));
      } catch (error: any) {
        setAuthState((prev) => ({
          ...prev,
          error: error.message || "Failed to update profile",
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Refresh current user data
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const refreshedUser = await authService.refreshUser();
      setAuthState((prev) => ({ ...prev, user: refreshedUser }));
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        error: error.message || "Failed to refresh user",
      }));
    }
  }, []);

  /**
   * Clear auth error
   */
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  // Role checking functions
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return authState.user?.role === role;
    },
    [authState.user]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!authState.user) return false;
      return roles.includes(authState.user.role);
    },
    [authState.user]
  );

  const isAdmin = useCallback((): boolean => {
    return hasRole("admin");
  }, [hasRole]);

  const isPartner = useCallback((): boolean => {
    return hasRole("partner");
  }, [hasRole]);

  const isUser = useCallback((): boolean => {
    return hasRole("user");
  }, [hasRole]);

  const isAuthenticated = useCallback((): boolean => {
    return !!authState.user && authState.user.isActive;
  }, [authState.user]);

  const isVerifiedPartner = useCallback((): boolean => {
    return (
      isPartner() && authState.user?.userData?.verificationStatus === "verified"
    );
  }, [isPartner, authState.user]);

  const getAdminAccessLevel = useCallback((): "super" | "standard" | null => {
    if (!isAdmin()) return null;
    return authState.user?.userData?.accessLevel || "standard";
  }, [isAdmin, authState.user]);

  const getUserPermissions = useCallback((): string[] => {
    if (!isAdmin()) return [];
    return authState.user?.userData?.permissions || ["read"];
  }, [isAdmin, authState.user]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      const permissions = getUserPermissions();
      return permissions.includes(permission);
    },
    [getUserPermissions]
  );

  return {
    // State
    ...authState,

    // Actions
    signIn,
    signOut,
    updateProfile,
    refreshUser,
    clearError,

    // Role checking
    hasRole,
    hasAnyRole,
    isAdmin,
    isPartner,
    isUser,
    isAuthenticated,
    isVerifiedPartner,

    // Admin specific
    getAdminAccessLevel,
    getUserPermissions,
    hasPermission,

    // Utility
    userRole: authState.user?.role || null,
    userCollection: authState.user?.collection || null,
  };
};

export default useAuth;
