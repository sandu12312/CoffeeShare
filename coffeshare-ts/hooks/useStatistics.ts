import { useEffect, useState } from "react";
import globalStatisticsService, {
  GlobalStatistics,
} from "../services/globalStatisticsService";

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<GlobalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize the statistics service
        await globalStatisticsService.initialize();

        // Get initial statistics
        const initialStats =
          await globalStatisticsService.getGlobalStatistics();
        setStatistics(initialStats);

        // Subscribe to real-time updates
        unsubscribe = globalStatisticsService.subscribeToGlobalStatistics(
          (stats) => {
            setStatistics(stats);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error initializing statistics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    initializeStatistics();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const refreshStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const refreshedStats = await globalStatisticsService.refreshStatistics();
      setStatistics(refreshedStats);
      return refreshedStats;
    } catch (err) {
      console.error("Error refreshing statistics:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh statistics"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    statistics,
    loading,
    error,
    refreshStatistics,
  };
};

export default useStatistics;
