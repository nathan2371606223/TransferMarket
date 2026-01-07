import React, { useState, useEffect } from "react";
import { fetchHistory } from "../services/api";

function HistoryViewer() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await fetchHistory(page, pageSize);
      setHistory(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1>转会历史</h1>

      {loading ? (
        <div>加载中...</div>
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
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
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
                </tr>
              ))}
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

export default HistoryViewer;

