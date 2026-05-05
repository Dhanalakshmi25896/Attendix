const router = require("express").Router();
const userController = require("../controllers/user.controller");
const {verifyToken}  = require("../middlewares/auth.middleware");


const { isAdmin } = require("../middlewares/role.middleware");
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Signup, Login & Employee APIs
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Signup employee or admin
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 example: employee
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
 *     responses:
 *       201:
 *         description: Signup successful
 */
router.post("/signup", userController.signup);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login and get JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username (name) or email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", userController.login);


module.exports = router;
