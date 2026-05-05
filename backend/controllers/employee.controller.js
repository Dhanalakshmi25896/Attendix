const db = require("../config/db");
const bcrypt = require("bcryptjs");

/* ================= GET EMPLOYEES ================= */
exports.getEmployees = (req, res) => {
  const sql = `
    SELECT e.*, u.name, u.email, r.role_name,
    mu.name AS manager_name
    FROM employees e
    JOIN users u ON e.user_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
     LEFT JOIN employees m ON e.manager_id = m.employee_id
    LEFT JOIN users mu ON m.user_id = mu.user_id
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(results);
  });
};

/* ================= GET MYEMPLOYEE DETAILS ================= */

exports.getMyEmployeeDetails = (req, res) => {
  const userId = req.user.user_id;

  const sql = `
    SELECT 
      u.user_id,
      u.name,
      u.email,
      r.role_name AS role,
      e.employee_code,
      e.position,
      e.department,
      e.phone_number,
      e.manager_id,
      e.joining_date,
      e.relieving_date
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN employees e ON u.user_id = e.user_id
    WHERE u.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch employee details",
        error: err
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json(results[0]);
  });
};

/* ================= CREATE EMPLOYEE (ADMIN ONLY) ================= */
exports.createEmployee = async (req, res) => {
  const {
    name,
    email,
    password,
    role = "employee",
    employee_code,
    position,
    department,
    phone_number,
    manager_id,
    joining_date,
    relieving_date,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("SELECT user_id FROM users WHERE email = ?", [email], (err, exists) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      if (exists.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const roleSql = "SELECT role_id FROM roles WHERE role_name = ?";
      db.query(roleSql, [role], (errRole, roleResult) => {
        if (errRole || roleResult.length === 0) {
          return res.status(400).json({ message: "Invalid role" });
        }

        const role_id = roleResult[0].role_id;

        const userSql = `
          INSERT INTO users (name, email, password, role_id)
          VALUES (?, ?, ?, ?)
        `;

        db.query(userSql, [name, email, hashedPassword, role_id], (errUser, userRes) => {
          if (errUser) {
            return res.status(500).json({ message: "User creation failed", error: errUser });
          }

          const user_id = userRes.insertId;

          const empSql = `
            INSERT INTO employees
            (user_id, employee_code, position, department, phone_number, manager_id, joining_date, relieving_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const mgrRaw = manager_id;
          const mgr =
            mgrRaw === "" || mgrRaw === undefined || mgrRaw === null
              ? null
              : Number(mgrRaw);

          db.query(
            empSql,
            [
              user_id,
              employee_code || null,
              position || null,
              department || null,
              phone_number || null,
              Number.isFinite(mgr) ? mgr : null,
              joining_date || null,
              relieving_date || null,
            ],
            (errEmp) => {
              if (errEmp) {
                db.query("DELETE FROM users WHERE user_id = ?", [user_id], () => {});
                return res.status(500).json({
                  message: "Employee profile creation failed",
                  error: errEmp,
                });
              }

              res.status(201).json({
                message: "Employee created successfully",
                user_id,
              });
            }
          );
        });
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Create failed", error: err });
  }
};

/* ================= DELETE EMPLOYEE (ADMIN ONLY) ================= */
exports.deleteEmployee = (req, res) => {
  const { id } = req.params;

  // 🔒 role middleware should protect this route
  db.query("DELETE FROM users WHERE user_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ message: "Employee deleted" });
  });
};
/* ================= UPDATE EMPLOYEE (ADMIN ONLY) ================= */
exports.updateEmployee = (req, res) => {
  const { id } = req.params;

  const {
    name,
    email,
    role,
    employee_code,
    position,
    department,
    phone_number,
    manager_id,
    joining_date,
    relieving_date
  } = req.body;

  // 1️⃣ Get role_id if role is provided
  const roleSql = role
    ? "SELECT role_id FROM roles WHERE role_name = ?"
    : null;

  const updateUser = (role_id = null) => {
    const userFields = [];
    const userValues = [];

    if (name) {
      userFields.push("name = ?");
      userValues.push(name);
    }
    if (email) {
      userFields.push("email = ?");
      userValues.push(email);
    }
    if (role_id) {
      userFields.push("role_id = ?");
      userValues.push(role_id);
    }

    if (userFields.length === 0) {
      return updateEmployee();
    }

    const userSql = `
      UPDATE users
      SET ${userFields.join(", ")}
      WHERE user_id = ?
    `;

    db.query(userSql, [...userValues, id], (err) => {
      if (err)
        return res.status(500).json({ message: "User update failed", error: err });

      updateEmployee();
    });
  };

  const updateEmployee = () => {
    const empFields = [];
    const empValues = [];

    if (employee_code) {
      empFields.push("employee_code = ?");
      empValues.push(employee_code);
    }
    if (position) {
      empFields.push("position = ?");
      empValues.push(position);
    }
    if (department) {
      empFields.push("department = ?");
      empValues.push(department);
    }
    if (phone_number) {
      empFields.push("phone_number = ?");
      empValues.push(phone_number);
    }
    if (manager_id !== undefined) {
      empFields.push("manager_id = ?");
      empValues.push(manager_id || null);
    }
    if (joining_date) {
      empFields.push("joining_date = ?");
      empValues.push(joining_date);
    }
    if (relieving_date) {
  empFields.push("relieving_date = ?");
  empValues.push(relieving_date);
}

    if (empFields.length === 0) {
      return res.json({ message: "Nothing to update" });
    }

    const empSql = `
      UPDATE employees
      SET ${empFields.join(", ")}
      WHERE user_id = ?
    `;

    db.query(empSql, [...empValues, id], (err) => {
      if (err)
        return res.status(500).json({ message: "Employee update failed", error: err });

      res.json({ message: "Employee updated successfully" });
    });
  };

  // 🔁 Flow control
  if (role) {
    db.query(roleSql, [role], (err, roleResult) => {
      if (err || roleResult.length === 0) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updateUser(roleResult[0].role_id);
    });
  } else {
    updateUser();
  }
};
/* ================= SEARCH EMPLOYEES (READ-ONLY FOR ALL USERS) ================= */
exports.searchEmployees = (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: "Search query is required" });
  }

  const searchTerm = `%${query.trim()}%`;
  const sql = `
    SELECT 
      e.employee_id,
      u.user_id,
      u.name,
      u.email,
      r.role_name,
      e.employee_code,
      e.position,
      e.department,
      e.phone_number,
      e.joining_date,
      e.relieving_date,
      mu.name AS manager_name
    FROM employees e
    JOIN users u ON e.user_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN employees m ON e.manager_id = m.employee_id
    LEFT JOIN users mu ON m.user_id = mu.user_id
    WHERE 
      u.name LIKE ? OR 
      u.email LIKE ? OR 
      e.employee_code LIKE ? OR 
      e.position LIKE ? OR 
      e.department LIKE ?
    ORDER BY u.name ASC
    LIMIT 50
  `;

  db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        message: "Search failed", 
        error: err 
      });
    }
    res.json(results);
  });
};

/* ================= UPDATE OWN PHONE (EMPLOYEE) ================= */
exports.updateMyPhone = (req, res) => {
  const { phone_number } = req.body;
  const userIdFromToken = req.user.user_id;

  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const sql = `
    UPDATE employees
    SET phone_number = ?
    WHERE user_id = ?
  `;

  db.query(sql, [phone_number, userIdFromToken], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Update failed", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Phone number updated successfully" });
  });
};
