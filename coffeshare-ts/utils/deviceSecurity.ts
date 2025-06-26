import { Platform } from "react-native";
import CryptoJS from "crypto-js";
import { getDeviceInfo, isExpoGo } from "./expoGoUtils";

export interface SecurityThreat {
  type: "root" | "jailbreak" | "emulator" | "debug" | "tamper";
  detected: boolean;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
}

export interface SecurityReport {
  isSecure: boolean;
  threats: SecurityThreat[];
  deviceInfo: {
    isEmulator: boolean;
    isRooted: boolean;
    hasGenymotion: boolean;
    hasXposed: boolean;
  };
}

export class DeviceSecurity {
  private static readonly APP_HASH = "coffeshare_security_hash_2024"; // Schimb asta cu hash-ul aplicației tale
  private static securityReport: SecurityReport | null = null;

  /**
   * Verificare de securitate comprehensivă
   */
  static async performSecurityCheck(): Promise<SecurityReport> {
    const threats: SecurityThreat[] = [];

    // Verific pentru emulator
    const isEmulator = await this.isEmulatorDetected();
    if (isEmulator) {
      threats.push({
        type: "emulator",
        detected: true,
        severity: "high",
        message: "Application is running on an emulator",
      });
    }

    // Verific pentru root/jailbreak
    const isRooted = await this.isDeviceCompromised();
    if (isRooted) {
      threats.push({
        type: Platform.OS === "ios" ? "jailbreak" : "root",
        detected: true,
        severity: "critical",
        message: `Device is ${Platform.OS === "ios" ? "jailbroken" : "rooted"}`,
      });
    }

    // Verific pentru debugging
    const isDebugging = await this.isDebuggingDetected();
    if (isDebugging) {
      threats.push({
        type: "debug",
        detected: true,
        severity: "medium",
        message: "Debugging tools detected",
      });
    }

    // Verificări adiționale pentru Android
    let hasGenymotion = false;
    let hasXposed = false;

    if (Platform.OS === "android") {
      hasGenymotion = await this.hasGenymotionDetected();

      if (hasGenymotion) {
        threats.push({
          type: "emulator",
          detected: true,
          severity: "high",
          message: "Genymotion emulator detected",
        });
      }
    }

    const report: SecurityReport = {
      isSecure: threats.length === 0,
      threats,
      deviceInfo: {
        isEmulator,
        isRooted,
        hasGenymotion,
        hasXposed,
      },
    };

    this.securityReport = report;
    return report;
  }

  /**
   * Verific dacă rulează pe emulator
   */
  private static async isEmulatorDetected(): Promise<boolean> {
    try {
      const DeviceInfo = getDeviceInfo();
      return await DeviceInfo.isEmulator();
    } catch (error) {
      return false;
    }
  }

  /**
   * Verific dacă dispozitivul este compromis (rooted/jailbroken)
   */
  private static async isDeviceCompromised(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const DeviceInfo = getDeviceInfo();
        const buildTags = await DeviceInfo.getBuildNumber();
        return buildTags?.includes("test-keys") || false;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verific pentru instrumente de debugging
   */
  private static async isDebuggingDetected(): Promise<boolean> {
    return __DEV__;
  }

  /**
   * Verific pentru emulatorul Genymotion (Android)
   */
  private static async hasGenymotionDetected(): Promise<boolean> {
    try {
      const DeviceInfo = getDeviceInfo();
      // Folosesc getModel pentru că getManufacturer nu există în fallback-ul nostru
      const model = await DeviceInfo.getModel();
      return model.toLowerCase().includes("genymotion");
    } catch (error) {
      return false;
    }
  }

  /**
   * Obțin raportul de securitate curent
   */
  static getSecurityReport(): SecurityReport | null {
    return this.securityReport;
  }

  /**
   * Verific dacă funcționalitățile critice ar trebui dezactivate
   */
  static shouldDisableCriticalFeatures(): boolean {
    if (!this.securityReport) {
      return true; // Dezactivez dacă nu s-a efectuat verificarea de securitate
    }

    const criticalThreats = this.securityReport.threats.filter(
      (threat) => threat.severity === "critical" && threat.detected
    );

    return criticalThreats.length > 0;
  }

  /**
   * Verific dacă scanarea QR ar trebui permisă
   */
  static shouldAllowQRScanning(): boolean {
    if (!this.securityReport) {
      return false;
    }

    const highRiskThreats = this.securityReport.threats.filter(
      (threat) =>
        ["critical", "high"].includes(threat.severity) && threat.detected
    );

    return highRiskThreats.length === 0;
  }

  /**
   * Obțin mesajul de avertizare pentru securitate
   */
  static getSecurityWarning(): string | null {
    if (!this.securityReport || this.securityReport.isSecure) {
      return null;
    }

    const criticalThreats = this.securityReport.threats.filter(
      (threat) => threat.severity === "critical" && threat.detected
    );

    if (criticalThreats.length > 0) {
      return "Critical security risk detected. Some features have been disabled for your protection.";
    }

    const highThreats = this.securityReport.threats.filter(
      (threat) => threat.severity === "high" && threat.detected
    );

    if (highThreats.length > 0) {
      return "Security risk detected. Please ensure you are using the app on a secure device.";
    }

    return "Minor security concerns detected. Please be cautious while using the app.";
  }
}
