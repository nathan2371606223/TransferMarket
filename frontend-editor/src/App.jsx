import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import ChangePassword from "./components/ChangePassword";
import ApplicationList from "./components/ApplicationList";
import HistoryManager from "./components/HistoryManager";
import ExportButtons from "./components/ExportButtons";

function App() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("applications");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <nav style={{ backgroundColor: "#333", color: "white", padding: "10px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "20px" }}>
            <button
              onClick={() => setActiveTab("applications")}
              style={{
                backgroundColor: activeTab === "applications" ? "#555" : "transparent",
                color: "white",
                border: "none",
                padding: "10px 20px",
                cursor: "pointer"
              }}
            >
              申请管理
            </button>
            <button
              onClick={() => setActiveTab("history")}
              style={{
                backgroundColor: activeTab === "history" ? "#555" : "transparent",
                color: "white",
                border: "none",
                padding: "10px 20px",
                cursor: "pointer"
              }}
            >
              历史管理
            </button>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowChangePassword(true)}
              style={{
                backgroundColor: "transparent",
                color: "white",
                border: "1px solid white",
                padding: "5px 15px",
                cursor: "pointer"
              }}
            >
              修改密码
            </button>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "transparent",
                color: "white",
                border: "1px solid white",
                padding: "5px 15px",
                cursor: "pointer"
              }}
            >
              退出
            </button>
          </div>
        </div>
      </nav>

      {showChangePassword && (
        <ChangePassword token={token} onClose={() => setShowChangePassword(false)} />
      )}

      {message && (
        <div
          style={{
            padding: "10px",
            margin: "20px",
            borderRadius: "4px",
            backgroundColor: "#efe",
            color: "#0c0"
          }}
        >
          {message}
        </div>
      )}

      {activeTab === "applications" && <ApplicationList token={token} />}
      {activeTab === "history" && (
        <>
          <ExportButtons token={token} onAction={setMessage} />
          <HistoryManager token={token} />
        </>
      )}
    </div>
  );
}

export default App;

