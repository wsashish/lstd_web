const express = require('express');
const { getAllLists, getUserFollowingList, getUserList, getList, getListDetails } = require('../../../controllers');
const { verifyToken } = require('../../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllLists);
router.get('/get-all', getList);

// Protected routes - require authentication
router.get('/:listId', verifyToken, getListDetails);
router.get('/following/:userId', verifyToken, getUserFollowingList);
router.get('/user/:userId', verifyToken, getUserList);

module.exports = router; 