const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { uploadDir } = require("../middlewares/leaveVoiceUpload");

const TOTAL_ANNUAL_LEAVES = 15;
const notificationController = require("./notification.controller");
/* ================= APPLY LEAVE ================= */
/*exports.applyLeave = (req, res) => {
  const userId = req.user.user_id;
  const { start_date, end_date, leave_type, reason } = req.body;

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (end < start) {
    return res.status(400).json({ message: "End date cannot be before start date" });
  }

  const currentYear = new Date().getFullYear();

  if (start.getFullYear() !== currentYear || end.getFullYear() !== currentYear) {
    return res.status(400).json({
      message: `Leave can be applied only for year ${currentYear}`
    });
  }

  const total_days =
    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const empSql = `SELECT employee_id FROM employees WHERE user_id = ?`;

  db.query(empSql, [userId], (err, empResult) => {
    if (err) return res.status(500).json(err);
    if (empResult.length === 0) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    const employeeId = empResult[0].employee_id;

    const usedSql = `
      SELECT IFNULL(SUM(total_days), 0) AS used
      FROM leaves
      WHERE employee_id = ?
      AND YEAR(start_date) = ?
      AND status IN ('approved','pending')
    `;

    db.query(usedSql, [employeeId, currentYear], (err, result) => {
      if (err) return res.status(500).json(err);

      const remaining = TOTAL_ANNUAL_LEAVES - result[0].used;

      if (total_days > remaining) {
        return res.status(400).json({
          message: "Insufficient leave balance",
          remaining_leaves: remaining
        });
      }

      const insertSql = `
        INSERT INTO leaves
        (employee_id, start_date, end_date, total_days, leave_type, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [employeeId, start_date, end_date, total_days, leave_type, reason],
        (err, result) => {
          if (err) return res.status(500).json(err);

          const leaveId = result.insertId;

          // Get employee name for notification
          const nameSql = `SELECT u.name FROM users u JOIN employees e ON u.user_id = e.user_id WHERE e.employee_id = ?`;
          db.query(nameSql, [employeeId], (err, nameResult) => {
            if (!err && nameResult.length > 0) {
              // Send notifications to admin and manager
              notificationController.notifyLeaveApplication(
                employeeId,
                leaveId,
                nameResult[0].name,
                start_date,
                end_date,
                total_days,
                leave_type
              ).catch(err => {
                console.error("Failed to send notifications:", err);
                // Don't fail the request if notification fails
              });
            }
          });

          res.status(201).json({
            message: "Leave applied successfully",
            leave_id: leaveId,
            remaining_leaves: remaining - total_days
          });
        }
      );
    });
  });
};
*/
exports.applyLeave = (req, res) => {
  const userId = req.user.user_id;
  const { start_date, end_date, leave_type, reason } = req.body;

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (end < start) {
    return res.status(400).json({ message: "End date cannot be before start date" });
  }

  const currentYear = new Date().getFullYear();

  if (start.getFullYear() !== currentYear || end.getFullYear() !== currentYear) {
    return res.status(400).json({
      message: `Leave can be applied only for year ${currentYear}`
    });
  }

  const total_days =
    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const reasonStr =
    typeof reason === "string" ? reason.trim() : reason != null ? String(reason).trim() : "";
  const hasVoiceFile = !!(req.file && req.file.buffer && req.file.buffer.length > 0);
  if (!reasonStr && !hasVoiceFile) {
    return res.status(400).json({
      message:
        "Please provide a written or dictated reason, or attach a voice note (at least one is required).",
    });
  }

  const empSql = `SELECT employee_id FROM employees WHERE user_id = ?`;

  db.query(empSql, [userId], (err, empResult) => {
    if (err) return res.status(500).json(err);
    if (empResult.length === 0) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    const employeeId = empResult[0].employee_id;

    const usedSql = `
      SELECT IFNULL(SUM(total_days), 0) AS used
      FROM leaves
      WHERE employee_id = ?
      AND YEAR(start_date) = ?
      AND status IN ('approved','pending')
    `;

    db.query(usedSql, [employeeId, currentYear], (err, result) => {
      if (err) return res.status(500).json(err);

      const remaining = TOTAL_ANNUAL_LEAVES - result[0].used;

      if (total_days > remaining) {
        return res.status(400).json({
          message: "Insufficient leave balance",
          remaining_leaves: remaining
        });
      }

      let voice_note_path = null;
      if (req.file && req.file.buffer && req.file.buffer.length > 0) {
        try {
          const ext = (req.file.mimetype && req.file.mimetype.includes("webm")) ? "webm" : "bin";
          const fname = `leave-${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
          fs.writeFileSync(path.join(uploadDir, fname), req.file.buffer);
          voice_note_path = `/uploads/leave-voice/${fname}`;
        } catch (writeErr) {
          console.error("Voice note write failed:", writeErr);
          return res.status(500).json({ message: "Could not save voice note. Try again without a recording." });
        }
      }

      const insertSql = `
        INSERT INTO leaves
        (employee_id, start_date, end_date, total_days, leave_type, reason, voice_note_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [employeeId, start_date, end_date, total_days, leave_type, reasonStr, voice_note_path],
        (err, result) => {
          if (err) return res.status(500).json(err);

          const leaveId = result.insertId;

          const nameSql = `
            SELECT u.name
            FROM users u
            JOIN employees e ON u.user_id = e.user_id
            WHERE e.employee_id = ?
          `;

          db.query(nameSql, [employeeId], (err, nameResult) => {
            if (!err && nameResult.length > 0) {
              notificationController
                .notifyLeaveApplication(
                  employeeId,
                  leaveId,
                  nameResult[0].name,
                  start_date,
                  end_date,
                  total_days,
                  leave_type
                )
                .catch((errN) => {
                  console.error("Notification failed:", errN);
                });
            }
          });

          res.status(201).json({
            message: "Leave applied successfully",
            leave_id: leaveId,
            remaining_leaves: remaining - total_days
          });
        }
      );
    });
  });
};


/* ================= GET LEAVE BALANCE ================= */
exports.getLeaveBalance = (req, res) => {
  const userId = req.user.user_id;
  const currentYear = new Date().getFullYear();

  const empSql = `SELECT employee_id FROM employees WHERE user_id = ?`;
  db.query(empSql, [userId], (err, empResult) => {
    if (err) return res.status(500).json(err);
    if (empResult.length === 0) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    const employeeId = empResult[0].employee_id;
    const usedSql = `
      SELECT IFNULL(SUM(total_days), 0) AS used
      FROM leaves
      WHERE employee_id = ?
      AND YEAR(start_date) = ?
      AND status IN ('approved', 'pending')
    `;

    db.query(usedSql, [employeeId, currentYear], (err, result) => {
      if (err) return res.status(500).json(err);
      const used = Number(result[0].used) || 0;
      const total = TOTAL_ANNUAL_LEAVES;
      const remaining = Math.max(0, total - used);

      res.json({
        total_leaves: total,
        used_leaves: used,
        remaining_leaves: remaining,
        year: currentYear
      });
    });
  });
};

/* ================= GET MY LEAVES ================= */
exports.getMyLeaves = (req, res) => {
  const userId = req.user.user_id;

  const sql = `
    SELECT l.*
       FROM leaves l
    JOIN employees e ON l.employee_id = e.employee_id
    WHERE e.user_id = ?
    ORDER BY l.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

/* ================= GET ALL LEAVES (ADMIN) ================= */
exports.getAllLeaves = (req, res) => {
  const sql = `
     SELECT
      l.leave_id,
      u.name AS employee_name,
      mu.name AS manager_name,
      l.start_date,
      l.end_date,
      l.total_days,
      l.leave_type,
      l.reason,
      l.status,
      l.voice_note_path,
      au.name AS approved_by_name,
      l.approved_at
    FROM leaves l
    JOIN employees e ON l.employee_id = e.employee_id
    JOIN users u ON e.user_id = u.user_id
    LEFT JOIN employees m ON e.manager_id = m.employee_id
    LEFT JOIN users mu ON m.user_id = mu.user_id
    LEFT JOIN users au ON l.approved_by = au.user_id
    ORDER BY l.created_at DESC
  `;


  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

/* ================= UPDATE LEAVE STATUS (ADMIN) ================= */
exports.updateLeaveStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const approverId = req.user.user_id;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const getLeaveSql = `
    SELECT l.leave_id, l.employee_id, l.leave_type, l.start_date, l.end_date, e.user_id AS employee_user_id
    FROM leaves l
    JOIN employees e ON l.employee_id = e.employee_id
    WHERE l.leave_id = ?
  `;

  db.query(getLeaveSql, [id], (err, leaveRows) => {
    if (err) return res.status(500).json(err);
    if (!leaveRows || leaveRows.length === 0) {
      return res.status(404).json({ message: "Leave not found" });
    }

    const leave = leaveRows[0];
    let employeeUserId = leave.employee_user_id ?? leave.employee_user_Id ?? (() => {
      const key = Object.keys(leave).find((k) => k.toLowerCase() === "employee_user_id");
      return key ? leave[key] : null;
    })();

    const updateSql = `
      UPDATE leaves
      SET status = ?, approved_by = ?, approved_at = NOW()
      WHERE leave_id = ?
    `;

    db.query(updateSql, [status, approverId, id], (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Leave not found" });
      }

      const sendNotification = (userId) => {
        if (!userId) {
          console.warn("Leave approval: no employee user_id for leave_id", id, "- notification not sent");
          return;
        }
        const startStr = leave.start_date ? (leave.start_date instanceof Date ? leave.start_date.toISOString().slice(0, 10) : String(leave.start_date).slice(0, 10)) : "";
        const endStr = leave.end_date ? (leave.end_date instanceof Date ? leave.end_date.toISOString().slice(0, 10) : String(leave.end_date).slice(0, 10)) : "";
        notificationController
          .notifyLeaveDecision(
            leave.leave_id,
            userId,
            status,
            leave.leave_type || "Leave",
            startStr,
            endStr
          )
          .then(() => {
            console.log("Leave decision notification sent to employee user_id:", userId);
          })
          .catch((err) => {
            console.error("Leave decision notification failed:", err);
          });
      };

      if (employeeUserId) {
        sendNotification(employeeUserId);
      } else if (leave.employee_id != null) {
        db.query("SELECT user_id FROM employees WHERE employee_id = ?", [leave.employee_id], (err2, empRows) => {
          let uid = null;
          if (!err2 && empRows && empRows.length > 0) {
            const row = empRows[0];
            uid = row.user_id ?? row.user_Id ?? (Object.keys(row).find((k) => k.toLowerCase() === "user_id") ? row[Object.keys(row).find((k) => k.toLowerCase() === "user_id")] : null);
          }
          sendNotification(uid);
        });
      } else {
        sendNotification(null);
      }

      res.json({ message: "Leave status updated successfully" });
    });
  });
};