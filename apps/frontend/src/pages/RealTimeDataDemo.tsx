import { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import config from "../config/websocket";

interface DataChangeEvent {
  type: "insert" | "update" | "delete" | "replace";
  collection: string;
  id?: string;
  data?: any;
  timestamp: string;
}

interface Question {
  _id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  concept: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
}

const RealTimeDataDemo = () => {
  const [connected, setConnected] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recentChanges, setRecentChanges] = useState<DataChangeEvent[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "info" | "warning" }>
  >([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeQuestions: 0,
    recentAdditions: 0,
    lastUpdateTime: null as Date | null,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isLoading, setIsLoading] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  const questionsListRef = useRef<HTMLDivElement>(null);
  const recentChangesRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to new items
  const scrollToNewItem = (isQuestion: boolean = true) => {
    setTimeout(() => {
      if (isQuestion && questionsListRef.current) {
        questionsListRef.current.scrollTop = 0; // Scroll to top for new questions
      } else if (!isQuestion && recentChangesRef.current) {
        recentChangesRef.current.scrollTop = 0; // Scroll to top for new changes
      }
    }, 100);
  };

  // Auto-refresh functionality
  const refreshData = useCallback(async () => {
    if (socket && connected) {
      setIsLoading(true);
      socket.emit("request-initial-data");
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [socket, connected]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (autoRefresh && connected) {
      autoRefreshIntervalRef.current = setInterval(
        refreshData,
        refreshInterval,
      );
    } else if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh, connected, refreshInterval, refreshData]);

  useEffect(() => {
    // Connect to the Socket.IO server with retry logic
    const connectSocket = () => {
      const newSocket = io(config.socketIO.url, {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      });

      setSocket(newSocket);
      setConnectionAttempts((prev) => prev + 1);

      newSocket.on("connect", () => {
        console.log("✅ Connected to Socket.IO server");
        setConnected(true);
        setConnectionAttempts(0);
        setLastActivity(new Date());
        showToast("Connected to real-time server", "success");

        // Request initial data when connected
        newSocket.emit("request-initial-data");
      });

      newSocket.on("connect_error", (error: any) => {
        console.error("❌ Connection error:", error);
        setConnected(false);
        showToast(
          `Connection failed (attempt ${connectionAttempts + 1})`,
          "warning",
        );

        // Auto-retry connection after 5 seconds
        setTimeout(() => {
          if (connectionAttempts < 5) {
            connectSocket();
          }
        }, 3000);
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Disconnected from Socket.IO server");
        setConnected(false);
        showToast("Disconnected from server", "warning");
      });

      // Listen for initial data
      newSocket.on(
        "initial-data",
        (data: { questions: Question[]; timestamp: string }) => {
          console.log("📥 Initial data received:", data);
          setQuestions(data.questions);
          updateStats(data.questions);
          setLastActivity(new Date());
          showToast(`Loaded ${data.questions.length} questions`, "info");
        },
      );

      // Listen for real-time question changes
      newSocket.on("question-added", (change: DataChangeEvent) => {
        console.log("📥 New question added:", change);
        setQuestions((prev) => {
          const newQuestions = [change.data, ...prev]; // Add to beginning
          updateStats(newQuestions);
          return newQuestions;
        });

        // Highlight new item with animation
        setNewItemIds((prev) => new Set([...prev, change.data._id]));
        setTimeout(() => {
          setNewItemIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(change.data._id);
            return newSet;
          });
        }, 3000); // Longer highlight duration

        addRecentChange(change);
        setLastActivity(new Date());
        showToast(
          `New question: ${change.data.question.substring(0, 50)}...`,
          "success",
        );
        playNotificationSound();
        scrollToNewItem(true);
      });

      newSocket.on("question-updated", (change: DataChangeEvent) => {
        console.log("📥 Question updated:", change);
        setQuestions((prev) => {
          const newQuestions = prev.map((q) =>
            q._id === change.id ? change.data : q,
          );
          updateStats(newQuestions);
          return newQuestions;
        });
        addRecentChange(change);
        setLastActivity(new Date());
        showToast("Question updated", "info");
        scrollToNewItem(false);
      });

      newSocket.on("question-deleted", (change: DataChangeEvent) => {
        console.log("📥 Question deleted:", change);
        setQuestions((prev) => {
          const newQuestions = prev.filter((q) => q._id !== change.id);
          updateStats(newQuestions);
          return newQuestions;
        });
        addRecentChange(change);
        setLastActivity(new Date());
        showToast("Question deleted", "warning");
        scrollToNewItem(false);
      });

      // Listen for poll events
      newSocket.on("poll", (questions: Question[]) => {
        console.log("📥 New Poll Received:", questions);
        setLastActivity(new Date());
        showToast(`New poll with ${questions.length} questions!`, "info");
        playNotificationSound();
        // Handle poll display
      });

      // Listen for generic data changes
      newSocket.on("data-changed", (change: DataChangeEvent) => {
        console.log("📥 Data changed:", change);
        addRecentChange(change);
        setLastActivity(new Date());
        scrollToNewItem(false);
      });

      return newSocket;
    };

    const socketInstance = connectSocket();

    // Cleanup on unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      socketInstance.close();
    };
  }, []); // Empty dependency array to run only once

  const addRecentChange = (change: DataChangeEvent) => {
    setRecentChanges((prev) => {
      const newChanges = [change, ...prev.slice(0, 9)]; // Keep last 10 changes
      return newChanges;
    });
  };

  const updateStats = (questionList: Question[]) => {
    const activeQuestions = questionList.filter(
      (q) => q.is_active && q.is_approved,
    ).length;
    setStats({
      totalQuestions: questionList.length,
      activeQuestions,
      recentAdditions: questionList.filter((q) => {
        const createdAt = new Date(q.created_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return createdAt > fiveMinutesAgo;
      }).length,
      lastUpdateTime: new Date(),
    });
  };

  const showToast = (message: string, type: "success" | "info" | "warning") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const playNotificationSound = () => {
    // Create a simple notification sound
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const addTestQuestion = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: `Test Question ${Date.now()}`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correct_answer: "Option A",
          explanation: "This is a test question",
          difficulty: "easy",
          concept: "Testing",
          is_active: true,
          is_approved: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add question");
      }

      console.log("✅ Question added successfully");
    } catch (error) {
      console.error("❌ Error adding question:", error);
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "insert":
        return "➕";
      case "update":
        return "✏️";
      case "delete":
        return "🗑️";
      case "replace":
        return "🔄";
      default:
        return "📄";
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "insert":
        return "text-green-600";
      case "update":
        return "text-blue-600";
      case "delete":
        return "text-red-600";
      case "replace":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Real-time Data Sync Demo</h1>
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              connected
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-sm font-medium">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Last Activity */}
          <div className="text-sm text-gray-500">
            Last activity: {lastActivity.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-blue-800 text-sm font-medium">
            Total Questions
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {stats.totalQuestions}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-green-800 text-sm font-medium">
            Active Questions
          </div>
          <div className="text-2xl font-bold text-green-900">
            {stats.activeQuestions}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-yellow-800 text-sm font-medium">
            Recent (5 min)
          </div>
          <div className="text-2xl font-bold text-yellow-900">
            {stats.recentAdditions}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-purple-800 text-sm font-medium">
            Connection Attempts
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {connectionAttempts}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={addTestQuestion}
            disabled={!connected}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              connected
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Adding..." : "Add Test Question"}
          </button>

          <button
            onClick={refreshData}
            disabled={!connected}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              connected
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm font-medium">
              Auto-refresh
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="refreshInterval" className="text-sm font-medium">
              Interval:
            </label>
            <select
              id="refreshInterval"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          </div>

          {stats.lastUpdateTime && (
            <div className="text-sm text-gray-500">
              Last updated: {stats.lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-2 rounded-lg shadow-lg border transform transition-all duration-300 ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : toast.type === "warning"
                    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {toast.type === "success"
                    ? "✅"
                    : toast.type === "warning"
                      ? "⚠️"
                      : "ℹ️"}
                </span>
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Questions ({questions.length})
            </h2>
            <div className="text-sm text-gray-500">
              {isLoading && <span className="animate-pulse">Loading...</span>}
            </div>
          </div>
          <div
            ref={questionsListRef}
            className="space-y-3 max-h-96 overflow-y-auto"
          >
            {questions.map((question) => (
              <div
                key={question._id}
                className={`border rounded-lg p-3 transition-all duration-500 hover:shadow-md ${
                  newItemIds.has(question._id)
                    ? "bg-green-50 border-green-300 shadow-lg transform scale-105"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {question.question}
                </div>
                <div className="text-xs text-gray-500 mb-2 flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      question.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : question.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {question.difficulty}
                  </span>
                  <span>{question.concept}</span>
                  <span>•</span>
                  <span>{question.options.length} options</span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      question.is_active && question.is_approved
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {question.is_active && question.is_approved
                      ? "Active"
                      : "Inactive"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(question.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📝</div>
                <div>No questions found.</div>
                <div className="text-sm">Add one to see real-time updates!</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Changes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Changes</h2>
          <div
            ref={recentChangesRef}
            className="space-y-2 max-h-96 overflow-y-auto"
          >
            {recentChanges.map((change, index) => (
              <div
                key={index}
                className={`border-l-4 pl-4 py-2 transition-all duration-300 ${
                  index === 0 ? "bg-blue-50 border-blue-400" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{getChangeIcon(change.type)}</span>
                  <span
                    className={`font-medium ${getChangeColor(change.type)}`}
                  >
                    {change.type.toUpperCase()}
                  </span>
                  <span className="text-gray-600">in {change.collection}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(change.timestamp).toLocaleTimeString()}
                </div>
                {change.data && (
                  <div className="text-xs bg-gray-50 p-2 rounded mt-2">
                    {change.data.question ||
                      JSON.stringify(change.data, null, 2).substring(0, 100)}
                  </div>
                )}
              </div>
            ))}
            {recentChanges.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <div>No recent changes.</div>
                <div className="text-sm">
                  Make some database changes to see them here!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataDemo;
