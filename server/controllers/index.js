const getAllNotification = require("./notification/get-all-notification");
const addNotification = require("./notification/add-notification");
const getUserNotification = require("./notification/get-user-notification");
const readUserNotification = require("./notification/read-user-notfication");
const getAllLists = require("./lists/get-all-list");
const getUserFollowingList = require("./lists/get-user-following-list");
const getUserList = require("./lists/get-user-list");

module.exports = {
    getAllNotification,
    addNotification,
    getUserNotification,
    readUserNotification,
    getAllLists,
    getUserFollowingList,
    getUserList
};

