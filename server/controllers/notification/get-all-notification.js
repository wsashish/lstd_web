const { db } = require('../../config/firebase');

const getAllNotification = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const totalDocs = await db.collection('notifications').get();
        const totalItems = totalDocs.size;
        const totalPages = Math.ceil(totalItems / limit);

        const notificationsSnapshot = await db.collection('notifications')
            .orderBy('createdDate', 'desc')
            .limit(limit)
            .offset(startIndex)
            .get();

        const notifications = [];
        let index = startIndex;

        notificationsSnapshot.forEach(doc => {
            notifications.push({
                index: index + 1,
                id: doc.id,
                ...doc.data()
            });
            index++;
        });

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
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            message: "Failed to fetch notifications",
            success: false,
            error: error.message
        });
    }
};

module.exports = getAllNotification;