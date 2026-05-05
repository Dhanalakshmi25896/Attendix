const router = require("express").Router();
const {verifyToken} = require("../middlewares/auth.middleware");
const notificationController = require("../controllers/notification.controller");

router.get("/", verifyToken, notificationController.getMyNotifications);
router.get("/unread", verifyToken, notificationController.getUnreadCount);
router.post("/read", verifyToken, notificationController.markAsRead);

module.exports = router;
