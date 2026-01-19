import React, { useState, useEffect } from "react";
import { fetchMyTeamApplications, updateApplication } from "../services/api";

function MyApplications({ onAuthError, refreshTrigger }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load applications for user's team (where team appears in team_out or team_in)
  const loadApplications = async () => {
    setLoading(true);
    try {
      const teamApplications = await fetchMyTeamApplications();
      setApplications(teamApplications);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onAuthError && onAuthError();
      } else {
        setMessage({ type: "error", text: err.response?.data?.message || "加载失败" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Refresh when trigger changes (after submission)
  useEffect(() => {
    if (refreshTrigger) {
      loadApplications();
    }
  }, [refreshTrigger]);

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

  const validateEditData = (data) => {
    if (!data.player1?.trim()) return "球员1为必填项";
    if (!data.team_out?.trim()) return "转出球队为必填项";
    if (!data.team_in?.trim()) return "转入球队为必填项";
    if (data.price === undefined || data.price === null || data.price === "") return "价格为必填项";
    const priceNum = Number(data.price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || !Number.isInteger(priceNum)) {
      return "价格无效（必须为非负整数）";
    }
    return null;
  };

  const handleSaveEdit = async () => {
    // Validate required fields
    const validationError = validateEditData(editData);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    try {
      await updateApplication(editingId, editData);
      setMessage({ type: "success", text: "更新成功" });
      setEditingId(null);
      loadApplications();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onAuthError && onAuthError();
      } else {
        setMessage({ type: "error", text: err.response?.data?.message || "更新失败" });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  if (applications.length === 0 && !loading) {
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1>我的申请</h1>
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          <p>暂无待处理的申请</p>
          <p style={{ fontSize: "14px", marginTop: "10px" }}>
            已批准或拒绝的申请可在"转会历史"页面查看
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>我的申请</h1>
          <p style={{ color: "#666", fontSize: "14px", marginTop: "5px", marginBottom: 0 }}>
            {localStorage.getItem("token") 
              ? "管理员模式：显示所有待处理申请。已批准或拒绝的申请将不再显示在此处。"
              : "显示所有包含您所在球队的待处理申请（转出或转入）。已批准或拒绝的申请将不再显示在此处。"}
          </p>
        </div>
        <button onClick={loadApplications} disabled={loading} style={{ padding: "8px 16px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "加载中..." : "刷新"}
        </button>
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
            {applications.map((app) =>
              editingId === app.id ? (
                <tr key={app.id}>
                  <td colSpan={11} style={{ border: "1px solid #ddd", padding: "10px" }}>
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
                <tr key={app.id}>
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
                      <button onClick={() => handleEdit(app)}>编辑</button>
                    )}
                    {app.status !== "pending" && (
                      <span style={{ color: "#666" }}>已处理</span>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyApplications;

