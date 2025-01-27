const { db } = require('../../config/firebase');

const getUserVisitedRestaurants = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if user exists
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (pageNumber < 1 || limitNumber < 1 || limitNumber > 50) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 50'
            });
        }

        // Query hotelvisited collection for user's visited places
        const visitedRef = db.collection('hotelvisited');
        let query = visitedRef
            .where('userId', '==', userId)
            .where('visited', '==', true)
            .where('deleted', '==', false)
            .orderBy('viewedDate', 'desc');


        // Get total count for pagination
        const totalSnapshot = await query.count().get();
        const total = totalSnapshot.data().count;


        // Apply pagination
        query = query.limit(limitNumber).offset((pageNumber - 1) * limitNumber);
        const visitedSnapshot = await query.get();

        const restaurants = [];
        const hotelsRef = db.collection('hotels');

        // Get restaurant details for each visited place
        for (const doc of visitedSnapshot.docs) {
            const visitedData = doc.data();
            const placeId = visitedData.placeId;

            // Get restaurant details from hotels collection
            const hotelDoc = await hotelsRef.doc(placeId).get();

            if (hotelDoc.exists) {
                restaurants.push({
                    placeId: hotelDoc.placeId,
                    ...hotelDoc.data(),
                    visitedDate: visitedData.viewedDate,
                    visitId: doc.id
                });
            }
        }

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
        console.error('Error getting visited restaurants:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch visited restaurants',
            error: error.message
        });
    }
};

module.exports = {
    getUserVisitedRestaurants
};
