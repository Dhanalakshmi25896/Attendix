const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

module.exports = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Attendance Portal - Employee API",
      version: "1.0.0"
    },
    servers: [
      { url: "http://localhost:8081/api" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },

  apis: [path.join(__dirname, "..", "routes", "employee.routes.js")]
});
