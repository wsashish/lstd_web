const router = require('express').Router();
const { addFollow, unfollow, removeFollow } = require('../../../controllers');

// Follow a user
router.post('/follow', addFollow);

// Unfollow a user
router.post('/unfollow', unfollow);

// Remove a follower
router.post('/remove-follower', removeFollow);

module.exports = router; 