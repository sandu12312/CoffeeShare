import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface UserTransaction {
  id: string;
  partnerId: string;
  partnerEmail: string;
  partnerName: string;
  cafeId: string;
  cafeName: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  qrTokenId: string;
  beansUsed: number;
  earningsRon: number;
  scannedAt: Timestamp;
  date: string; // YYYY-MM-DD format
  tokenType: "instant" | "checkout";
  items?: Array<{
    productName: string;
    quantity: number;
    beansValue: number;
  }>;
}

class UserTransactionsService {
  /**
   * Get user transactions (recent activity for dashboard)
   */
  async getUserTransactions(
    userId: string,
    limitCount: number = 10
  ): Promise<UserTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        orderBy("scannedAt", "desc"),
        limit(limitCount)
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions: UserTransaction[] = [];

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          scannedAt: data.scannedAt,
        } as UserTransaction);
      });

      return transactions;
    } catch (error) {
      console.error("Error getting user transactions:", error);
      throw error;
    }
  }

  /**
   * Get all user transactions (for full history modal)
   */
  async getAllUserTransactions(userId: string): Promise<UserTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        orderBy("scannedAt", "desc")
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions: UserTransaction[] = [];

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          scannedAt: data.scannedAt,
        } as UserTransaction);
      });

      return transactions;
    } catch (error) {
      console.error("Error getting all user transactions:", error);
      throw error;
    }
  }

  /**
   * Format transaction for display
   */
  formatTransactionForDisplay(transaction: UserTransaction, t: Function) {
    const beansUsed = transaction.beansUsed;
    const tokenType = transaction.tokenType;

    // Determine transaction type and description
    let transactionDescription = "";
    let transactionIcon = "cafe-outline";

    if (tokenType === "checkout") {
      if (transaction.items && transaction.items.length > 0) {
        const itemNames = transaction.items
          .map((item) => `${item.quantity}x ${item.productName}`)
          .join(", ");
        transactionDescription = `Checkout: ${itemNames} - ${beansUsed} beans`;
      } else {
        transactionDescription = `Checkout Order - ${beansUsed} beans`;
      }
      transactionIcon = "cart-outline";
    } else {
      transactionDescription = `Coffee Redemption - ${beansUsed} bean${
        beansUsed > 1 ? "s" : ""
      }`;
      transactionIcon = "cafe-outline";
    }

    return {
      id: transaction.id,
      cafe: transaction.cafeName,
      date: this.formatDate(transaction.scannedAt.toDate(), true),
      beansUsed,
      tokenType,
      transactionDescription,
      transactionIcon,
      qrTokenId: transaction.qrTokenId
        ? transaction.qrTokenId.substring(0, 8) + "..."
        : null,
      items: transaction.items,
    };
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date, includeTime: boolean = false): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      return date.toLocaleDateString("en-US", options);
    }
  }
}

const userTransactionsService = new UserTransactionsService();
export default userTransactionsService;
