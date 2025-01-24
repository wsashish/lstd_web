const { db } = require('../../config/firebase');

const readUserNotification = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notificationId = req.params.notificationId;

        if (!userId || !notificationId) {
            return res.status(400).json({
                message: "User ID and Notification ID are required",
                success: false
            });
        }

        // Get the notification document
        const notificationDoc = await db.collection('notifications').doc(notificationId).get();

        if (!notificationDoc.exists) {
            return res.status(404).json({
                message: "Notification not found",
                success: false
            });
        }

        const notificationData = notificationDoc.data();

        // Verify the notification belongs to the user (either directly or through a list)
        if (notificationData.userToId === userId) {
            // Direct notification - can update
            await notificationDoc.ref.update({ read: true });
        } else {
            // Check if it's a list notification where user is the creator
            const listDoc = await db.collection('lists')
                .doc(notificationData.listId)
                .get();

            if (!listDoc.exists || listDoc.data().created_by !== userId) {
                return res.status(403).json({
                    message: "Not authorized to mark this notification as read",
                    success: false
                });
            }

            await notificationDoc.ref.update({ read: true });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read successfully'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

module.exports = readUserNotification;
