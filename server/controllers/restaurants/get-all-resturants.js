const { db } = require('../../config/firebase');

const getAllRestaurants = async (req, res) => {
    try {
        const { sortBy = 'likes', page = 1, limit = 10 } = req.query; // Default sorting by likes, page 1, 10 items per page
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        // Validate parameters
        if (!['likes', 'rated'].includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sort parameter. Use "likes" or "rated"'
            });
        }

        if (pageNumber < 1 || limitNumber < 1 || limitNumber > 50) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 50'
            });
        }

        const hotelsRef = db.collection('hotels');
        let query = hotelsRef;

        // Add sorting based on the parameter
        if (sortBy === 'likes') {
            query = query.orderBy('likes', 'desc');
        } else if (sortBy === 'rated') {
            query = query.orderBy('rating', 'desc');
        }

        // Get total count for pagination
        const totalSnapshot = await query.count().get();
        const total = totalSnapshot.data().count;

        // Apply pagination
        query = query.limit(limitNumber).offset((pageNumber - 1) * limitNumber);
        const snapshot = await query.get();

        const restaurants = [];
        snapshot.forEach(doc => {
            restaurants.push({
                id: doc.id,
                ...doc.data()
            });
        });

        const totalPages = Math.ceil(total / limitNumber);

        return res.status(200).json({
            success: true,
            data: restaurants,
            pagination: {
                total,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        });

    } catch (error) {
        console.error('Error getting restaurants:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurants',
            error: error.message
        });
    }
};

module.exports = {
    getAllRestaurants
};
