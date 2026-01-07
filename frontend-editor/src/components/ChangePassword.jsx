import React, { useState } from "react";
import { changePassword } from "../services/api";

function ChangePassword({ token, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "新密码与确认密码不匹配" });
      return;
    }

    if (newPassword.length < 1) {
      setMessage({ type: "error", text: "新密码不能为空" });
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(token, oldPassword, newPassword);
      setMessage({ type: "success", text: result.message || "密码修改成功" });
      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "修改失败" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "4px", maxWidth: "400px", margin: "20px auto" }}>
      <h2>修改密码</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>原密码：</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>新密码：</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>确认新密码：</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        {message.text && (
          <div
            style={{
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "4px",
              backgroundColor: message.type === "error" ? "#fee" : "#efe",
              color: message.type === "error" ? "#c00" : "#0c0"
            }}
          >
            {message.text}
          </div>
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 20px" }}>
            {loading ? "修改中..." : "修改密码"}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} style={{ padding: "8px 20px" }}>
              取消
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;

