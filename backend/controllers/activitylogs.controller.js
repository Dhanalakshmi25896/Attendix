const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function formatTimeOnly(date) {
  if (!date) return null;
  return new Date(date).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatDateOnly(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata"
  });
}


exports.loginActivity = (req, res) => {
  const user_id = req.user.user_id;

  const sql = `
    INSERT INTO activity_logs (user_id, login_time)
    VALUES (?, NOW())
  `;

  db.query(sql, [user_id], (err) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to record login activity",
        error: err
      });
    }

    res.json({ message: "Login activity recorded" });
  });
};

exports.logoutActivity = (req, res) => {
  const user_id = req.user.user_id;

  const sql = `
    UPDATE activity_logs
    SET 
      logout_time = NOW(),
      working_hours = SEC_TO_TIME(
        TIMESTAMPDIFF(SECOND, login_time, NOW())
      )
    WHERE user_id = ?
      AND logout_time IS NULL
    ORDER BY log_id DESC
    LIMIT 1
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to record logout activity",
        error: err
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "No active login session found"
      });
    }

    res.json({
      message: "Logout activity recorded with working hours"
    });
  });
};

exports.getMyActivityLogs = (req, res) => {
  const user_id = req.user.user_id;

  const sql = `
    SELECT 
      DATE(al.login_time) AS date,
      al.user_id,
      u.name AS user_name,
      al.ip_address,
      al.login_time,
      al.logout_time,
      al.working_hours
    FROM activity_logs al
    JOIN users u ON u.user_id = al.user_id
    WHERE al.user_id = ?
    ORDER BY al.login_time DESC
  `;

  db.query(sql, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }

    const data = rows.map(r => ({
      date: formatDateOnly(r.date),
      user_id: r.user_id,
      user_name: r.user_name,
      ip_address: r.ip_address,
      login_time: formatTimeOnly(r.login_time),
      logout_time: formatTimeOnly(r.logout_time),
      working_hours: r.working_hours
        
    }));

    res.json(data);
  });
};

exports.getAllActivityLogs = (req, res) => {
  const sql = `
    SELECT 
      DATE(al.login_time) AS date,
      al.user_id,
      u.name AS user_name,
      al.ip_address,
      al.login_time,
      al.logout_time,
      al.working_hours
    FROM activity_logs al
    JOIN users u ON u.user_id = al.user_id
    ORDER BY al.login_time DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }

    const data = rows.map(r => ({
      date: formatDateOnly(r.date),
      user_id: r.user_id,
      user_name: r.user_name,
      ip_address: r.ip_address,
      login_time: formatTimeOnly(r.login_time),
      logout_time: formatTimeOnly(r.logout_time),
      working_hours: r.working_hours
       
    }));

    res.json(data);
  });
};
