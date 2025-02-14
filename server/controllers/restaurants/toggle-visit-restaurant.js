const { db } = require('../../config/firebase');

const toggleVisitRestaurant = async (req, res) => {
    try {
        const { userId, placeId } = req.body;
        const { imageUrl, imageName } = req.body;

        if (!userId || !placeId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Place ID are required'
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

        // Check if hotel exists
        const hotelDoc = await db.collection('hotels').doc(placeId).get();
        if (!hotelDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Check if visit record already exists
        const visitedRef = db.collection('hotelvisited');
        const existingVisit = await visitedRef
            .where('userId', '==', userId)
            .where('placeId', '==', placeId)
            .where('deleted', '==', false)
            .get();

        let result;
        let isVisiting = true; // Flag to track if we're visiting or unvisiting

        if (!existingVisit.empty) {
            // Update existing visit record
            const visitDoc = existingVisit.docs[0];
            const currentVisited = visitDoc.data().visited;
            isVisiting = !currentVisited;

            await visitDoc.ref.update({
                visited: isVisiting,
                viewedDate: new Date().toISOString()
            });

            result = {
                id: visitDoc.id,
                visited: isVisiting
            };
        } else {
            // Create new visit record with ID starting with 'V'
            const newVisitRef = visitedRef.doc('V' + userId + placeId);
            const visitData = {
                userId,
                placeId,
                visited: true,
                deleted: false,
                createdDate: new Date().toISOString(),
                viewedDate: new Date().toISOString(),
            };

            await newVisitRef.set(visitData);

            result = {
                id: newVisitRef.id,
                visited: true
            };
        }

        // Get current hotel data
        const hotelData = hotelDoc.data();
        const currentVisitedCount = hotelData.visitedCount || 0;
        const currentVisitedByUser = hotelData.visitedByUser || [];

        // Update hotel's visitedByUser array and count based on visit status
        let updatedVisitedByUser = currentVisitedByUser;
        let updatedVisitedCount = currentVisitedCount;

        if (isVisiting) {
            // Add user if not already in array
            if (!currentVisitedByUser.includes(userId)) {
                updatedVisitedByUser = [...currentVisitedByUser, userId];
                updatedVisitedCount = currentVisitedCount + 1;
            }
        } else {
            // Remove user from array
            updatedVisitedByUser = currentVisitedByUser.filter(id => id !== userId);
            updatedVisitedCount = Math.max(0, currentVisitedCount - 1);
        }

        // Update the hotel document
        const hotelRef = db.collection('hotels').doc(placeId);
        await hotelRef.update({
            visitedCount: updatedVisitedCount,
            visitedByUser: updatedVisitedByUser
        });

        // Update user's visited hotels
        const userRef = db.collection('users').doc(userId);
        const userData = userDoc.data();
        const visitedHotels = userData.visitedHotels || [];

        if (isVisiting) {
            // Add hotel if not already in array
            if (!visitedHotels.includes(placeId)) {
                await userRef.update({
                    visitedHotels: [...visitedHotels, placeId]
                });
            }
        } else {
            // Remove hotel from array
            if (visitedHotels.includes(placeId)) {
                await userRef.update({
                    visitedHotels: visitedHotels.filter(id => id !== placeId)
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error toggling restaurant visit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle restaurant visit',
            error: error.message
        });
    }
};

module.exports = {
    toggleVisitRestaurant
}; 