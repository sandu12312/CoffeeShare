import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Placeholder for a potential charting library
// import { LineChart } from 'react-native-chart-kit';

export default function ReportsScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  // Dummy data for now
  const reportData = {
    totalScans: 1250,
    uniqueCustomers: 315,
    peakHour: "14:00 - 15:00",
    averageScansPerDay: 41,
  };

  // Placeholder chart data
  const chartData = {
    labels: ["Lun", "Mar", "Mie", "Joi", "Vin", "Sam", "Dum"],
    datasets: [
      {
        data: [
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
        ],
      },
    ],
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log("Export data triggered");
    alert("Funcționalitate de export în curând!");
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#321E0E" />
        </TouchableOpacity>
        {/* TODO: Add translation key 'reportsTitle' */}
        <Text style={styles.headerTitle}>Rapoarte și Statistici</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* TODO: Add Date Range Selector component */}
        <Text style={styles.sectionTitle}>Perioada: Ultimele 30 de zile</Text>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Ionicons name="scan-outline" size={24} color="#8B4513" />
            <Text style={styles.metricValue}>{reportData.totalScans}</Text>
            {/* TODO: Add translation key 'totalScans' */}
            <Text style={styles.metricLabel}>Total Scanări</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="people-outline" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>{reportData.uniqueCustomers}</Text>
            {/* TODO: Add translation key 'uniqueCustomers' */}
            <Text style={styles.metricLabel}>Clienți Unici</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time-outline" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>{reportData.peakHour}</Text>
            {/* TODO: Add translation key 'peakHour' */}
            <Text style={styles.metricLabel}>Ora de Vârf</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="stats-chart-outline" size={24} color="#4CAF50" />
            <Text style={styles.metricValue}>
              {reportData.averageScansPerDay}
            </Text>
            {/* TODO: Add translation key 'avgScansPerDay' */}
            <Text style={styles.metricLabel}>Medie Scanări/Zi</Text>
          </View>
        </View>

        {/* Charts Section */}
        <Text style={styles.sectionTitle}>
          Scanări pe Zi (Săptămâna Curentă)
        </Text>
        <View style={styles.chartPlaceholder}>
          {/* <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40} // from react-native
            height={220}
            yAxisSuffix=" scanări"
            yAxisInterval={1} // optional, defaults to 1
            chartConfig={{
              backgroundColor: "#e26a00",
              backgroundGradientFrom: "#fb8c00",
              backgroundGradientTo: "#ffa726",
              decimalPlaces: 0, // optional, defaults to 2dp
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          /> */}
          <Ionicons name="bar-chart-outline" size={80} color="#E0E0E0" />
          <Text style={styles.placeholderText}>Grafic Scanări</Text>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportData}
        >
          <Ionicons name="download-outline" size={20} color="#FFFFFF" />
          {/* TODO: Add translation key 'exportData' */}
          <Text style={styles.exportButtonText}>Exportă Date</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50, // Adjust for status bar height
    paddingBottom: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 15,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "48%", // Slightly less than 50% for spacing
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 100,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  chartPlaceholder: {
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  placeholderText: {
    color: "#A0A0A0",
    marginTop: 10,
    fontSize: 16,
  },
  exportButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
