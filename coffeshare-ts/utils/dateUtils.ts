/**
 * Formatez o dată sau timestamp într-un string lizibil
 * @param timestamp Firebase timestamp sau obiect Date
 * @param includeTime Dacă să includ timpul în string-ul formatat
 * @returns String-ul datei formatate
 */
export const formatDate = (
  timestamp: any,
  includeTime: boolean = false
): string => {
  if (!timestamp) return "N/A";

  try {
    // Gestionez Firebase timestamp sau timestamp în secunde
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
 * Obțin timpul scurs de la o dată dată
 * @param timestamp Firebase timestamp sau obiect Date
 * @returns String reprezentând timpul scurs (ex: "acum 2 zile", "Acum")
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
