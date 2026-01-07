import React, { useState, useEffect } from "react";
import { fetchHistory, fetchTeams } from "../services/api";
import TeamSelector from "./TeamSelector";

function HistoryViewer() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [teamsByLevel, setTeamsByLevel] = useState({});
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamFilter, setTeamFilter] = useState("");
  const pageSize = 10;

  // Load teams and filter from localStorage on mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const data = await fetchTeams();
        setTeamsByLevel(data);
        // Load filter from localStorage
        const savedFilter = localStorage.getItem("history_team_filter");
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
  }, [page, teamFilter]);

  // Save filter to localStorage when it changes
  useEffect(() => {
    if (teamFilter) {
      localStorage.setItem("history_team_filter", teamFilter);
    } else {
      localStorage.removeItem("history_team_filter");
    }
  }, [teamFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await fetchHistory(page, pageSize, teamFilter || undefined);
      setHistory(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error("Failed to load history", err);
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1>转会历史</h1>

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
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.team_out || ""}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.team_in || ""}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.price || ""}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player3 || ""}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.player4 || ""}</td>
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

