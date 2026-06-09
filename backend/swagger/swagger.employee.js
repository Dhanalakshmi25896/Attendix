const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const API_PUBLIC_URL = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 8081}`;

module.exports = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Attendance Portal - Employee API",
      version: "1.0.0"
    },
    servers: [
      { url: `${API_PUBLIC_URL}/api` }
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
