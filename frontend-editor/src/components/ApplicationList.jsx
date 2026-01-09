import React, { useState, useEffect } from "react";
import { fetchApplications, updateApplication, approveApplication, rejectApplication, deleteApplication } from "../services/api";

function ApplicationList({ token, onApproval }) {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending only
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadApplications();
  }, [statusFilter, token]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await fetchApplications(token, statusFilter || undefined);
      setApplications(data || []);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "加载失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, force = false) => {
    if (!force && !confirm("确认批准此申请？")) return;
    
    try {
      const result = await approveApplication(token, id, force);
      
      // Check if team count limit warning
      if (result.requiresConfirmation && result.exceededTeams) {
        const warningMsg = result.warning || `批准此申请将使以下球队的转会记录数达到或超过20条：${result.exceededTeams.map(t => `${t.team}(${t.currentCount})`).join(", ")}。是否继续？`;
        if (confirm(warningMsg)) {
          // User confirmed, approve with force=true
          return handleApprove(id, true);
        } else {
          // User cancelled
          return;
        }
      }
      
      setMessage({ type: "success", text: result.message || "已批准" });
      if (result.formatted && onApproval) {
        // Add formatted record to the list instead of showing popup
        onApproval(result.formatted, result.application);
      } else if (result.formatted) {
        // Fallback: show popup if onApproval callback is not provided
        alert(`已批准！\n\n格式化记录：\n${result.formatted}`);
      }
      loadApplications();
    } catch (err) {
      // Check if it's a team count limit error
      if (err.response?.status === 400 && err.response?.data?.requiresConfirmation) {
        const data = err.response.data;
        const warningMsg = data.warning || `批准此申请将使以下球队的转会记录数达到或超过20条：${data.exceededTeams?.map(t => `${t.team}(${t.currentCount})`).join(", ")}。是否继续？`;
        if (confirm(warningMsg)) {
          // User confirmed, approve with force=true
          return handleApprove(id, true);
        } else {
          // User cancelled
          return;
        }
      }
      setMessage({ type: "error", text: err.response?.data?.message || "批准失败" });
    }
  };

  const handleReject = async (id) => {
    if (!confirm("确认拒绝此申请？")) return;
    try {
      const result = await rejectApplication(token, id);
      setMessage({ type: "success", text: result.message || "已拒绝" });
      loadApplications();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "拒绝失败" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("确认删除此申请？此操作无法撤销。")) return;
    try {
      const result = await deleteApplication(token, id);
      setMessage({ type: "success", text: result.message || "已删除" });
      loadApplications();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "删除失败" });
    }
  };

  const handleEdit = (app) => {
    setEditingId(app.id);
    setEditData({
      player1: app.player1,
      player2: app.player2 || "",
      player3: app.player3 || "",
      player4: app.player4 || "",
      team_out: app.team_out,
      team_in: app.team_in,
      price: app.price,
      remarks: app.remarks || ""
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updateApplication(token, editingId, editData);
      setMessage({ type: "success", text: "更新成功" });
      setEditingId(null);
      loadApplications();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "更新失败" });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <h1>转会申请管理</h1>

      <div style={{ marginBottom: "20px" }}>
        <label>状态筛选：</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="pending">待处理</option>
          <option value="">全部</option>
          <option value="approved">已批准</option>
          <option value="rejected">已拒绝</option>
        </select>
        <span style={{ marginLeft: "10px", color: "#666", fontSize: "14px" }}>
          （已批准/拒绝的申请可在历史管理页面查看）
        </span>
      </div>

      {message.text && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "4px",
            backgroundColor: message.type === "error" ? "#fee" : "#efe",
            color: message.type === "error" ? "#c00" : "#0c0"
          }}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div>加载中...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>版本</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>ID</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>球员1</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>球员2</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>转出球队</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>转入球队</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>价格</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>球员3</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>球员4</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>备注</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>状态</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const originalData = app.original_data ? (typeof app.original_data === 'string' ? JSON.parse(app.original_data) : app.original_data) : null;
              const hasEdits = originalData !== null;
              
              return (
                <React.Fragment key={app.id}>
                  {editingId === app.id ? (
                    <tr>
                      <td colSpan={12} style={{ border: "1px solid #ddd", padding: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                      <div>
                        <label>球员1 *</label>
                        <input
                          type="text"
                          value={editData.player1}
                          onChange={(e) => setEditData({ ...editData, player1: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                      <div>
                        <label>球员2</label>
                        <input
                          type="text"
                          value={editData.player2}
                          onChange={(e) => setEditData({ ...editData, player2: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                      <div>
                        <label>转出球队 *</label>
                        <input
                          type="text"
                          value={editData.team_out}
                          onChange={(e) => setEditData({ ...editData, team_out: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                      <div>
                        <label>转入球队 *</label>
                        <input
                          type="text"
                          value={editData.team_in}
                          onChange={(e) => setEditData({ ...editData, team_in: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                      <div>
                        <label>价格 *</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={editData.price}
                          onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                      <div>
                        <label>球员3</label>
                        <input
                          type="text"
                          value={editData.player3}
                          onChange={(e) => setEditData({ ...editData, player3: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                      <div>
                        <label>球员4</label>
                        <input
                          type="text"
                          value={editData.player4}
                          onChange={(e) => setEditData({ ...editData, player4: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                      <div>
                        <label>备注</label>
                        <input
                          type="text"
                          value={editData.remarks}
                          onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                          style={{ width: "100%", padding: "5px" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: "10px" }}>
                      <button onClick={handleSaveEdit} style={{ marginRight: "10px" }}>
                        保存
                      </button>
                      <button onClick={handleCancelEdit}>取消</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* Original version row (if edited) */}
                  {hasEdits && (
                    <tr style={{ backgroundColor: "#fff9e6" }}>
                      <td style={{ border: "1px solid #ddd", padding: "8px", fontWeight: "bold", color: "#666" }}>
                        原始
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.id}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.player1 || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.player2 || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.team_out || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.team_in || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.price || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.player3 || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.player4 || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>{originalData.remarks || ""}</td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }} colSpan={2}></td>
                    </tr>
                  )}
                  {/* Current/Edited version row */}
                  <tr style={{ backgroundColor: hasEdits ? "#e6f7ff" : "transparent" }}>
                    <td style={{ border: "1px solid #ddd", padding: "8px", fontWeight: "bold", color: hasEdits ? "#1890ff" : "inherit" }}>
                      {hasEdits ? "已编辑" : ""}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.id}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.player1 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.player2 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.team_out || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.team_in || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.price || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.player3 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.player4 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.remarks || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{app.status || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {app.status === "pending" && (
                        <>
                          <button onClick={() => handleEdit(app)} style={{ marginRight: "5px" }}>
                            编辑
                          </button>
                          <button onClick={() => handleApprove(app.id)} style={{ marginRight: "5px", backgroundColor: "#0c0", color: "white" }}>
                            批准
                          </button>
                          <button onClick={() => handleReject(app.id)} style={{ marginRight: "5px", backgroundColor: "#c00", color: "white" }}>
                            拒绝
                          </button>
                          <button onClick={() => handleDelete(app.id)} style={{ backgroundColor: "#800", color: "white" }}>
                            删除
                          </button>
                        </>
                      )}
                      {app.status === "approved" && (
                        <>
                          <span style={{ color: "#0c0", marginRight: "10px" }}>已批准</span>
                          <button onClick={() => handleDelete(app.id)} style={{ backgroundColor: "#800", color: "white" }}>
                            删除
                          </button>
                        </>
                      )}
                      {app.status === "rejected" && (
                        <>
                          <span style={{ color: "#c00", marginRight: "10px" }}>已拒绝</span>
                          <button onClick={() => handleDelete(app.id)} style={{ backgroundColor: "#800", color: "white" }}>
                            删除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                </>
              )}
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ApplicationList;

