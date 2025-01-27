const router = require('express').Router();
const { getAllRestaurants } = require('../../../controllers/restaurants/get-all-resturants');
const { getUserVisitedRestaurants } = require('../../../controllers/restaurants/get-user-visited-resturants');

// GET /api/restaurants - Get all restaurants with optional sorting
router.get('/', getAllRestaurants);

// GET /api/restaurants/visited/:userId - Get restaurants visited by a specific user
router.get('/visited/:userId', getUserVisitedRestaurants);

module.exports = router; 