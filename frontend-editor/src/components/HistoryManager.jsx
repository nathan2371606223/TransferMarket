import React, { useState, useEffect } from "react";
import { fetchHistory, updateHistory } from "../services/api";

function HistoryManager({ token }) {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const pageSize = 10;

  useEffect(() => {
    loadHistory();
  }, [page, token]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await fetchHistory(token, page, pageSize);
      console.log("History result:", result); // Debug log
      setHistory(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to load history", err);
      alert("加载历史记录失败: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <h1>转会历史管理</h1>

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
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>球员3</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>球员4</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>转出球队</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>转入球队</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>价格</th>
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
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player3 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player4 || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.team_out || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.team_in || ""}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.price || ""}</td>
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

