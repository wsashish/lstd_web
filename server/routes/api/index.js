const createError = require("http-errors");
const router = require("express").Router();

const notification = require("./notification");
const lists = require("./lists");
const users = require("./users");
const restaurants = require("./restaurants");

router.use("/notification", notification);
router.use("/lists", lists);
router.use("/users", users);
router.use("/restaurants", restaurants);

router.get("/test", (req, res) => {
    res.status(200).json({
        message: "success",
    });
});

router.get("/ping", (req, res) => {
    res.json({ success: "true", message: "successful request" });
});

module.exports = router;