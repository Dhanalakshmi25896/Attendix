const router = require("express").Router();
const leaveController = require("../controllers/leave.controller");
const { verifyToken }  = require("../middlewares/auth.middleware");
const { leaveVoiceUpload } = require("../middlewares/leaveVoiceUpload");

const { isAdmin } = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Leaves
 *   description: Leave management APIs
 */

/**
 * @swagger
 * /leaves:
 *   post:
 *     summary: Apply for leave (Employee)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_date
 *               - end_date
 *               - leave_type
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-10
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-12
 *               leave_type:
 *                 type: string
 *                 enum: [Casual, Sick, Paid, Unpaid]
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leave_id:
 *                   type: integer
 *                 total_days:
 *                   type: integer
 *                 remaining_leaves:
 *                   type: integer
 */
router.post("/leaves", verifyToken, leaveVoiceUpload, leaveController.applyLeave);

/**
 * @swagger
 * /leave/me:
 *   get:
 *     summary: Get my leaves (Employee)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leaves
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   leave_id:
 *                     type: integer
 *                   start_date:
 *                     type: string
 *                     format: date
 *                   end_date:
 *                     type: string
 *                     format: date
 *                   total_days:
 *                     type: integer
 *                   leave_type:
 *                     type: string
 *                   reason:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [pending, approved, rejected]
 *                   approved_by:
 *                     type: integer
 *                     nullable: true
 *                   approved_at:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 */


router.get("/leave/me", verifyToken, leaveController.getMyLeaves);

/**
 * @swagger
 * /leave/balance:
 *   get:
 *     summary: Get my leave balance (Employee)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balance for current year
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_leaves:
 *                   type: integer
 *                 used_leaves:
 *                   type: integer
 *                 remaining_leaves:
 *                   type: integer
 *                 year:
 *                   type: integer
 */
router.get("/leave/balance", verifyToken, leaveController.getLeaveBalance);

/**
 * @swagger
 * /leaves:
 *   get:
 *     summary: Get all leaves (Admin)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All leave requests
 */
router.get("/leaves", verifyToken, isAdmin, leaveController.getAllLeaves);

/**
 * @swagger
 * /leave/{id}:
 *   put:
 *     summary: Approve or reject leave (Admin)
 *     tags: [Leaves]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Leave status updated
 */
router.put("/leave/:id", verifyToken, isAdmin, leaveController.updateLeaveStatus);

module.exports = router;