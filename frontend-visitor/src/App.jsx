import React, { useEffect, useState } from "react";
import ApplicationForm from "./components/ApplicationForm";
import HistoryViewer from "./components/HistoryViewer";
import MyApplications from "./components/MyApplications";
import TokenGate from "./components/TokenGate";
import { getStoredToken, setStoredToken } from "./services/api";

function App() {
  const [activeTab, setActiveTab] = useState("submit");
  const [tokenReady, setTokenReady] = useState(!!getStoredToken());
  const [prefillToken, setPrefillToken] = useState("");

  // Support ?token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setPrefillToken(urlToken);
    }
  }, []);

  const handleTokenValidated = (token) => {
    setStoredToken(token);
    setTokenReady(true);
  };

  const handleAuthError = () => {
    setTokenReady(false);
  };

  if (!tokenReady) {
    return <TokenGate initialToken={prefillToken} onValidated={handleTokenValidated} />;
  }

  return (
    <div>
      <nav style={{ backgroundColor: "#333", color: "white", padding: "10px 20px" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <button
            onClick={() => setActiveTab("submit")}
            style={{
              backgroundColor: activeTab === "submit" ? "#555" : "transparent",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer"
            }}
          >
            提交申请
          </button>
          <button
            onClick={() => setActiveTab("my-applications")}
            style={{
              backgroundColor: activeTab === "my-applications" ? "#555" : "transparent",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer"
            }}
          >
            我的申请
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
            转会历史
          </button>
        </div>
      </nav>

      {activeTab === "submit" && <ApplicationForm onAuthError={handleAuthError} />}
      {activeTab === "my-applications" && <MyApplications onAuthError={handleAuthError} />}
      {activeTab === "history" && <HistoryViewer onAuthError={handleAuthError} />}
    </div>
  );
}

export default App;

