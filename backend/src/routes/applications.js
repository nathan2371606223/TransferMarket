const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { checkDuplicates } = require("../utils/duplicateChecker");
const { formatForBudget } = require("../utils/formatter");

const router = express.Router();

// Submit new application(s) - public endpoint
router.post("/", async (req, res) => {
  const applications = req.body?.applications || [];
  if (!Array.isArray(applications) || applications.length === 0) {
    return res.status(400).json({ message: "请提供转会申请" });
  }

  try {
    // Get all non-archived history records for duplicate checking
    const { rows: historyRecords } = await pool.query(
      "SELECT * FROM tm_transfer_history WHERE archived = false"
    );

    const submitted = [];
    const duplicates = [];
    const errors = [];

    for (const app of applications) {
      const { player1, player2, player3, player4, team_out, team_in, price, remarks } = app;

      if (!player1 || !team_out || !team_in || !price) {
        errors.push({ application: app, reason: "缺少必填字段" });
        continue;
      }

      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        errors.push({ application: app, reason: "价格无效" });
        continue;
      }

      // Check for duplicates
      const dupMatches = checkDuplicates(
        { player1, player2, player3, player4, team_out, team_in, price: priceNum, remarks },
        historyRecords
      );

      if (dupMatches.length > 0) {
        duplicates.push({ application: app, matches: dupMatches });
        continue; // Don't insert if duplicates found
      }

      // Insert application
      const { rows } = await pool.query(
        `INSERT INTO tm_transfer_applications 
         (player1, player2, player3, player4, team_out, team_in, price, remarks, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING *`,
        [player1 || null, player2 || null, player3 || null, player4 || null, team_out, team_in, priceNum, remarks || null]
      );

      submitted.push(rows[0]);
    }

    return res.json({
      success: submitted.length > 0,
      submitted: submitted.length,
      duplicates: duplicates.length,
      errors: errors.length,
      details: { submitted, duplicates, errors }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "提交失败" });
  }
});

// Get all applications - requires auth
router.get("/", authMiddleware, async (req, res) => {
  const { status } = req.query;
  let query = "SELECT * FROM tm_transfer_applications";
  const params = [];

  if (status) {
    query += " WHERE status = $1";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";

  try {
    const { rows } = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "获取申请失败" });
  }
});

// Update application - requires auth
router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { player1, player2, player3, player4, team_out, team_in, price, remarks } = req.body || {};

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

    if (updates.length === 0) {
      const { rows } = await pool.query("SELECT * FROM tm_transfer_applications WHERE id=$1", [id]);
      return res.json(rows[0] || null);
    }

    values.push(id);
    updates.push(`updated_at=NOW()`);
    const setClause = updates.join(", ");
    const updateSql = `UPDATE tm_transfer_applications SET ${setClause} WHERE id=$${paramIndex} RETURNING *`;

    const { rows } = await pool.query(updateSql, values);
    return res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "更新失败" });
  }
});

// Approve application - requires auth
router.post("/:id/approve", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get application
      const { rows: apps } = await client.query("SELECT * FROM tm_transfer_applications WHERE id=$1", [id]);
      if (!apps.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "申请未找到" });
      }

      const app = apps[0];

      // Create history record (before deleting application)
      await client.query(
        `INSERT INTO tm_transfer_history 
         (application_id, player1, player2, player3, player4, team_out, team_in, price, remarks, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved')`,
        [
          id,
          app.player1,
          app.player2 || null,
          app.player3 || null,
          app.player4 || null,
          app.team_out,
          app.team_in,
          app.price,
          app.remarks || null
        ]
      );

      // Delete application record after approval (data is safely stored in history)
      await client.query("DELETE FROM tm_transfer_applications WHERE id=$1", [id]);

      await client.query("COMMIT");

      // Generate formatted string for budget module
      const formatted = formatForBudget(app);

      return res.json({
        message: "已批准",
        formatted: formatted,
        application: app
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "批准失败" });
  }
});

// Reject application - requires auth
router.post("/:id/reject", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get application
      const { rows: apps } = await client.query("SELECT * FROM tm_transfer_applications WHERE id=$1", [id]);
      if (!apps.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "申请未找到" });
      }

      const app = apps[0];

      // Create history record (before deleting application)
      await client.query(
        `INSERT INTO tm_transfer_history 
         (application_id, player1, player2, player3, player4, team_out, team_in, price, remarks, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'rejected')`,
        [
          id,
          app.player1,
          app.player2 || null,
          app.player3 || null,
          app.player4 || null,
          app.team_out,
          app.team_in,
          app.price,
          app.remarks || null
        ]
      );

      // Delete application record after rejection (data is safely stored in history)
      await client.query("DELETE FROM tm_transfer_applications WHERE id=$1", [id]);

      await client.query("COMMIT");

      return res.json({ message: "已拒绝", application: app });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "拒绝失败" });
  }
});

module.exports = router;

