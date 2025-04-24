import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";

// Placeholder for charting libraries
// import { LineChart, PieChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

export default function GeneralStatisticsScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  // Dummy data for key metrics
  const keyMetrics = {
    totalUsers: 1234,
    activeCafes: 56,
    activeSubscriptions: 875,
    coffeesToday: 450, // Example metric
  };

  // Dummy data for charts (replace with actual data fetching and processing)
  const userGrowthData = {
    labels: ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun"],
    datasets: [{ data: [50, 150, 300, 550, 900, 1234] }],
  };
  const subscriptionDistributionData = [
    {
      name: "Student",
      count: 400,
      color: "#3F51B5",
      legendFontColor: "#7F7F7F",
      legendFontSize: 14,
    },
    {
      name: "Elite",
      count: 350,
      color: "#FF9800",
      legendFontColor: "#7F7F7F",
      legendFontSize: 14,
    },
    {
      name: "Premium",
      count: 125,
      color: "#E91E63",
      legendFontColor: "#7F7F7F",
      legendFontSize: 14,
    },
  ];

  return (
    <ScreenWrapper>
      {/* TODO: Add translation key 'generalStatisticsTitle' */}
      <CoffeePartnerHeader title={"Statistici Generale"} />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* TODO: Implement Date Range Selector */}
        <Text style={styles.dateRangeText}>Perioada: Ultimele 30 de zile</Text>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="people-circle-outline" size={30} color="#3F51B5" />
            <Text style={styles.metricValue}>{keyMetrics.totalUsers}</Text>
            {/* TODO: Translation key 'totalUsers' */}
            <Text style={styles.metricLabel}>Total Utilizatori</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="storefront-outline" size={30} color="#009688" />
            <Text style={styles.metricValue}>{keyMetrics.activeCafes}</Text>
            {/* TODO: Translation key 'activeCafes' */}
            <Text style={styles.metricLabel}>Cafenele Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="card-outline" size={30} color="#FF9800" />
            <Text style={styles.metricValue}>
              {keyMetrics.activeSubscriptions}
            </Text>
            {/* TODO: Translation key 'activeSubscriptions' */}
            <Text style={styles.metricLabel}>Abonamente Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="cafe-outline" size={30} color="#8B4513" />
            <Text style={styles.metricValue}>{keyMetrics.coffeesToday}</Text>
            {/* TODO: Translation key 'coffeesServedToday' or similar */}
            <Text style={styles.metricLabel}>Cafele Servite Azi</Text>
          </View>
        </View>

        {/* Charts Section */}
        <Text style={styles.sectionTitle}>Creștere Utilizatori</Text>
        <View style={styles.chartPlaceholder}>
          {/* Example: <LineChart ... data={userGrowthData} ... /> */}
          <Ionicons name="trending-up-outline" size={50} color="#CCC" />
          <Text style={styles.placeholderText}>
            Grafic Creștere Utilizatori
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Distribuție Abonamente</Text>
        <View style={styles.chartPlaceholder}>
          {/* Example: <PieChart ... data={subscriptionDistributionData} ... /> */}
          <Ionicons name="pie-chart-outline" size={50} color="#CCC" />
          <Text style={styles.placeholderText}>
            Grafic Distribuție Abonamente
          </Text>
        </View>

        {/* Add more charts as needed */}
      </ScrollView>
    </ScreenWrapper>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 15,
    paddingBottom: 40,
  },
  dateRangeText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "47%", // Adjust for spacing
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 120,
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
    marginTop: 15,
    marginBottom: 10,
  },
  chartPlaceholder: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  placeholderText: {
    color: "#AAA",
    marginTop: 10,
    fontSize: 14,
  },
});
// --------------
