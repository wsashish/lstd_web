const express = require('express');
const router = express.Router();

const notification = require("./notification");
const lists = require("./lists");
const users = require("./users");
const restaurants = require("./restaurants");
const authRoutes = require('./auth');

router.use("/notification", notification);
router.use("/lists", lists);
router.use("/users", users);
router.use("/restaurants", restaurants);
router.use('/auth', authRoutes);

router.get("/test", (req, res) => {
    res.status(200).json({
        message: "success",
    });
});

router.get("/ping", (req, res) => {
    res.json({ success: "true", message: "successful request" });
});

module.exports = router;