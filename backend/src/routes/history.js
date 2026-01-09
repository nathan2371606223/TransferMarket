const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { requireTeamToken } = require("../middleware/teamToken");
const { stringify } = require("csv-stringify/sync");

const router = express.Router();

// Get transfer history - requires team token
router.get("/", requireTeamToken, async (req, res) => {
  const { page = 1, pageSize = 10, archived, status, team } = req.query;
  const pageNum = Number(page);
  const sizeNum = Number(pageSize);
  const offset = (pageNum - 1) * sizeNum;

  let query = "SELECT * FROM tm_transfer_history";
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (archived !== undefined) {
    conditions.push(`archived = $${paramIndex++}`);
    params.push(archived === "true");
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  // Filter by team (matches either team_out or team_in)
  if (team) {
    conditions.push(`(team_out = $${paramIndex} OR team_in = $${paramIndex})`);
    params.push(team);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY created_at DESC";

  try {
    // Get total count - build count query separately
    let countQuery = "SELECT COUNT(*)::int as total FROM tm_transfer_history";
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
    }
    const { rows: countRows } = await pool.query(countQuery, params);
    const total = countRows[0]?.total || 0;

    // Get paginated data
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(sizeNum, offset);

    const { rows } = await pool.query(query, params);

    return res.json({
      data: rows,
      total,
      page: pageNum,
      pageSize: sizeNum
    });
  } catch (err) {
    console.error("Error fetching history:", err);
    return res.status(500).json({ 
      message: "获取历史失败",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// Update history record - requires auth
router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { player1, player2, player3, player4, team_out, team_in, price, remarks, status } = req.body || {};

  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (player1 !== undefined) {
      values.push(player1);
      updates.push(`player1=$${paramIndex++}`);
    }
    if (player2 !== undefined) {
      values.push(player2);
      updates.push(`player2=$${paramIndex++}`);
    }
    if (player3 !== undefined) {
      values.push(player3);
      updates.push(`player3=$${paramIndex++}`);
    }
    if (player4 !== undefined) {
      values.push(player4);
      updates.push(`player4=$${paramIndex++}`);
    }
    if (team_out !== undefined) {
      values.push(team_out);
      updates.push(`team_out=$${paramIndex++}`);
    }
    if (team_in !== undefined) {
      values.push(team_in);
      updates.push(`team_in=$${paramIndex++}`);
    }
    if (price !== undefined) {
      values.push(Number(price));
      updates.push(`price=$${paramIndex++}`);
    }
    if (remarks !== undefined) {
      values.push(remarks);
      updates.push(`remarks=$${paramIndex++}`);
    }
    if (status !== undefined) {
      values.push(status);
      updates.push(`status=$${paramIndex++}`);
    }

    if (updates.length === 0) {
      const { rows } = await pool.query("SELECT * FROM tm_transfer_history WHERE id=$1", [id]);
      return res.json(rows[0] || null);
    }

    values.push(id);
    updates.push(`updated_at=NOW()`);
    const setClause = updates.join(", ");
    const updateSql = `UPDATE tm_transfer_history SET ${setClause} WHERE id=$${paramIndex} RETURNING *`;

    const { rows } = await pool.query(updateSql, values);
    return res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "更新失败" });
  }
});

// Archive all non-archived records - requires auth
router.post("/archive", authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE tm_transfer_history SET archived=true, updated_at=NOW() WHERE archived=false");
    return res.json({ message: "已归档所有记录" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "归档失败" });
  }
});

// Erase all history - requires auth
router.delete("/", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM tm_transfer_history");
    return res.json({ message: "已清空所有历史记录" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "清空失败" });
  }
});

// Export history as CSV - public endpoint
router.get("/export", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tm_transfer_history ORDER BY created_at DESC");

    const csvData = rows.map((r) => ({
      时间: new Date(r.created_at).toLocaleString("zh-CN"),
      球员1: r.player1 || "",
      球员2: r.player2 || "",
      球员3: r.player3 || "",
      球员4: r.player4 || "",
      转出球队: r.team_out || "",
      转入球队: r.team_in || "",
      价格: r.price || "",
      备注: r.remarks || "",
      状态: r.status || "",
      已归档: r.archived ? "是" : "否"
    }));

    const csv = stringify(csvData, {
      header: true,
      bom: true
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="transfer_history_${new Date().toISOString().split("T")[0]}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "导出失败" });
  }
});

module.exports = router;

