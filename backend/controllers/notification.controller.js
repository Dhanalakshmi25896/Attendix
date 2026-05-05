const db = require("../config/db");

/* =====================================================
   SEND LEAVE APPLICATION NOTIFICATION (ADMIN + MANAGER)
===================================================== */
exports.notifyLeaveApplication = async (
  employeeId,
  leaveId,
  employeeName,
  startDate,
  endDate,
  totalDays,
  leaveType
) => {
  return new Promise((resolve, reject) => {
    // Get admin + manager user IDs (users have role_id, join roles for role_name)
    const sql = `
      SELECT DISTINCT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN employees e ON u.user_id = e.user_id
      WHERE LOWER(r.role_name) = 'admin'
         OR e.employee_id = (
           SELECT manager_id FROM employees WHERE employee_id = ?
         )
    `;

    db.query(sql, [employeeId], (err, users) => {
      if (err) return reject(err);
      if (!users.length) return resolve();

      const message = `${employeeName} applied for ${leaveType} leave (${startDate} to ${endDate}, ${totalDays} days)`;

      const values = users.map(u => [
        u.user_id,
        "New Leave Request",
        message,
        0
      ]);

      const insertSql = `
        INSERT INTO notifications (user_id, title, message, is_read)
        VALUES ?
      `;

      db.query(insertSql, [values], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

/* =====================================================
   NOTIFY EMPLOYEE WHEN LEAVE IS APPROVED OR REJECTED
===================================================== */
exports.notifyLeaveDecision = (leaveId, employeeUserId, status, leaveType, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    if (employeeUserId == null || employeeUserId === undefined) {
      return reject(new Error("employeeUserId is required"));
    }
    const isApproved = status === "approved";
    const title = isApproved ? "Leave Approved" : "Leave Rejected";
    const dateRange = [startDate, endDate].filter(Boolean).length === 2 ? `${startDate} to ${endDate}` : "requested dates";
    const message = isApproved
      ? `Your ${leaveType} leave (${dateRange}) has been approved.`
      : `Your ${leaveType} leave (${dateRange}) has been rejected.`;

    const sql = `
      INSERT INTO notifications (user_id, title, message, is_read)
      VALUES (?, ?, ?, 0)
    `;

    db.query(sql, [employeeUserId, title, message], (err) => {
      if (err) {
        console.error("notifications INSERT error:", err.message);
        return reject(err);
      }
      resolve();
    });
  });
};

/* ================= GET MY NOTIFICATIONS ================= */
exports.getMyNotifications = (req, res) => {
  const userId = req.user.user_id;

  const sql = `
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

/* ================= UNREAD COUNT ================= */
exports.getUnreadCount = (req, res) => {
  const userId = req.user.user_id;

  const sql = `
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE user_id = ? AND (is_read = 0 OR is_read IS NULL)
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json({ unread_count: rows[0].unread_count });
  });
};

/* ================= MARK AS READ (and remove – read notifications are deleted) ================= */
exports.markAsRead = (req, res) => {
  const userId = req.user.user_id;
  const { notification_id } = req.body;

  let sql;
  let params;

  if (notification_id) {
    sql = `
      DELETE FROM notifications
      WHERE notification_id = ? AND user_id = ?
    `;
    params = [notification_id, userId];
  } else {
    sql = `
      DELETE FROM notifications
      WHERE user_id = ?
    `;
    params = [userId];
  }

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Notification(s) marked as read and removed" });
  });
};
