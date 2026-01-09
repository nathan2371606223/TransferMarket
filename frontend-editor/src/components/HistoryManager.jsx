import React, { useState, useEffect } from "react";
import { fetchHistory, updateHistory, fetchTeams, checkDuplicateNames } from "../services/api";
import TeamSelector from "./TeamSelector";

function HistoryManager({ token }) {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [teamsByLevel, setTeamsByLevel] = useState({});
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamFilter, setTeamFilter] = useState("");
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const pageSize = 10;

  // Load teams and filter from localStorage on mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const data = await fetchTeams();
        setTeamsByLevel(data);
        // Load filter from localStorage
        const savedFilter = localStorage.getItem("history_team_filter_editor");
        if (savedFilter) {
          setTeamFilter(savedFilter);
        }
      } catch (err) {
        console.error("Failed to load teams", err);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [page, token, teamFilter]);

  // Save filter to localStorage when it changes
  useEffect(() => {
    if (teamFilter) {
      localStorage.setItem("history_team_filter_editor", teamFilter);
    } else {
      localStorage.removeItem("history_team_filter_editor");
    }
  }, [teamFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await fetchHistory(token, page, pageSize, teamFilter || undefined);
      console.log("History result:", result); // Debug log
      if (!result) {
        throw new Error("API 返回空响应");
      }
      setHistory(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to load history", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "未知错误";
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      alert(`加载历史记录失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (team) => {
    setTeamFilter(team);
    setPage(1); // Reset to first page when filter changes
  };

  const clearFilter = () => {
    setTeamFilter("");
    setPage(1);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditData({
      player1: record.player1,
      player2: record.player2 || "",
      player3: record.player3 || "",
      player4: record.player4 || "",
      team_out: record.team_out,
      team_in: record.team_in,
      price: record.price,
      remarks: record.remarks || "",
      status: record.status
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updateHistory(token, editingId, editData);
      setEditingId(null);
      loadHistory();
    } catch (err) {
      alert(err.response?.data?.message || "更新失败");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleCheckDuplicates = async () => {
    setCheckingDuplicates(true);
    setDuplicateResult(null);
    try {
      const result = await checkDuplicateNames(token);
      setDuplicateResult(result);
      if (result.duplicates.length === 0) {
        alert("未发现重复的球员名称。");
      } else {
        // Show detailed message
        let message = `发现 ${result.totalDuplicates} 个重复的球员名称：\n\n`;
        result.duplicates.slice(0, 10).forEach((dup, idx) => {
          message += `${idx + 1}. 球员 "${dup.player}" 出现在 ${dup.count} 条记录中\n`;
        });
        if (result.duplicates.length > 10) {
          message += `\n... 还有 ${result.duplicates.length - 10} 个重复球员名称`;
        }
        alert(message);
      }
    } catch (err) {
      alert(err.response?.data?.message || "检查重复名称失败");
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>转会历史管理</h1>
        <button
          onClick={handleCheckDuplicates}
          disabled={checkingDuplicates}
          style={{
            padding: "8px 16px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: checkingDuplicates ? "not-allowed" : "pointer",
            fontSize: "14px"
          }}
        >
          {checkingDuplicates ? "检查中..." : "检查重复名称"}
        </button>
      </div>

      {duplicateResult && duplicateResult.duplicates.length > 0 && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "4px", border: "1px solid #ffc107" }}>
          <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#856404" }}>
            发现 {duplicateResult.totalDuplicates} 个重复的球员名称（共检查 {duplicateResult.totalRecords} 条记录，包括已归档）
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {duplicateResult.duplicates.map((dup, idx) => (
              <div key={idx} style={{ marginBottom: "8px", fontSize: "14px" }}>
                <strong>"{dup.player}"</strong> 出现在 {dup.count} 条记录中：
                <ul style={{ margin: "5px 0 0 20px", padding: 0 }}>
                  {dup.records.slice(0, 5).map((rec, recIdx) => (
                    <li key={recIdx} style={{ marginBottom: "3px" }}>
                      ID: {rec.id} | {new Date(rec.created_at).toLocaleString("zh-CN")} | 
                      {rec.player1 && ` 球员1: ${rec.player1}`}
                      {rec.player2 && ` 球员2: ${rec.player2}`}
                      {rec.player3 && ` 球员3: ${rec.player3}`}
                      {rec.player4 && ` 球员4: ${rec.player4}`}
                      {rec.archived && " [已归档]"}
                    </li>
                  ))}
                  {dup.records.length > 5 && (
                    <li style={{ color: "#666", fontStyle: "italic" }}>
                      ... 还有 {dup.records.length - 5} 条记录
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <label style={{ fontWeight: "bold" }}>按球队筛选：</label>
          <div style={{ flex: "1", minWidth: "300px", maxWidth: "400px" }}>
            <TeamSelector
              teamsByLevel={teamsByLevel}
              loading={loadingTeams}
              value={teamFilter}
              onChange={handleFilterChange}
            />
          </div>
          {teamFilter && (
            <button onClick={clearFilter} style={{ padding: "5px 15px", cursor: "pointer" }}>
              清除筛选
            </button>
          )}
        </div>
        {teamFilter && (
          <div style={{ marginTop: "10px", color: "#666", fontSize: "14px" }}>
            当前筛选：{teamFilter}（显示转出或转入该球队的记录）
          </div>
        )}
      </div>

      {loading ? (
        <div>加载中...</div>
      ) : history.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          <p>暂无历史记录</p>
          <p style={{ fontSize: "14px", marginTop: "10px" }}>
            已批准或拒绝的申请将显示在这里
          </p>
        </div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>时间</th>
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
              {history.map((record) =>
                editingId === record.id ? (
                  <tr key={record.id} style={{ backgroundColor: record.archived ? "#f5f5f5" : "white" }}>
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
                        <div>
                          <label>状态</label>
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            style={{ width: "100%", padding: "5px" }}
                          >
                            <option value="approved">已批准</option>
                            <option value="rejected">已拒绝</option>
                          </select>
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
                  <tr key={record.id} style={{ backgroundColor: record.archived ? "#f5f5f5" : "white" }}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {new Date(record.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player1 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player2 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.team_out || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.team_in || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.price || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player3 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player4 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.remarks || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.status || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      <button onClick={() => handleEdit(record)}>编辑</button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <div>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                上一页
              </button>
              <span style={{ margin: "0 10px" }}>
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                下一页
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HistoryManager;

