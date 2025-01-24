const express = require('express');
const { getAllLists, getUserFollowingList } = require('../../../controllers');

const router = express.Router();

router.get('/', getAllLists);
router.get('/following/:userId', getUserFollowingList);

module.exports = router; 