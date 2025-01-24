const { db } = require('../../config/firebase');

const addNotification = async (req, res) => {
    try {
        const {
            placeId,
            userFromId,
            type,
            listId = '',
            hotel = false,
            commentId = '',
            comment = '',
            userToId = null
        } = req.body;

        // Validate required fields based on hotel flag
        if (!userFromId || !type) {
            return res.status(400).json({
                message: "userFromId and type are required",
                success: false
            });
        }

        // Validate fields based on notification type
        if (['bookmark', 'like', 'comment'].includes(type)) {
            if (!placeId && !listId) {
                return res.status(400).json({
                    message: `For ${type} notifications, either placeId or listId is required`,
                    success: false
                });
            }
        } else if (['share', 'follow'].includes(type)) {
            if (!userToId) {
                return res.status(400).json({
                    message: `For ${type} notifications, userToId is required`,
                    success: false
                });
            }
        }

        // Additional validation for hotel
        if (hotel && !placeId) {
            return res.status(400).json({
                message: "placeId is required when hotel is true",
                success: false
            });
        }

        // Generate unique ID based on combinations
        let uniqueId = `${userFromId}_${String(type).toUpperCase()}`;
        if (placeId) uniqueId += `_${placeId}`;
        if (listId) uniqueId += `_${listId}`;
        if (userToId) uniqueId += `_${userToId}`;

        // Fetch user details for userFrom
        const userDoc = await db.collection('users').doc(userFromId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        const userFromName = userDoc.data().name || userDoc.data().username || 'Unknown User';

        // Fetch user details for userTo if userToId is provided
        let userToName = '';
        if (userToId) {
            const userToDoc = await db.collection('users').doc(userToId).get();
            if (userToDoc.exists) {
                userToName = userToDoc.data().name || userToDoc.data().username || 'Unknown User';
            } else {
                return res.status(404).json({
                    message: "User To not found",
                    success: false
                });
            }
        }

        // Fetch list details if listId is provided
        let listName = '';
        if (listId) {
            const listDoc = await db.collection('lists').doc(listId).get();
            if (listDoc.exists) {
                listName = listDoc.data().name || '';
            }
        }

        const notificationData = {
            read: false,
            userFromName,
            placeId: placeId || '',
            userFromId,
            type,
            listId,
            userToName,
            createdDate: Date.now().toString(),
            hotel,
            commentId,
            comment,
            listName,
            userToId
        };

        // Use the generated uniqueId as the document ID
        await db.collection('notifications').doc(uniqueId).set(notificationData);

        res.status(201).json({
            message: "Notification added successfully",
            success: true,
            data: {
                id: uniqueId,
                ...notificationData
            }
        });
    } catch (error) {
        console.error('Error adding notification:', error);
        res.status(500).json({
            message: "Failed to add notification",
            success: false,
            error: error.message
        });
    }
};

module.exports = addNotification;
