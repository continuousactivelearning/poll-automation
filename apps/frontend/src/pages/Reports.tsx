"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { FileText, Download, Calendar, PieChart, TrendingUp, Users, Clock, Target, BarChart3 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import { utils, writeFile, write } from 'xlsx';
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast, Toaster } from "react-hot-toast"
import GlassCard from "../components/GlassCard"
import DashboardLayout from "../components/DashboardLayout"

// Types
type PerformanceEntry = {
  date: string
  accuracy: number
  participation: number
  avgTime: number
}

type TopicEntry = {
  name: string
  value: number
  color: string
}

type DifficultyEntry = {
  difficulty: string
  correct: number
  incorrect: number
  total: number
}



const Reports = () => {
  const [dateRange, setDateRange] = useState("7days")
  const [reportType, setReportType] = useState("overview")

  const overviewRef = useRef<HTMLDivElement | null>(null);
  const performanceRef = useRef<HTMLDivElement | null>(null);
  const engagementRef = useRef<HTMLDivElement | null>(null);
  const topicsRef = useRef<HTMLDivElement | null>(null);


  // Mock data
  const performanceData: PerformanceEntry[] = [
    { date: "2024-01-01", accuracy: 85, participation: 45, avgTime: 2.3 },
    { date: "2024-01-02", accuracy: 87, participation: 52, avgTime: 2.1 },
    { date: "2024-01-03", accuracy: 82, participation: 38, avgTime: 2.8 },
    { date: "2024-01-04", accuracy: 89, participation: 61, avgTime: 2.0 },
    { date: "2024-01-05", accuracy: 91, participation: 48, avgTime: 1.9 },
    { date: "2024-01-06", accuracy: 88, participation: 55, avgTime: 2.2 },
    { date: "2024-01-07", accuracy: 93, participation: 42, avgTime: 1.8 },
  ]

  const topicDistribution: TopicEntry[] = [
    { name: "React Hooks", value: 35, color: "#8B5CF6" },
    { name: "State Management", value: 25, color: "#3B82F6" },
    { name: "API Integration", value: 20, color: "#14B8A6" },
    { name: "TypeScript", value: 15, color: "#F59E0B" },
    { name: "Testing", value: 5, color: "#EF4444" },
  ]

  const difficultyBreakdown: DifficultyEntry[] = [
    { difficulty: "Easy", correct: 145, incorrect: 23, total: 168 },
    { difficulty: "Medium", correct: 98, incorrect: 45, total: 143 },
    { difficulty: "Hard", correct: 34, incorrect: 28, total: 62 },
  ]

  const engagementData = performanceData.map((d) => ({
    date: d.date,
    participation: d.participation,
    avgTime: d.avgTime,
  }))

  const reportTemplates = [
    {
      id: "overview",
      name: "Overview Report",
      description: "Comprehensive summary of all polling activities",
      icon: BarChart3,
      color: "from-primary-500 to-purple-600",
    },
    {
      id: "performance",
      name: "Performance Analysis",
      description: "Detailed participant performance metrics",
      icon: TrendingUp,
      color: "from-secondary-500 to-blue-600",
    },
    {
      id: "engagement",
      name: "Engagement Report",
      description: "Participation rates and engagement patterns",
      icon: Users,
      color: "from-accent-500 to-teal-600",
    },
    {
      id: "topics",
      name: "Topic Analysis",
      description: "Question topics and difficulty distribution",
      icon: PieChart,
      color: "from-orange-500 to-red-600",
    },
  ]

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case "7days":
        return "Last 7 Days"
      case "30days":
        return "Last 30 Days"
      case "90days":
        return "Last 90 Days"
      case "alltime":
        return "All Time"
      default:
        return "Last 7 Days"
    }
  }

  const handleExportReport = (format: string) => {
    const filename = `${reportType}-report-${new Date().toISOString().slice(0, 10)}`
    const dateRangeText = getDateRangeLabel(dateRange)

    // Enhanced data structure for better presentation
    const getEnhancedOverviewData = () => {
      return {
        reportInfo: {
          title: "Comprehensive Overview Report",
          dateRange: dateRangeText,
          generatedOn: new Date().toLocaleString(),
          reportType: "Overview Analysis",
        },
        executiveSummary: [
          { metric: "Total Questions Asked", value: "1,247", change: "+12% vs last period", status: "Positive" },
          { metric: "Average Accuracy Rate", value: "87.5%", change: "+2.3% improvement", status: "Positive" },
          { metric: "Active Participants", value: "342", change: "+18% growth", status: "Positive" },
          { metric: "Average Response Time", value: "2.3 seconds", change: "-0.5s faster", status: "Positive" },
          { metric: "Engagement Score", value: "8.4/10", change: "+0.7 improvement", status: "Positive" },
        ],
        performanceMetrics: performanceData.map((item) => ({
          ...item,
          engagementScore: (item.participation * 0.4 + item.accuracy * 0.6) / 10,
          performanceGrade: item.accuracy >= 90 ? "A" : item.accuracy >= 80 ? "B" : item.accuracy >= 70 ? "C" : "D",
        })),
        topicAnalysis: topicDistribution.map((topic) => ({
          ...topic,
          questions: Math.floor((topic.value / 100) * 1247),
          avgAccuracy: Math.floor(Math.random() * 20) + 75,
          difficulty: topic.value > 25 ? "High Focus" : topic.value > 15 ? "Medium Focus" : "Low Focus",
        })),
        difficultyInsights: difficultyBreakdown.map((item) => ({
          ...item,
          accuracyRate: Math.round((item.correct / item.total) * 100),
          improvementNeeded: item.correct / item.total < 0.8 ? "Yes" : "No",
          recommendedAction:
            item.correct / item.total < 0.7
              ? "Review Content"
              : item.correct / item.total < 0.8
                ? "Practice More"
                : "Maintain Level",
        })),
        trends: {
          weeklyGrowth: "+12%",
          accuracyTrend: "Improving",
          participationTrend: "Stable",
          topPerformingTopic: "React Hooks",
          needsAttention: "Hard Questions",
        },
      }
    }

    const getReportData = () => {
      switch (reportType) {
        case "overview":
          return getEnhancedOverviewData()
        case "performance":
          return {
            reportInfo: {
              title: "Performance Analysis Report",
              dateRange: dateRangeText,
              generatedOn: new Date().toLocaleString(),
            },
            data: difficultyBreakdown.map((item) => ({
              ...item,
              accuracyRate: Math.round((item.correct / item.total) * 100),
              grade:
                item.correct / item.total >= 0.9
                  ? "A"
                  : item.correct / item.total >= 0.8
                    ? "B"
                    : item.correct / item.total >= 0.7
                      ? "C"
                      : "D",
            })),
          }
        case "engagement":
          return {
            reportInfo: {
              title: "Engagement Analysis Report",
              dateRange: dateRangeText,
              generatedOn: new Date().toLocaleString(),
            },
            data: performanceData,
          }
        case "topics":
          return {
            reportInfo: {
              title: "Topic Distribution Report",
              dateRange: dateRangeText,
              generatedOn: new Date().toLocaleString(),
            },
            data: topicDistribution,
          }
        default:
          return getEnhancedOverviewData()
      }
    }

    const reportData = getReportData()

    // Helper function to download blob
    const downloadBlob = (blob: Blob, fileName: string) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }



    switch (format) {
      case "Excel": {
        try {
          const workbook = utils.book_new()

          if (reportType === "overview") {
            const overviewData = reportData as {
              executiveSummary: any[];
              performanceMetrics: any[];
              topicAnalysis: any[];
              difficultyInsights: any[];
            };

            const summarySheet = utils.json_to_sheet(overviewData.executiveSummary);
            const performanceSheet = utils.json_to_sheet(overviewData.performanceMetrics);
            const topicsSheet = utils.json_to_sheet(overviewData.topicAnalysis);
            const difficultySheet = utils.json_to_sheet(overviewData.difficultyInsights);

            utils.book_append_sheet(workbook, summarySheet, "Executive Summary");
            utils.book_append_sheet(workbook, performanceSheet, "Performance Data");
            utils.book_append_sheet(workbook, topicsSheet, "Topic Analysis");
            utils.book_append_sheet(workbook, difficultySheet, "Difficulty Analysis");
          } else {
            const worksheet = utils.json_to_sheet((reportData as any).data);
            utils.book_append_sheet(workbook, worksheet, "Report Data");
          }

          // Generate buffer and create blob
          const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
          downloadBlob(blob, `${filename}.xlsx`)
          toast.success("Excel file with multiple sheets downloaded successfully!")
        } catch (error) {
          console.error("Excel export error:", error)
          toast.error("Failed to export Excel file")
        }
        break
      }

      case "CSV": {
        try {
          let csvData = []
          if (reportType === "overview") {
            csvData = [
              ...reportData.executiveSummary.map((item) => ({ section: "Summary", ...item })),
              ...reportData.performanceMetrics.map((item) => ({ section: "Performance", ...item })),
              ...reportData.topicAnalysis.map((item) => ({ section: "Topics", ...item })),
              ...reportData.difficultyInsights.map((item) => ({ section: "Difficulty", ...item })),
            ]
          } else {
            csvData = reportData.data
          }

          const worksheet = utils.json_to_sheet(csvData)
          const csvOutput = utils.sheet_to_csv(worksheet)
          const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" })
          downloadBlob(blob, `${filename}.csv`)
          toast.success("CSV file downloaded successfully!")
        } catch (error) {
          console.error("CSV export error:", error)
          toast.error("Failed to export CSV file")
        }
        break
      }

      case "JSON": {
        try {
          const enhancedJsonData = {
            metadata: {
              exportedAt: new Date().toISOString(),
              reportType: reportType,
              dateRange: dateRangeText,
              version: "2.0",
              totalRecords:
                reportType === "overview"
                  ? Object.values(reportData).reduce((acc, val) => acc + (Array.isArray(val) ? val.length : 0), 0)
                  : reportData.data?.length || 0,
            },
            ...reportData,
            chartConfigurations: {
              performanceChart: {
                type: "bar",
                dataKey: "accuracy",
                color: "#8B5CF6",
              },
              topicsChart: {
                type: "pie",
                dataKey: "value",
                colors: topicDistribution.map((t) => t.color),
              },
            },
          }

          const blob = new Blob([JSON.stringify(enhancedJsonData, null, 2)], {
            type: "application/json",
          })
          downloadBlob(blob, `${filename}.json`)
          toast.success("Enhanced JSON file downloaded successfully!")
        } catch (error) {
          console.error("JSON export error:", error)
          toast.error("Failed to export JSON file")
        }
        break
      }

      case "PDF": {
        try {
          const doc = new jsPDF()

          // Enhanced PDF with better formatting
          doc.setFontSize(20)
          doc.setTextColor(40, 40, 40)
          doc.text(reportData.reportInfo?.title || "Report", 20, 30)

          doc.setFontSize(12)
          doc.setTextColor(100, 100, 100)
          doc.text(`Generated: ${reportData.reportInfo?.generatedOn}`, 20, 45)
          doc.text(`Period: ${reportData.reportInfo?.dateRange}`, 20, 55)

          // Add a line separator
          doc.setDrawColor(200, 200, 200)
          doc.line(20, 65, 190, 65)

          let yPosition = 80

          if (reportType === "overview") {
            // Executive Summary Section
            doc.setFontSize(16)
            doc.setTextColor(40, 40, 40)
            doc.text("Executive Summary", 20, yPosition)
            yPosition += 15

            autoTable(doc, {
              startY: yPosition,
              head: [["Metric", "Value", "Change", "Status"]],
              body: reportData.executiveSummary.map((item) => [item.metric, item.value, item.change, item.status]),
              theme: "striped",
              headStyles: { fillColor: [139, 92, 246] },
              margin: { left: 20, right: 20 },
            })

            yPosition = (doc as any).lastAutoTable.finalY + 20

            // Performance Metrics Section
            doc.setFontSize(16)
            doc.text("Performance Metrics", 20, yPosition)
            yPosition += 10

            autoTable(doc, {
              startY: yPosition,
              head: [["Date", "Accuracy %", "Participation", "Avg Time (s)", "Grade"]],
              body: reportData.performanceMetrics.map((item) => [
                item.date,
                `${item.accuracy}%`,
                item.participation,
                item.avgTime,
                item.performanceGrade,
              ]),
              theme: "grid",
              headStyles: { fillColor: [59, 130, 246] },
            })

            // Add new page for additional data
            doc.addPage()
            yPosition = 30

            // Topic Analysis Section
            doc.setFontSize(16)
            doc.text("Topic Analysis", 20, yPosition)
            yPosition += 10

            autoTable(doc, {
              startY: yPosition,
              head: [["Topic", "Coverage %", "Questions", "Avg Accuracy", "Focus Level"]],
              body: reportData.topicAnalysis.map((item) => [
                item.name,
                `${item.value}%`,
                item.questions,
                `${item.avgAccuracy}%`,
                item.difficulty,
              ]),
              theme: "striped",
              headStyles: { fillColor: [20, 184, 166] },
            })

            yPosition = (doc as any).lastAutoTable.finalY + 20

            // Difficulty Analysis Section
            doc.setFontSize(16)
            doc.text("Difficulty Analysis & Recommendations", 20, yPosition)
            yPosition += 10

            autoTable(doc, {
              startY: yPosition,
              head: [["Difficulty", "Correct", "Incorrect", "Accuracy %", "Action Needed"]],
              body: reportData.difficultyInsights.map((item) => [
                item.difficulty,
                item.correct,
                item.incorrect,
                `${item.accuracyRate}%`,
                item.recommendedAction,
              ]),
              theme: "grid",
              headStyles: { fillColor: [245, 158, 11] },
            })
          } else {
            // Single table for other report types
            const tableData = Array.isArray(reportData.data) ? reportData.data : [reportData.data]
            autoTable(doc, {
              startY: yPosition,
              head: [Object.keys(tableData[0])],
              body: tableData.map((row) => Object.values(row)),
              theme: "striped",
              headStyles: { fillColor: [139, 92, 246] },
            })
          }

          // Add footer
          const pageCount = doc.internal.getNumberOfPages()
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(10)
            doc.setTextColor(150, 150, 150)
            doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10)
            doc.text("Generated by Reports & Analytics Dashboard", 120, doc.internal.pageSize.height - 10)
          }

          doc.save(`${filename}.pdf`)
          toast.success("Enhanced PDF report downloaded successfully!")
        } catch (error) {
          console.error("PDF export error:", error)
          toast.error("Failed to export PDF file")
        }
        break
      }

      default:
        console.warn(`Unsupported format: ${format}`)
    }
  }

  const renderOverviewReport = () => (
    <div ref={overviewRef}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Performance Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="accuracy" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Topic Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Topic Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={topicDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {topicDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {topicDistribution.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.color }} />
                  <span className="text-gray-100 text-sm">{topic.name}</span>
                </div>
                <span className="text-white font-medium">{topic.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )

  const renderPerformanceReport = () => (
    <div ref={performanceRef}>
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Performance Analysis</h3>
        <div className="space-y-4">
          {difficultyBreakdown.map((item) => (
            <div key={item.difficulty} className="bg-white/10 border border-white/20 rounded-lg p-4 shadow-inner">
              <div className="flex justify-between mb-2">
                <h4 className="text-white font-medium">{item.difficulty}</h4>
                <span className="text-sm text-gray-100">{item.total} questions</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(item.correct / item.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-green-400">Correct: {item.correct}</span>
                <span className="text-red-400">Incorrect: {item.incorrect}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )

  const renderEngagementReport = () => (
    <div ref={engagementRef}>
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Engagement: Participation & Response Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(17, 24, 39, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="participation" fill="#3B82F6" />
            <Bar dataKey="avgTime" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );


  const renderTopicsReport = () => (
    <div ref={topicsRef}>
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Topic Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={topicDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              isAnimationActive={false} // Optional: smoother hover
            >
              {topicDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{
                backgroundColor: "#1f2937", // Tailwind gray-800
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#a1a1aa" }} // gray-400
            />
          </RechartsPieChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {topicDistribution.map((topic, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: topic.color }} />
              <span className="text-gray-100 text-sm">
                {topic.name}: {topic.value}%
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );


  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#1e1e1e",
            color: "#fff",
          },
        }}
      />
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center w-full">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
                <p className="text-gray-100">Generate detailed reports and insights</p>
              </div>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-md hover:bg-white/20 transition duration-200"
              >
                <option value="7days" className="bg-gray-800">Last 7 Days</option>
                <option value="30days" className="bg-gray-800">Last 30 Days</option>
                <option value="90days" className="bg-gray-800">Last 90 Days</option>
                <option value="alltime" className="bg-gray-800">All Time</option>
              </select>
            </div>
          </div>
          {/* Report Templates */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Report Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportTemplates.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setReportType(template.id);
                    setTimeout(() => {
                      if (template.id === 'overview') overviewRef.current?.scrollIntoView({ behavior: 'smooth' });
                      else if (template.id === 'performance') performanceRef.current?.scrollIntoView({ behavior: 'smooth' });
                      else if (template.id === 'engagement') engagementRef.current?.scrollIntoView({ behavior: 'smooth' });
                      else if (template.id === 'topics') topicsRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  }}

                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left shadow-md ${reportType === template.id
                    ? "border-primary-500 bg-primary-500/20"
                    : "border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/20"
                    }`}
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center mb-3`}
                  >
                    <template.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-white mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-100">{template.description}</p>
                </motion.button>
              ))}
            </div>
          </GlassCard>

          {/* Export Options */}
          <GlassCard className="p-6">
            <div className="flex flex-col items-center gap-5">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Export Options</h3>
                <p className="text-gray-100 text-sm mt-1">
                  Download comprehensive reports with enhanced data and insights
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-100" />
                <span className="text-gray-100 text-sm font-semibold">{getDateRangeLabel(dateRange)}</span>
              </div>
            </div>
            {/* Disclaimer */}
            <div className="mt-4 bg-yellow-400/10 border-l-4 border-yellow-400 text-yellow-300 px-4 py-2 rounded-md shadow-inner text-sm">
              📌 <span className="font-medium">Note:</span> The currently selected report section will be exported. Choose the format that best fits your needs!
            </div>
            {/* Export Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                {
                  format: "PDF",
                  icon: FileText,
                  desc: "Professional report with charts & insights",
                  color: "from-red-500 to-red-600",
                },
                {
                  format: "Excel",
                  icon: BarChart3,
                  desc: "Multi-sheet workbook with detailed data",
                  color: "from-green-500 to-green-600",
                },
                {
                  format: "CSV",
                  icon: Download,
                  desc: "Raw data for further analysis",
                  color: "from-blue-500 to-blue-600",
                },
                {
                  format: "JSON",
                  icon: Target,
                  desc: "Structured data with metadata",
                  color: "from-purple-500 to-purple-600",
                },
              ].map(({ format, icon: Icon, desc, color }) => (
                <motion.button
                  key={format}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExportReport(format)}
                  className="group relative p-4 bg-white/10 border border-white/20 rounded-xl shadow-md hover:bg-white/20 transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">{format}</h4>
                  <p className="text-gray-100 text-xs leading-tight">{desc}</p>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              ))}
            </div>
          </GlassCard>

          {/* Report Content */}
          {reportType === "overview" && renderOverviewReport()}
          {reportType === "performance" && renderPerformanceReport()}
          {reportType === "engagement" && renderEngagementReport()}
          {reportType === "topics" && renderTopicsReport()}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">Total Questions</p>
                  <p className="text-2xl font-bold text-white">1,247</p>
                  <p className="text-green-400 text-sm">+12% from last period</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">Avg Accuracy</p>
                  <p className="text-2xl font-bold text-white">87.5%</p>
                  <p className="text-green-400 text-sm">+2.3% improvement</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">342</p>
                  <p className="text-green-400 text-sm">+18% growth</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">Avg Response Time</p>
                  <p className="text-2xl font-bold text-white">2.3s</p>
                  <p className="text-green-400 text-sm">-0.5s faster</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Difficulty Analysis */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Difficulty Analysis</h3>
            <div className="space-y-4">
              {difficultyBreakdown.map((item, index) => (
                <motion.div
                  key={item.difficulty}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 border border-white/20 rounded-lg p-4 shadow-inner"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{item.difficulty}</h4>
                    <span className="text-gray-100 text-sm">{item.total} questions</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-400 text-sm">Correct: {item.correct}</span>
                        <span className="text-red-400 text-sm">Incorrect: {item.incorrect}</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200/20 rounded-full border border-white/10 shadow-inner">
                        <div
                          className="h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                          style={{ width: `${(item.correct / item.total) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{Math.round((item.correct / item.total) * 100)}%</span>
                      <p className="text-gray-100 text-xs">accuracy</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </DashboardLayout>
    </>
  )
}

export default Reports
