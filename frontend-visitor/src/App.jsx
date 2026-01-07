import React, { useState } from "react";
import ApplicationForm from "./components/ApplicationForm";
import HistoryViewer from "./components/HistoryViewer";

function App() {
  const [activeTab, setActiveTab] = useState("submit");

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

      {activeTab === "submit" && <ApplicationForm />}
      {activeTab === "history" && <HistoryViewer />}
    </div>
  );
}

export default App;

