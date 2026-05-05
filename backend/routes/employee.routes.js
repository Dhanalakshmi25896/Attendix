
const router = require("express").Router();
const employeeController = require("../controllers/employee.controller");
const {verifyToken}  = require("../middlewares/auth.middleware");


const { isAdmin } = require("../middlewares/role.middleware");


/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get all employees (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee list
 *       403:
 *         description: Admin access only
 */
router.get(
  "/",
  verifyToken,
  isAdmin,          // 🔒 ADMIN CHECK
  employeeController.getEmployees
);
/**
 * @swagger
 * /employee/me:
 *   get:
 *     summary: Get my employee details (Employee)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My employee details
 */
router.get(
  "/me",
  verifyToken,
  employeeController.getMyEmployeeDetails
);
/**
 * @swagger
 * /employees/search:
 *   get:
 *     summary: Search employees (Read-only, all authenticated users)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for name, email, employee code, position, or department
 *     responses:
 *       200:
 *         description: Search results
 */
router.get(
  "/search",
  verifyToken,
  employeeController.searchEmployees
);

router.post(
  "/",
  verifyToken,
  isAdmin,
  employeeController.createEmployee
);

/**
 * @swagger
 * /employee/{id}:
 *   delete:
 *     summary: Delete employee (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee deleted
 */
router.delete(
  "/:id",
verifyToken,
  isAdmin,
  employeeController.deleteEmployee
);
/**
 * @swagger
 * /employee/{id}:
 *   put:
 *     summary: Update employee details (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               employee_code:
 *                 type: string
 *               position:
 *                 type: string
 *               department:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               manager_id:
 *                 type: integer
 *               joining_date:
 *                 type: string
 *                 format: date
 *               relieving_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Employee updated
 */
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  employeeController.updateEmployee
);
/**
 * @swagger
 * /employee/me/phone:
 *   patch:
 *     summary: Employee updates own phone number
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *             properties:
 *               phone_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone updated
 */
router.patch(
  "/me/phone",
  verifyToken,
  employeeController.updateMyPhone
);
module.exports = router;