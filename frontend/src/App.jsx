import "./App.css";
import { useState, useEffect } from "react";
import Header from "./Components/Header";
import Content from "./Components/Content";
import AuthForm from "./Components/AuthForm";
import Dashboard from "./Components/Dashboard";
import AnalyticsView from "./Components/AnalyticsView";

// API Base URL config (use proxy/local port in dev, same origin in prod)
const API_BASE = import.meta.env.DEV ? "http://localhost:8000" : "";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("landing");
  const [selectedShortCode, setSelectedShortCode] = useState("");
  const [appInitializing, setAppInitializing] = useState(true);

  // Authenticate user on load if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(storedToken);
            setPage("dashboard");
          } else {
            // Token is invalid/expired
            localStorage.removeItem("token");
            setToken("");
            setUser(null);
            setPage("landing");
          }
        } catch (err) {
          console.error("Initialization auth error:", err);
          // Offline or network issue, fallback to landing but keep token just in case
          setPage("landing");
        }
      } else {
        setPage("landing");
      }
      setAppInitializing(false);
    };

    initializeAuth();
  }, []);

  const handleLoginSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setPage("landing");
  };

  const handleNavigate = (targetPage) => {
    // If not logged in, prevent accessing dashboard or analytics
    if (!token && (targetPage === "dashboard" || targetPage === "analytics")) {
      setPage("landing");
      return;
    }
    setPage(targetPage);
  };

  // Spinner shown during the initial JWT validation request on tab load
  if (appInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <span className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        <p className="text-slate-400 text-sm mt-4 font-medium tracking-wide">Securely connecting to LinkShort...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Header
        user={user}
        page={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Pages Router Switch */}
      <main className="pb-16">
        {page === "landing" && (
          <Content
            onNavigateToAuth={() => handleNavigate("register")}
            API_BASE={API_BASE}
          />
        )}
        {(page === "login" || page === "register") && (
          <AuthForm
            onLoginSuccess={handleLoginSuccess}
            initialTab={page}
            API_BASE={API_BASE}
          />
        )}
        {page === "dashboard" && (
          <Dashboard
            token={token}
            onViewAnalytics={(code) => {
              setSelectedShortCode(code);
              handleNavigate("analytics");
            }}
            API_BASE={API_BASE}
          />
        )}
        {page === "analytics" && (
          <AnalyticsView
            token={token}
            shortCode={selectedShortCode}
            onBack={() => handleNavigate("dashboard")}
            API_BASE={API_BASE}
          />
        )}
      </main>
    </div>
  );
}

export default App;
