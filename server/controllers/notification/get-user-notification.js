const { db } = require('../../config/firebase');

const getUserNotification = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                success: false
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        // Get user's lists where they are the creator
        const userListsSnapshot = await db.collection('lists')
            .where('created_by', '==', userId)
            .get();

        const userListIds = userListsSnapshot.docs.map(doc => doc.id);

        // Get notifications where user is the direct recipient
        const directNotificationsQuery = db.collection('notifications')
            .where('userToId', '==', userId);

        // Get notifications related to user's lists
        const listNotificationsQuery = db.collection('notifications')
            .where('listId', 'in', userListIds.length > 0 ? userListIds : ['dummy']);

        // Execute both queries
        const [directNotificationsSnapshot, listNotificationsSnapshot] = await Promise.all([
            directNotificationsQuery.get(),
            listNotificationsQuery.get()
        ]);

        // Combine and deduplicate notifications
        const notificationMap = new Map();

        // Add direct notifications
        directNotificationsSnapshot.forEach(doc => {
            notificationMap.set(doc.id, {
                id: doc.id,
                ...doc.data()
            });
        });

        // Add list notifications
        listNotificationsSnapshot.forEach(doc => {
            if (!notificationMap.has(doc.id)) {
                notificationMap.set(doc.id, {
                    id: doc.id,
                    ...doc.data()
                });
            }
        });

        // Convert to array and sort by createdDate
        let notifications = Array.from(notificationMap.values())
            .sort((a, b) => b.createdDate - a.createdDate);

        // Apply pagination
        const totalItems = notifications.length;
        const totalPages = Math.ceil(totalItems / limit);
        notifications = notifications.slice(startIndex, startIndex + limit);

        res.status(200).json({
            message: "success",
            success: true,
            data: {
                notifications,
                pagination: {
                    total: totalItems,
                    page,
                    totalPages,
                    limit
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({
            message: "Failed to fetch user notifications",
            success: false,
            error: error.message
        });
    }
};

module.exports = getUserNotification;
