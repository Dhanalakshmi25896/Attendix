const router = require("express").Router();
const activitylogsController = require("../controllers/activitylogs.controller");
const {verifyToken}  = require("../middlewares/auth.middleware");


const { isAdmin } = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Employee login/logout tracking
 */

/**
 * @swagger
 * /activity/login:
 *   post:
 *     summary: Employee login (check-in)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Login activity recorded
 *       401:
 *         description: Unauthorized
 */
router.post("/activity/login", verifyToken, activitylogsController.loginActivity);

/**
 * @swagger
 * /activity/logout:
 *   post:
 *     summary: Employee logout (check-out)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout activity recorded
 *       404:
 *         description: Login record not found
 */
router.post("/activity/logout", verifyToken, activitylogsController.logoutActivity);
/**
 * @swagger
 * /activity/my:
 *   get:
 *     summary: Get my activity logs
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My activity logs
 */

router.get(
  "/activity/my",
  verifyToken,
  activitylogsController.getMyActivityLogs
);
/**
 * @swagger
 * /activity:
 *   get:
 *     summary: Get all activity logs (Admin)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All activity logs
 *       403:
 *         description: Access denied
 */
router.get(
  "/activity",
  verifyToken,
 isAdmin,   // ✅ ADMIN ONLY
  activitylogsController.getAllActivityLogs
);

module.exports = router;

