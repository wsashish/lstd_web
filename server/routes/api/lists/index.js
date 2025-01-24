const express = require('express');
const { getAllLists, getUserFollowingList, getUserList } = require('../../../controllers');

const router = express.Router();

router.get('/', getAllLists);
router.get('/following/:userId', getUserFollowingList);
router.get('/user/:userId', getUserList);

module.exports = router; 