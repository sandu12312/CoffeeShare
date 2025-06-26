import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import globalStatisticsService from "./globalStatisticsService";

interface StatisticsUpdateTrigger {
  collection: string;
  updateType: "create" | "update" | "delete" | "all";
  debounceMs?: number;
}

class StatisticsUpdateService {
  private updateTriggers: StatisticsUpdateTrigger[] = [
    // Trigger-e legate de utilizatori
    { collection: "users", updateType: "all", debounceMs: 5000 },
    { collection: "admins", updateType: "all", debounceMs: 5000 },
    { collection: "partners", updateType: "all", debounceMs: 5000 },
    {
      collection: "pendingPartnerRegistrations",
      updateType: "all",
      debounceMs: 5000,
    },

    // Trigger-e legate de business
    { collection: "cafes", updateType: "all", debounceMs: 3000 },
    { collection: "products", updateType: "all", debounceMs: 10000 },

    // Trigger-e legate de tranzacții
    { collection: "transactions", updateType: "all", debounceMs: 1000 },
    { collection: "userSubscriptions", updateType: "all", debounceMs: 2000 },
    { collection: "userActivities", updateType: "all", debounceMs: 3000 },

    // Trigger-e legate de coș
    { collection: "userCarts", updateType: "all", debounceMs: 5000 },
  ];

  private listeners: Array<() => void> = [];
  private updateTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isActive = false;

  /**
   * Încep să ascult modificările colecțiilor
   */
  startListening(): void {
    if (this.isActive) {
      console.log("📊 Statistics update service is already active");
      return;
    }

    console.log("🔄 Starting statistics update service...");
    this.isActive = true;

    this.updateTriggers.forEach((trigger) => {
      this.setupCollectionListener(trigger);
    });

    console.log(
      `✅ Statistics update service started with ${this.updateTriggers.length} triggers`
    );
  }

  /**
   * Opresc toți ascultătorii
   */
  stopListening(): void {
    if (!this.isActive) {
      return;
    }

    console.log("⏹️ Stopping statistics update service...");

    // Șterg toți ascultătorii
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners = [];

    // Șterg toate timeout-urile
    this.updateTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.updateTimeouts.clear();

    this.isActive = false;
    console.log("✅ Statistics update service stopped");
  }

  /**
   * Configurez ascultătorul pentru o colecție specifică
   */
  private setupCollectionListener(trigger: StatisticsUpdateTrigger): void {
    try {
      const unsubscribe = onSnapshot(
        collection(db, trigger.collection),
        (snapshot) => {
          // Declanșez actualizări doar dacă există modificări reale
          if (snapshot.docChanges().length > 0) {
            console.log(
              `📊 Changes detected in ${trigger.collection}, scheduling statistics update`
            );
            this.scheduleStatisticsUpdate(trigger);
          }
        },
        (error) => {
          console.warn(`⚠️ Error listening to ${trigger.collection}:`, error);
          // Continui să ascult la alte colecții chiar dacă una eșuează
        }
      );

      this.listeners.push(unsubscribe);
    } catch (error) {
      console.warn(
        `⚠️ Failed to setup listener for ${trigger.collection}:`,
        error
      );
    }
  }

  /**
   * Programez o actualizare de statistici cu debounce
   */
  private scheduleStatisticsUpdate(trigger: StatisticsUpdateTrigger): void {
    const key = trigger.collection;
    const debounceMs = trigger.debounceMs || 3000;

    // Șterg timeout-ul existent pentru această colecție
    if (this.updateTimeouts.has(key)) {
      clearTimeout(this.updateTimeouts.get(key)!);
    }

    // Programez actualizarea nouă
    const timeout = setTimeout(async () => {
      try {
        console.log(
          `🔄 Updating statistics due to changes in ${trigger.collection}`
        );
        await globalStatisticsService.calculateAndUpdateGlobalStatistics();
        this.updateTimeouts.delete(key);
      } catch (error) {
        console.error(
          `❌ Failed to update statistics for ${trigger.collection}:`,
          error
        );
      }
    }, debounceMs);

    this.updateTimeouts.set(key, timeout);
  }

  /**
   * Declanșez manual o actualizare de statistici
   */
  async triggerUpdate(): Promise<void> {
    try {
      console.log("🔄 Manually triggering statistics update...");
      await globalStatisticsService.calculateAndUpdateGlobalStatistics();
      console.log("✅ Manual statistics update completed");
    } catch (error) {
      console.error("❌ Manual statistics update failed:", error);
      throw error;
    }
  }

  /**
   * Adaug un trigger personalizat
   */
  addTrigger(trigger: StatisticsUpdateTrigger): void {
    if (this.updateTriggers.some((t) => t.collection === trigger.collection)) {
      console.warn(`Trigger for ${trigger.collection} already exists`);
      return;
    }

    this.updateTriggers.push(trigger);

    if (this.isActive) {
      this.setupCollectionListener(trigger);
    }

    console.log(`➕ Added statistics trigger for ${trigger.collection}`);
  }

  /**
   * Elimin un trigger
   */
  removeTrigger(collectionName: string): void {
    const index = this.updateTriggers.findIndex(
      (t) => t.collection === collectionName
    );
    if (index === -1) {
      console.warn(`No trigger found for ${collectionName}`);
      return;
    }

    this.updateTriggers.splice(index, 1);

    // Șterg orice timeout în așteptare pentru această colecție
    if (this.updateTimeouts.has(collectionName)) {
      clearTimeout(this.updateTimeouts.get(collectionName)!);
      this.updateTimeouts.delete(collectionName);
    }

    console.log(`➖ Removed statistics trigger for ${collectionName}`);
  }

  /**
   * Obțin status-ul curent
   */
  getStatus(): {
    isActive: boolean;
    triggerCount: number;
    pendingUpdates: string[];
  } {
    return {
      isActive: this.isActive,
      triggerCount: this.updateTriggers.length,
      pendingUpdates: Array.from(this.updateTimeouts.keys()),
    };
  }

  /**
   * Forțez actualizarea statisticilor imediat (ocolesc debouncing-ul)
   */
  async forceUpdate(): Promise<void> {
    // Șterg toate timeout-urile în așteptare
    this.updateTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.updateTimeouts.clear();

    // Declanșez actualizarea imediată
    await this.triggerUpdate();
  }

  /**
   * Actualizez batch metadatele statisticilor (pentru operații complexe)
   */
  async batchUpdateStatisticsMetadata(
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const statsRef = doc(db, "globalStatistics", "global");

      // Adaug timestamp-ul lastManualUpdate
      batch.set(
        statsRef,
        {
          ...updates,
          lastManualUpdate: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      console.log("✅ Statistics metadata updated");
    } catch (error) {
      console.error("❌ Failed to update statistics metadata:", error);
      throw error;
    }
  }
}

export const statisticsUpdateService = new StatisticsUpdateService();
export default statisticsUpdateService;
