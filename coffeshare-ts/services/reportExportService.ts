import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Alert, Platform } from "react-native";
import { ReportsData, PartnerDailyReport } from "./partnerAnalyticsService";

export interface ExportOptions {
  partnerName: string;
  partnerEmail: string;
  dateRange: string;
  reportData: ReportsData;
  selectedDateRange: number;
}

class ReportExportService {
  /**
   * Generez conținutul HTML pentru raportul PDF
   */
  private generateReportHTML(options: ExportOptions): string {
    const {
      partnerName,
      partnerEmail,
      dateRange,
      reportData,
      selectedDateRange,
    } = options;
    const currentDate = new Date().toLocaleDateString();

    // Determin tipul și perioada raportului
    const reportType =
      selectedDateRange === 1
        ? "Daily Hourly Analysis"
        : selectedDateRange === 7
        ? "Weekly Analysis"
        : selectedDateRange === 28
        ? "Monthly Analysis"
        : "All-Time Analysis";

    const granularity =
      selectedDateRange === 1
        ? "hourly intervals"
        : selectedDateRange === 7
        ? "daily breakdown"
        : selectedDateRange === 28
        ? "weekly summary"
        : "monthly trends";

    // Generez datele pentru afișarea graficelor
    const chartData = this.prepareChartDataForPDF(
      reportData,
      selectedDateRange
    );

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f8f9fa;
                color: #333;
                line-height: 1.6;
            }
            .header {
                background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .info-section {
                background: white;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 25px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                padding: 15px;
                background: #f8f4f0;
                border-radius: 8px;
                border-left: 4px solid #8B4513;
            }
            .info-label {
                font-weight: 600;
                color: #8B4513;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .info-value {
                font-size: 16px;
                color: #333;
            }
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            .metric-card {
                background: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border-top: 4px solid #8B4513;
            }
            .metric-value {
                font-size: 24px;
                font-weight: 700;
                color: #8B4513;
                margin-bottom: 5px;
            }
            .metric-label {
                font-size: 14px;
                color: #666;
                font-weight: 500;
            }
            .chart-section {
                background: white;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 25px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .chart-title {
                font-size: 20px;
                font-weight: 700;
                color: #8B4513;
                margin-bottom: 20px;
                text-align: center;
            }
            .chart-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            .chart-table th {
                background: #8B4513;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: 600;
            }
            .chart-table td {
                padding: 10px 12px;
                border-bottom: 1px solid #eee;
            }
            .chart-table tr:nth-child(even) {
                background: #f8f4f0;
            }
            .daily-reports {
                background: white;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 25px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #eee;
                margin-top: 30px;
            }
            .summary-box {
                background: linear-gradient(135deg, #f8f4f0 0%, #fff8f3 100%);
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e0d0b8;
                margin-bottom: 25px;
            }
            .summary-title {
                font-size: 18px;
                font-weight: 700;
                color: #8B4513;
                margin-bottom: 15px;
            }
            .row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .coffee-icon {
                display: inline-block;
                margin-right: 8px;
                font-size: 20px;
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <h1><span class="coffee-icon">☕</span>CoffeeShare Analytics Report</h1>
            <p>${reportType} | Generated on ${currentDate}</p>
        </div>

        <!-- Partner Information -->
        <div class="info-section">
            <h2 style="color: #8B4513; margin-bottom: 20px;">Partner Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Partner Name</div>
                    <div class="info-value">${partnerName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Partner Email</div>
                    <div class="info-value">${partnerEmail}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Report Period</div>
                    <div class="info-value">${dateRange}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Report Type</div>
                    <div class="info-value">${reportType}</div>
                </div>
            </div>
        </div>

        <!-- Key Metrics -->
        <div class="summary-box">
            <div class="summary-title">Executive Summary</div>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${reportData.totalScans}</div>
                    <div class="metric-label">Total Scans</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reportData.totalEarnings.toFixed(
                      2
                    )} RON</div>
                    <div class="metric-label">Total Earnings</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${
                      reportData.uniqueCustomers
                    }</div>
                    <div class="metric-label">Unique Customers</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reportData.peakHour}</div>
                    <div class="metric-label">Peak ${
                      selectedDateRange === 1 ? "Hour" : "Time"
                    }</div>
                </div>
            </div>
        </div>

        <!-- Performance Analysis -->
        <div class="chart-section">
            <div class="chart-title">Performance Analysis (${granularity})</div>
            <table class="chart-table">
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Scans</th>
                        <th>Percentage</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>
                    ${chartData
                      .map(
                        (item, index) => `
                        <tr>
                            <td><strong>${item.label}</strong></td>
                            <td>${item.value} scans</td>
                            <td>${item.percentage}%</td>
                            <td>${item.performance}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>

        <!-- Daily Reports Summary -->
        ${
          reportData.dailyReports.length > 0
            ? `
        <div class="daily-reports">
            <h2 style="color: #8B4513; margin-bottom: 20px;">Detailed Daily Breakdown</h2>
            <table class="chart-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Scans</th>
                        <th>Beans Used</th>
                        <th>Earnings (RON)</th>
                        <th>Customers</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.dailyReports
                      .slice(-10)
                      .map(
                        (day) => `
                        <tr>
                            <td>${new Date(day.date).toLocaleDateString()}</td>
                            <td>${day.scansCount}</td>
                            <td>${day.totalBeansUsed}</td>
                            <td>${day.totalEarningsRON.toFixed(2)}</td>
                            <td>${day.uniqueCustomers.length}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="footer">
            <p>This report was generated by CoffeeShare Analytics Platform</p>
            <p>For support contact: support@coffeeshare.com</p>
            <p>Report generated on ${currentDate} at ${new Date().toLocaleTimeString()}</p>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Prepar datele graficului pentru afișarea în PDF
   */
  private prepareChartDataForPDF(
    reportData: ReportsData,
    selectedDateRange: number
  ) {
    const chartData: Array<{
      label: string;
      value: number;
      percentage: string;
      performance: string;
    }> = [];

    if (selectedDateRange === 1) {
      // Date orare - afișez intervalele de timp cu cele mai bune performanțe
      const hourIntervals = [
        { label: "6AM-9AM", hours: [6, 7, 8] },
        { label: "9AM-12PM", hours: [9, 10, 11] },
        { label: "12PM-3PM", hours: [12, 13, 14] },
        { label: "3PM-6PM", hours: [15, 16, 17] },
        { label: "6PM-9PM", hours: [18, 19, 20] },
        { label: "9PM-12AM", hours: [21, 22, 23] },
      ];

      if (reportData.dailyReports.length > 0) {
        const latestDay =
          reportData.dailyReports[reportData.dailyReports.length - 1];
        const total = reportData.totalScans;

        hourIntervals.forEach((interval) => {
          const value = interval.hours.reduce((sum, hour) => {
            const hourKey = `hour_${hour}`;
            return sum + (latestDay.hourlyDistribution?.[hourKey] || 0);
          }, 0);

          const percentage =
            total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
          const performance =
            value > total / 6
              ? "Above Average"
              : value > 0
              ? "Average"
              : "Below Average";

          chartData.push({
            label: interval.label,
            value,
            percentage,
            performance,
          });
        });
      }
    } else {
      // Pentru alte perioade, afișez zilele/săptămânile/lunile recente
      const recentData = reportData.dailyReports.slice(-7);
      const total = reportData.totalScans;

      recentData.forEach((day) => {
        const value = day.scansCount;
        const percentage =
          total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
        const avgPerDay = total / reportData.dailyReports.length;
        const performance =
          value > avgPerDay
            ? "Above Average"
            : value > 0
            ? "Average"
            : "Below Average";

        chartData.push({
          label: new Date(day.date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          value,
          percentage,
          performance,
        });
      });
    }

    return chartData;
  }

  /**
   * Generez și export raportul PDF
   */
  async generatePDFReport(options: ExportOptions): Promise<void> {
    try {
      const htmlContent = this.generateReportHTML(options);

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
      });

      const fileName = `CoffeeShare_Report_${options.partnerName.replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.pdf`;

      // Mut fișierul într-o locație permanentă
      const finalUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri,
      });

      // Partajez PDF-ul
      await Sharing.shareAsync(finalUri, {
        dialogTitle: "CoffeeShare Analytics Report",
        mimeType: "application/pdf",
      });

      Alert.alert(
        "Report Generated!",
        `Your analytics report has been generated and saved.`,
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Error generating PDF report:", error);
      Alert.alert(
        "Export Error",
        "Failed to generate the PDF report. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    }
  }

  /**
   * Generez datele CSV pentru export
   */
  generateCSVReport(options: ExportOptions): string {
    const { reportData, partnerName, selectedDateRange } = options;
    const currentDate = new Date().toISOString().split("T")[0];

    let csvContent = "";

    // Antet
    csvContent += `CoffeeShare Analytics Report\n`;
    csvContent += `Partner: ${partnerName}\n`;
    csvContent += `Generated: ${currentDate}\n`;
    csvContent += `Period: ${
      selectedDateRange === -1 ? "All Time" : `Last ${selectedDateRange} days`
    }\n\n`;

    // Sumar
    csvContent += `Summary\n`;
    csvContent += `Total Scans,${reportData.totalScans}\n`;
    csvContent += `Total Earnings,${reportData.totalEarnings.toFixed(2)} RON\n`;
    csvContent += `Unique Customers,${reportData.uniqueCustomers}\n`;
    csvContent += `Peak Hour,${reportData.peakHour}\n\n`;

    // Detaliere zilnică
    csvContent += `Daily Breakdown\n`;
    csvContent += `Date,Scans,Beans Used,Earnings (RON),Unique Customers\n`;

    reportData.dailyReports.forEach((day) => {
      csvContent += `${day.date},${day.scansCount},${
        day.totalBeansUsed
      },${day.totalEarningsRON.toFixed(2)},${day.uniqueCustomers.length}\n`;
    });

    return csvContent;
  }

  /**
   * Export raportul CSV
   */
  async exportCSVReport(options: ExportOptions): Promise<void> {
    try {
      const csvContent = this.generateCSVReport(options);
      const fileName = `CoffeeShare_Data_${options.partnerName.replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.csv`;

      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      await Sharing.shareAsync(filePath, {
        dialogTitle: "CoffeeShare Data Export",
        mimeType: "text/csv",
      });

      Alert.alert(
        "Data Exported!",
        `Your data has been exported to CSV format.`,
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert(
        "Export Error",
        "Failed to export the CSV file. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    }
  }
}

export const reportExportService = new ReportExportService();
export default reportExportService;
