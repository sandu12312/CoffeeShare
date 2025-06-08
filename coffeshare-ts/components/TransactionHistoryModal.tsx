import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";
import userTransactionsService, {
  UserTransaction,
} from "../services/userTransactionsService";

interface TransactionHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

interface FormattedTransaction {
  id: string;
  cafe: string;
  date: string;
  beansUsed: number;
  tokenType: "instant" | "checkout";
  transactionDescription: string;
  transactionIcon: string;
  qrTokenId: string | null;
  items?: Array<{
    productName: string;
    quantity: number;
    beansValue: number;
  }>;
}

export default function TransactionHistoryModal({
  visible,
  onClose,
  userId,
}: TransactionHistoryModalProps) {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<FormattedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadTransactions();
    }
  }, [visible, userId]);

  const loadTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const userTransactions =
        await userTransactionsService.getAllUserTransactions(userId);

      const formattedTransactions = userTransactions.map((transaction) =>
        userTransactionsService.formatTransactionForDisplay(transaction, t)
      );

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error("Error loading transaction history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupTransactionsByDate = (transactions: FormattedTransaction[]) => {
    const grouped: { [date: string]: FormattedTransaction[] } = {};

    transactions.forEach((transaction) => {
      const dateKey = transaction.date.includes("ago")
        ? transaction.date
        : transaction.date.split(",")[0]; // Extract just the date part

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    return grouped;
  };

  const renderTransactionItem = ({ item }: { item: FormattedTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={item.transactionIcon as any}
          size={24}
          color="#8B4513"
        />
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.cafeName}>{item.cafe}</Text>
        <Text style={styles.transactionDescription}>
          {item.transactionDescription}
        </Text>

        {item.items && item.items.length > 0 && (
          <View style={styles.itemsContainer}>
            {item.items.map((product, index) => (
              <Text key={index} style={styles.itemText}>
                • {product.quantity}x {product.productName} (
                {product.beansValue} beans)
              </Text>
            ))}
          </View>
        )}

        {item.qrTokenId && (
          <Text style={styles.qrTokenId}>QR: {item.qrTokenId}</Text>
        )}

        <View style={styles.transactionFooter}>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.beansUsed}>
        <Text style={styles.beansUsedText}>{item.beansUsed}</Text>
        <Text style={styles.beansLabel}>beans</Text>
      </View>
    </View>
  );

  const renderSectionHeader = (
    date: string,
    transactions: FormattedTransaction[]
  ) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{date}</Text>
      <Text style={styles.sectionHeaderCount}>
        {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
      </Text>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading transaction history...</Text>
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#8B4513" />
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptyMessage}>
            Your checkout history will appear here after your first coffee
            purchase.
          </Text>
        </View>
      );
    }

    const groupedTransactions = groupTransactionsByDate(transactions);
    const sections = Object.entries(groupedTransactions);

    return (
      <FlatList
        data={sections}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTransactions(true)}
            colors={["#8B4513"]}
            tintColor="#8B4513"
          />
        }
        renderItem={({ item }) => {
          const [date, sectionTransactions] = item;
          return (
            <View style={styles.section}>
              {renderSectionHeader(date, sectionTransactions)}
              {sectionTransactions.map((transaction, index) => (
                <View key={transaction.id}>
                  {renderTransactionItem({ item: transaction })}
                  {index < sectionTransactions.length - 1 && (
                    <View style={styles.itemSeparator} />
                  )}
                </View>
              ))}
            </View>
          );
        }}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // Calculate summary statistics
  const totalTransactions = transactions.length;
  const totalBeansUsed = transactions.reduce(
    (sum, transaction) => sum + transaction.beansUsed,
    0
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#8B4513" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Transaction History</Text>
            <Text style={styles.headerSubtitle}>Complete checkout records</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Summary Statistics */}
        {!loading && transactions.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalTransactions}</Text>
              <Text style={styles.summaryLabel}>Total Orders</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalBeansUsed}</Text>
              <Text style={styles.summaryLabel}>Beans Used</Text>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>{renderContent()}</View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  headerSpacer: {
    width: 38, // Same width as close button for centering
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 15,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#8B4513",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B4513",
  },
  sectionHeaderCount: {
    fontSize: 12,
    color: "#666666",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8DC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  itemsContainer: {
    backgroundColor: "#F9F9F9",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 2,
  },
  qrTokenId: {
    fontSize: 12,
    color: "#8B4513",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionDate: {
    fontSize: 12,
    color: "#999999",
  },
  totalSpent: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B4513",
  },
  beansUsed: {
    alignItems: "center",
    minWidth: 50,
  },
  beansUsedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
  },
  beansLabel: {
    fontSize: 10,
    color: "#666666",
    marginTop: 2,
  },
  itemSeparator: {
    height: 8,
  },
});
