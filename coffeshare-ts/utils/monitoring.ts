import * as Sentry from "@sentry/react-native";
import { Platform } from "react-native";
import { DeviceSecurity, SecurityReport } from "./deviceSecurity";

export interface SecurityEvent {
  type:
    | "security_threat"
    | "suspicious_activity"
    | "unauthorized_access"
    | "data_breach";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

export class SecurityMonitoring {
  private static isInitialized = false;

  // ✅ DSN automatically configured by Sentry wizard
  private static readonly SENTRY_DSN =
    "https://9e95d16c980d636c8547f27f44d3f2d5@o4509464757010432.ingest.de.sentry.io/4509464767758416";

  /**
   * Initialize Sentry monitoring
   */
  static initializeMonitoring(): void {
    if (this.isInitialized) return;

    try {
      // Sentry is already initialized by the wizard in _layout.tsx
      // We just set up our security monitoring context
      this.isInitialized = true;
      console.log(
        "✅ Security monitoring initialized (using Sentry wizard config)"
      );
    } catch (error) {
      console.error("❌ Failed to initialize monitoring:", error);
    }
  }

  /**
   * Log security event
   */
  static logSecurityEvent(event: SecurityEvent): void {
    try {
      // Always log to console for development
      console.warn(
        `🚨 Security Event [${event.severity.toUpperCase()}]:`,
        event.message
      );

      // Sentry is already configured by wizard

      // Log to Sentry
      Sentry.addBreadcrumb({
        message: event.message,
        level: this.mapSeverityToSentryLevel(event.severity),
        category: "security",
        data: {
          type: event.type,
          severity: event.severity,
          userId: event.userId,
          timestamp: event.timestamp.toISOString(),
          ...event.metadata,
        },
      });

      // For critical events, capture as exception
      if (event.severity === "critical") {
        Sentry.captureException(
          new Error(`CRITICAL SECURITY EVENT: ${event.message}`),
          {
            tags: {
              security_event: event.type,
              severity: event.severity,
            },
            extra: event.metadata,
          }
        );
      }
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Log device security report
   */
  static logSecurityReport(report: SecurityReport, userId?: string): void {
    try {
      const event: SecurityEvent = {
        type: "security_threat",
        severity: report.isSecure ? "low" : "high",
        message: report.isSecure
          ? "Device security check passed"
          : `Device security threats detected: ${report.threats.length}`,
        metadata: {
          isSecure: report.isSecure,
          threatsCount: report.threats.length,
          threats: report.threats,
          deviceInfo: report.deviceInfo,
        },
        userId,
        timestamp: new Date(),
      };

      this.logSecurityEvent(event);
    } catch (error) {
      console.error("Failed to log security report:", error);
    }
  }

  /**
   * Log suspicious network activity
   */
  static logSuspiciousNetworkActivity(
    url: string,
    reason: string,
    userId?: string
  ): void {
    const event: SecurityEvent = {
      type: "suspicious_activity",
      severity: "medium",
      message: `Suspicious network activity detected: ${reason}`,
      metadata: {
        url,
        reason,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      },
      userId,
      timestamp: new Date(),
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log unauthorized access attempt
   */
  static logUnauthorizedAccess(action: string, userId?: string): void {
    const event: SecurityEvent = {
      type: "unauthorized_access",
      severity: "high",
      message: `Unauthorized access attempt: ${action}`,
      metadata: {
        action,
        platform: Platform.OS,
      },
      userId,
      timestamp: new Date(),
    };

    this.logSecurityEvent(event);
  }

  /**
   * Set user context for monitoring
   */
  static setUser(userId: string, email?: string): void {
    try {
      Sentry.setUser({
        id: userId,
        email: email || undefined,
      });
    } catch (error) {
      console.error("Failed to set user context:", error);
    }
  }

  /**
   * Clear user context
   */
  static clearUser(): void {
    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error("Failed to clear user context:", error);
    }
  }

  /**
   * Capture error with context
   */
  static captureError(error: Error, context?: Record<string, any>): void {
    try {
      console.error("Security Error:", error);

      Sentry.captureException(error, {
        extra: context,
      });
    } catch (sentryError) {
      console.error("Failed to capture error:", sentryError);
    }
  }

  /**
   * Filter sensitive data from Sentry events
   */
  private static filterSensitiveData(event: any): any {
    if (!event) return event;

    const sensitiveKeys = [
      "password",
      "token",
      "auth",
      "secret",
      "key",
      "credential",
      "authorization",
      "bearer",
      "cookie",
      "session",
    ];

    // Recursively filter sensitive data
    const filterObject = (obj: any): any => {
      if (!obj || typeof obj !== "object") return obj;

      if (Array.isArray(obj)) {
        return obj.map(filterObject);
      }

      const filtered: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowercaseKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some((sensitive) =>
          lowercaseKey.includes(sensitive)
        );

        if (isSensitive) {
          filtered[key] = "[FILTERED]";
        } else {
          filtered[key] = filterObject(value);
        }
      }
      return filtered;
    };

    return filterObject(event);
  }

  /**
   * Filter sensitive breadcrumbs
   */
  private static filterSensitiveBreadcrumb(breadcrumb: any): any {
    if (!breadcrumb) return breadcrumb;

    // Filter auth related breadcrumbs
    if (
      breadcrumb.category === "auth" ||
      breadcrumb.category === "authentication"
    ) {
      return null;
    }

    // Filter network requests with sensitive data
    if (breadcrumb.category === "http" && breadcrumb.data) {
      const url = breadcrumb.data.url || "";
      if (
        url.includes("auth") ||
        url.includes("login") ||
        url.includes("password")
      ) {
        breadcrumb.data = { ...breadcrumb.data, url: "[FILTERED_URL]" };
      }
    }

    return breadcrumb;
  }

  /**
   * Map severity to Sentry level
   */
  private static mapSeverityToSentryLevel(
    severity: string
  ): Sentry.SeverityLevel {
    switch (severity) {
      case "low":
        return "info";
      case "medium":
        return "warning";
      case "high":
        return "error";
      case "critical":
        return "fatal";
      default:
        return "info";
    }
  }

  /**
   * Get monitoring statistics
   */
  static getMonitoringStats(): any {
    return {
      isInitialized: this.isInitialized,
      hasDSN: true,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };
  }
}
