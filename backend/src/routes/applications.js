const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { requireTeamToken } = require("../middleware/teamToken");
const { checkDuplicates } = require("../utils/duplicateChecker");
const { formatForBudget } = require("../utils/formatter");
const { createTokenAlert } = require("../utils/tokenAlerts");

const router = express.Router();

// Submit new application(s) - requires team token
router.post("/", requireTeamToken, async (req, res) => {
  const applications = req.body?.applications || [];
  const force = req.body?.force || false; // If true, skip duplicate check and submit anyway
  if (!Array.isArray(applications) || applications.length === 0) {
    return res.status(400).json({ message: "请提供转会申请" });
  }

  try {
    // Get all non-archived history records for duplicate checking
    const { rows: historyRecords } = await pool.query(
      "SELECT * FROM tm_transfer_history WHERE archived = false"
    );

    // Get all pending applications for duplicate checking
    const { rows: pendingApplications } = await pool.query(
      "SELECT * FROM tm_transfer_applications WHERE status = 'pending'"
    );

    // Combine history and pending applications for duplicate checking
    const allExistingRecords = [
      ...historyRecords.map(r => ({ ...r, source: 'history' })),
      ...pendingApplications.map(r => ({ ...r, source: 'pending', archived: false }))
    ];

    const submitted = [];
    const duplicates = [];
    const errors = [];

    for (const app of applications) {
      const { player1, player2, player3, player4, team_out, team_in, price, remarks } = app;

      // Check required fields (price can be 0, so check for null/undefined/empty string)
      if (!player1 || !team_out || !team_in || price === undefined || price === null || price === "") {
        errors.push({ application: app, reason: "缺少必填字段" });
        continue;
      }

      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0 || !Number.isInteger(priceNum)) {
        errors.push({ application: app, reason: "价格无效（必须为非负整数）" });
        continue;
      }

      // Check for duplicates against both history and pending applications (unless force=true)
      if (!force) {
        const dupMatches = checkDuplicates(
          { player1, player2, player3, player4, team_out, team_in, price: priceNum, remarks },
          allExistingRecords
        );

        if (dupMatches.length > 0) {
          duplicates.push({ application: app, matches: dupMatches });
          continue; // Don't insert if duplicates found (unless force=true)
        }
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

      // Token-team involvement check (non-blocking)
      try {
        const tokenTeamName = req.tokenTeam?.name || "";
        const involvedTeams = [team_out, team_in, player1, player2, player3, player4]
          .filter(Boolean);
        const matched = involvedTeams.some((t) => t === tokenTeamName);
        if (!matched) {
          const tokenTeamName = req.tokenTeam?.name || "未知团队";
          await createTokenAlert(
            pool,
            req.tokenTeam,
            "transfermarket",
            { team_out, team_in, price: priceNum, player1, player2, player3, player4, remarks },
            `令牌对应的球队 (${tokenTeamName}) 未在提交中出现`
          );
        }
      } catch (err) {
        console.error("Alert creation failed:", err);
      }
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

// Get all applications - public endpoint for pending, requires auth for all
router.get("/", async (req, res) => {
  const { status } = req.query;
  let query = "SELECT * FROM tm_transfer_applications";
  const params = [];

  // If no auth token, only allow viewing pending applications
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.substring(7) : null;
  const isAuthenticated = token && (() => {
    try {
      const jwt = require("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  })();

  if (!isAuthenticated) {
    // Public access: only pending applications
    query += " WHERE status = 'pending'";
  } else if (status) {
    // Authenticated access: can filter by status
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

// Update application - public endpoint for pending applications, requires auth for others
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { player1, player2, player3, player4, team_out, team_in, price, remarks } = req.body || {};

  try {
    // Check if application exists and get its status
    const { rows: existing } = await pool.query("SELECT * FROM tm_transfer_applications WHERE id=$1", [id]);
    if (!existing.length) {
      return res.status(404).json({ message: "申请未找到" });
    }

    // Check authentication
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.substring(7) : null;
    const isAuthenticated = token && (() => {
      try {
        const jwt = require("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
        jwt.verify(token, JWT_SECRET);
        return true;
      } catch {
        return false;
      }
    })();

    // Only allow public updates for pending applications
    if (!isAuthenticated && existing[0].status !== "pending") {
      return res.status(403).json({ message: "只能编辑待处理的申请" });
    }

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

