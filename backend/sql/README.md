# Database scripts

- **notifications_table.sql** – Creates the `notifications` table. Run this (in the same DB as in `config/db.js`) if leave approval/rejection does not show in the employee notification bell. Each employee must have `user_id` set in the `employees` table so they can receive notifications.
