import React, { useState } from "react";

function FormattedRecords({ records, onClear }) {
  const [copied, setCopied] = useState(false);

  if (records.length === 0) {
    return null;
  }

  const allFormatted = records.map(r => r.formatted).join("\n");

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(allFormatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("复制失败，请手动选择文本复制");
    }
  };

  const handleExport = () => {
    const blob = new Blob([allFormatted], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted_records_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      padding: "20px", 
      marginTop: "40px", 
      border: "2px solid #4CAF50", 
      borderRadius: "8px",
      backgroundColor: "#f0f9f0",
      maxWidth: "1600px",
      margin: "40px auto 20px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ margin: 0, color: "#2e7d32" }}>
          已批准申请的格式化记录 ({records.length} 条)
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={handleCopyAll}
            style={{ 
              padding: "8px 16px", 
              backgroundColor: "#4CAF50", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {copied ? "已复制！" : "复制全部"}
          </button>
          <button 
            onClick={handleExport}
            style={{ 
              padding: "8px 16px", 
              backgroundColor: "#2196F3", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            导出为文件
          </button>
          <button 
            onClick={onClear}
            style={{ 
              padding: "8px 16px", 
              backgroundColor: "#f44336", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: "white", 
        border: "1px solid #ddd", 
        borderRadius: "4px", 
        padding: "15px",
        maxHeight: "400px",
        overflowY: "auto"
      }}>
        <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", fontSize: "14px" }}>
          {records.map((record, index) => (
            <div key={index} style={{ marginBottom: "8px", padding: "5px", backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white" }}>
              <span style={{ color: "#666", marginRight: "10px" }}>#{index + 1}</span>
              <span>{record.formatted}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        <p style={{ margin: "5px 0" }}>
          💡 提示：这些记录可以直接复制粘贴到预算模块的转会导入区域
        </p>
        <p style={{ margin: "5px 0" }}>
          格式：转出球队,转入球队,价格,球员1[,球员2][,球员3][,球员4]
        </p>
      </div>
    </div>
  );
}

export default FormattedRecords;

