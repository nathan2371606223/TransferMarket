import React, { useState } from "react";
import { archiveHistory, eraseHistory, exportHistoryCsv } from "../services/api";

function ExportButtons({ token, onAction }) {
  const [loading, setLoading] = useState("");

  const handleExport = async () => {
    try {
      const blob = await exportHistoryCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transfer_history_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      if (onAction) onAction("导出成功");
    } catch (err) {
      alert(err.response?.data?.message || "导出失败");
    }
  };

  const handleArchive = async () => {
    if (!confirm("确认归档所有历史记录？归档后的记录仅用于视觉区分（灰色背景），仍会参与重复检查。")) return;
    setLoading("archive");
    try {
      await archiveHistory(token);
      if (onAction) onAction("归档成功");
    } catch (err) {
      alert(err.response?.data?.message || "归档失败");
    } finally {
      setLoading("");
    }
  };

  const handleErase = async () => {
    if (!confirm("警告：此操作将永久删除所有历史记录，且无法恢复！\n\n确认清空所有历史记录？")) {
      return;
    }
    if (!confirm("请再次确认：您真的要删除所有历史记录吗？")) {
      return;
    }
    setLoading("erase");
    try {
      await eraseHistory(token);
      if (onAction) onAction("已清空所有历史记录");
    } catch (err) {
      alert(err.response?.data?.message || "清空失败");
    } finally {
      setLoading("");
    }
  };

  return (
    <div style={{ padding: "20px", display: "flex", gap: "10px" }}>
      <button onClick={handleExport} style={{ padding: "10px 20px" }}>
        导出历史
      </button>
      <button
        onClick={handleArchive}
        disabled={loading === "archive"}
        style={{ padding: "10px 20px", backgroundColor: "#ffa500", color: "white" }}
      >
        {loading === "archive" ? "归档中..." : "归档历史"}
      </button>
      <button
        onClick={handleErase}
        disabled={loading === "erase"}
        style={{ padding: "10px 20px", backgroundColor: "#c00", color: "white" }}
      >
        {loading === "erase" ? "清空中..." : "清空历史"}
      </button>
    </div>
  );
}

export default ExportButtons;

