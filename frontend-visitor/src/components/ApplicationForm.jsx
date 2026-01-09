import React, { useState, useEffect } from "react";
import { submitApplications, fetchTeams } from "../services/api";
import TeamSelector from "./TeamSelector";

function ApplicationForm({ onAuthError }) {
  const [applications, setApplications] = useState([
    { player1: "", player2: "", player3: "", player4: "", team_out: "", team_in: "", price: "", remarks: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [teamsByLevel, setTeamsByLevel] = useState({});
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Load teams on component mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const data = await fetchTeams();
        setTeamsByLevel(data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          onAuthError && onAuthError();
        } else {
          setMessage({ type: "error", text: "加载球队列表失败" });
        }
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, []);

  const addApplication = () => {
    setApplications([
      ...applications,
      { player1: "", player2: "", player3: "", player4: "", team_out: "", team_in: "", price: "", remarks: "" }
    ]);
  };

  const removeApplication = (index) => {
    setApplications(applications.filter((_, i) => i !== index));
  };

  const updateApplication = (index, field, value) => {
    const updated = [...applications];
    updated[index][field] = value;
    setApplications(updated);
  };

  const validateApplication = (app) => {
    if (!app.player1?.trim()) return "球员1为必填项";
    if (!app.team_out?.trim()) return "转出球队为必填项";
    if (!app.team_in?.trim()) return "转入球队为必填项";
    if (!app.price?.trim()) return "价格为必填项";
    const priceNum = Number(app.price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || !Number.isInteger(priceNum)) {
      return "价格无效（必须为非负整数）";
    }
    return null;
  };

  const handleSubmit = async () => {
    setMessage({ type: "", text: "" });
    setDuplicateWarning(null);

    // Validate all applications
    const errors = [];
    applications.forEach((app, index) => {
      const error = validateApplication(app);
      if (error) errors.push(`申请 ${index + 1}: ${error}`);
    });

    if (errors.length > 0) {
      setMessage({ type: "error", text: errors.join("; ") });
      return;
    }

    // Prepare data
    const data = applications.map((app) => ({
      player1: app.player1.trim(),
      player2: app.player2?.trim() || null,
      player3: app.player3?.trim() || null,
      player4: app.player4?.trim() || null,
      team_out: app.team_out.trim(),
      team_in: app.team_in.trim(),
      price: Number(app.price),
      remarks: app.remarks?.trim() || null
    }));

    setSubmitting(true);
    try {
      const result = await submitApplications(data);
      if (result.duplicates > 0) {
        setDuplicateWarning(result);
        setMessage({ type: "warning", text: `检测到 ${result.duplicates} 条可能的重复申请，请确认后继续提交` });
      } else {
        setMessage({ type: "success", text: `成功提交 ${result.submitted} 条申请` });
        
        // Store submitted application IDs in localStorage
        if (result.details && result.details.submitted) {
          const myIds = JSON.parse(localStorage.getItem("my_application_ids") || "[]");
          const newIds = result.details.submitted.map(app => app.id);
          const updatedIds = [...new Set([...myIds, ...newIds])]; // Remove duplicates
          localStorage.setItem("my_application_ids", JSON.stringify(updatedIds));
        }
        
        // Reset form
        setApplications([
          { player1: "", player2: "", player3: "", player4: "", team_out: "", team_in: "", price: "", remarks: "" }
        ]);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onAuthError && onAuthError();
      } else {
        setMessage({ type: "error", text: err.response?.data?.message || "提交失败" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!duplicateWarning) return;

    const data = applications.map((app) => ({
      player1: app.player1.trim(),
      player2: app.player2?.trim() || null,
      player3: app.player3?.trim() || null,
      player4: app.player4?.trim() || null,
      team_out: app.team_out.trim(),
      team_in: app.team_in.trim(),
      price: Number(app.price),
      remarks: app.remarks?.trim() || null
    }));

    setSubmitting(true);
    try {
      // Force submit by passing force=true to skip duplicate check
      const result = await submitApplications(data, true);
      setMessage({ type: "success", text: `成功提交 ${result.submitted} 条申请` });
      
      // Store submitted application IDs in localStorage
      if (result.details && result.details.submitted) {
        const myIds = JSON.parse(localStorage.getItem("my_application_ids") || "[]");
        const newIds = result.details.submitted.map(app => app.id);
        const updatedIds = [...new Set([...myIds, ...newIds])]; // Remove duplicates
        localStorage.setItem("my_application_ids", JSON.stringify(updatedIds));
      }
      
      setDuplicateWarning(null);
      setApplications([
        { player1: "", player2: "", player3: "", player4: "", team_out: "", team_in: "", price: "", remarks: "" }
      ]);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onAuthError && onAuthError();
      } else {
        setMessage({ type: "error", text: err.response?.data?.message || "提交失败" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>提交转会申请</h1>

      {message.text && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "4px",
            backgroundColor: message.type === "error" ? "#fee" : message.type === "warning" ? "#ffe" : "#efe",
            color: message.type === "error" ? "#c00" : message.type === "warning" ? "#c80" : "#0c0"
          }}
        >
          {message.text}
        </div>
      )}

      {duplicateWarning && (
        <div style={{ padding: "15px", marginBottom: "20px", backgroundColor: "#ffe", borderRadius: "4px" }}>
          <h3>检测到可能的重复申请</h3>
          <p>系统检测到 {duplicateWarning.duplicates} 条申请可能与历史记录重复（相同价格且至少3个其他字段匹配）。</p>
          <p>请仔细检查后确认是否继续提交：</p>
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleConfirmSubmit} disabled={submitting} style={{ marginRight: "10px" }}>
              确认提交
            </button>
            <button onClick={() => setDuplicateWarning(null)}>取消</button>
          </div>
        </div>
      )}

      {applications.map((app, index) => (
        <div key={index} style={{ border: "1px solid #ddd", padding: "15px", marginBottom: "15px", borderRadius: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <h3>申请 {index + 1}</h3>
            {applications.length > 1 && (
              <button onClick={() => removeApplication(index)}>删除</button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            <div>
              <label>球员1 *</label>
              <input
                type="text"
                value={app.player1}
                onChange={(e) => updateApplication(index, "player1", e.target.value)}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label>球员2</label>
              <input
                type="text"
                value={app.player2}
                onChange={(e) => updateApplication(index, "player2", e.target.value)}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label>转出球队 *</label>
              <TeamSelector
                teamsByLevel={teamsByLevel}
                loading={loadingTeams}
                value={app.team_out}
                onChange={(value) => updateApplication(index, "team_out", value)}
              />
            </div>
            <div>
              <label>转入球队 *</label>
              <TeamSelector
                teamsByLevel={teamsByLevel}
                loading={loadingTeams}
                value={app.team_in}
                onChange={(value) => updateApplication(index, "team_in", value)}
              />
            </div>
            <div>
              <label>价格 *</label>
              <input
                type="number"
                step="1"
                min="0"
                value={app.price}
                onChange={(e) => updateApplication(index, "price", e.target.value)}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label>球员3</label>
              <input
                type="text"
                value={app.player3}
                onChange={(e) => updateApplication(index, "player3", e.target.value)}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label>球员4</label>
              <input
                type="text"
                value={app.player4}
                onChange={(e) => updateApplication(index, "player4", e.target.value)}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
            <div>
              <label>备注</label>
              <input
                type="text"
                value={app.remarks}
                onChange={(e) => updateApplication(index, "remarks", e.target.value)}
                style={{ width: "100%", padding: "5px" }}
              />
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "20px" }}>
        <button onClick={addApplication} style={{ marginRight: "10px" }}>
          添加申请
        </button>
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "提交中..." : "提交申请"}
        </button>
      </div>
    </div>
  );
}

export default ApplicationForm;

