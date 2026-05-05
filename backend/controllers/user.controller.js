const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= SIGNUP ================= */
exports.signup = async (req, res) => {
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
    relieving_date
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, password required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Check email exists
    db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email],
      (err, exists) => {
        if (exists.length > 0) {
          return res.status(409).json({ message: "Email already exists" });
        }

        // 🔹 Get role_id
        const roleSql = "SELECT role_id FROM roles WHERE role_name = ?";
        db.query(roleSql, [role], (err, roleResult) => {
          if (err || roleResult.length === 0) {
            return res.status(400).json({ message: "Invalid role" });
          }

          const role_id = roleResult[0].role_id;

          // 🔹 Insert user
          const userSql = `
            INSERT INTO users (name, email, password, role_id)
            VALUES (?, ?, ?, ?)
          `;

          db.query(
            userSql,
            [name, email, hashedPassword, role_id],
            (err, userRes) => {
              if (err) {
                return res.status(500).json({
                  message: "User creation failed",
                  error: err
                });
              }

              const user_id = userRes.insertId;

              // 🔹 Insert employee
              const empSql = `
                INSERT INTO employees
                (user_id, employee_code, position, department, phone_number, manager_id, joining_date, relieving_date)
                VALUES (?, ?, ?, ?, ?, ?, ?,?)
              `;

              db.query(
                empSql,
                [
                  user_id,
                  employee_code || null,
                  position || null,
                  department || null,
                  phone_number || null,
                  manager_id || null,
                  joining_date || null,
                  relieving_date || null
                ],
                (err) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Employee creation failed",
                      error: err
                    });
                  }

                  res.status(201).json({ message: "Signup successful" });
                }
              );
            }
          );
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err });
  }
};

/* ================= LOGIN ================= */
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username & password required" });
  }

  // Support login with either username (name) or email
  const sql = `
    SELECT u.user_id, u.name, u.email, u.password, r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.name = ? OR u.email = ?
  `;

  db.query(sql, [username, username], async (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (results.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      role: user.role_name,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role_name
      }
    });
  });
};

