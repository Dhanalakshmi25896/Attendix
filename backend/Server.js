require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const userSwagger = require("./swagger/swagger.user");
const employeeSwagger = require("./swagger/swagger.employee");
const leaveSwagger = require("./swagger/swagger.leave");
const activitySwagger = require("./swagger/swagger.activitylogs");

const userRoutes = require("./routes/user.routes");
const employeeRoutes = require("./routes/employee.routes");
const leaveRoutes = require("./routes/leave.routes");
const activityRoutes = require("./routes/activitylogs.routes");
const notificationRoutes = require("./routes/notification.routes");
const db = require("./config/db");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) =>
  res.json({
    message: "API is running",
    docs: {
      user: "http://localhost:8081/api-docs",
      employee: "http://localhost:8081/employee-api-docs",
      leave: "http://localhost:8081/leave-api-docs",
      activitylogs: "http://localhost:8081/activitylogs-api-docs"
    }
  })
);

// ✅ ROUTES
app.use("/api", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/activitylogs", activityRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ SWAGGER
app.use("/api-docs",
  swaggerUi.serveFiles(userSwagger),
  swaggerUi.setup(userSwagger)
);

app.use("/employee-api-docs",
  swaggerUi.serveFiles(employeeSwagger),
  swaggerUi.setup(employeeSwagger)
);

app.use("/leave-api-docs",
  swaggerUi.serveFiles(leaveSwagger),
  swaggerUi.setup(leaveSwagger)
);

app.use("/activitylogs-api-docs",
  swaggerUi.serveFiles(activitySwagger),
  swaggerUi.setup(activitySwagger)
);

app.listen(8081, () => {
  console.log("Server running on port 8081");
  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255),
      message TEXT,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createNotificationsTable, (err) => {
    if (err) console.error("Notifications table check failed:", err.message);
    else console.log("Notifications table ready");
  });

  db.query(
    "ALTER TABLE leaves ADD COLUMN voice_note_path VARCHAR(512) NULL",
    (err) => {
      const dup =
        err &&
        (err.code === "ER_DUP_FIELDNAME" || err.errno === 1060);
      if (err && !dup) {
        console.error("Leaves voice_note_path column:", err.message);
      }
    }
  );
});
