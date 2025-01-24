const express = require("express");
const {
    getAllNotification,
    addNotification,
    getUserNotification,
    readUserNotification
} = require("../../../controllers");

const router = express.Router();

router.get("/", getAllNotification);
router.get("/user/:userId", getUserNotification);
router.post("/add", addNotification);
router.post("/read/:userId/:notificationId", readUserNotification);

module.exports = router;