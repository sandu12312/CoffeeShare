/**
 * Formats a date or timestamp into a readable string
 * @param timestamp Firebase timestamp or Date object
 * @param includeTime Whether to include time in the formatted string
 * @returns Formatted date string
 */
export const formatDate = (
  timestamp: any,
  includeTime: boolean = false
): string => {
  if (!timestamp) return "N/A";

  try {
    // Handle Firebase timestamp or seconds timestamp
    const date = timestamp.toDate
      ? timestamp.toDate()
      : timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(includeTime && {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Get time elapsed since a given date
 * @param timestamp Firebase timestamp or Date object
 * @returns String representing elapsed time (e.g., "2 days ago", "Just now")
 */
export const getTimeAgo = (timestamp: any): string => {
  if (!timestamp) return "";

  try {
    const date = timestamp.toDate
      ? timestamp.toDate()
      : timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

    return formatDate(timestamp, false);
  } catch (error) {
    console.error("Error calculating time ago:", error);
    return "Unknown time";
  }
};
