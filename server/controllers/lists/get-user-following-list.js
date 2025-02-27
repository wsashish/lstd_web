const { db, admin } = require('../../config/firebase');
const imageService = require('../../services/image.service');

const getUserFollowingList = async (req, res) => {
    try {
        const userId = req.params.userId;
        const currentUserId = req.query.currentUserId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 50) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 50'
            });
        }

        // Get the user document to fetch their following list
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const following = userData.following || [];

        if (following.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: {
                    total: 0,
                    totalPages: 0,
                    currentPage: page,
                    limit,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
        }

        // Get total count first
        const totalQuery = await db.collection('lists')
            .where('created_by', 'in', following)
            .count()
            .get();

        const total = totalQuery.data().count;
        const totalPages = Math.ceil(total / limit);

        // Build the query with offset-based pagination
        const query = db.collection('lists')
            .where('created_by', 'in', following)
            .orderBy('created_date', 'desc')
            .limit(limit)
            .offset((page - 1) * limit);

        const listsSnapshot = await query.get();

        const lists = [];
        for (const doc of listsSnapshot.docs) {
            const listData = {
                id: doc.id,
                ...doc.data()
            };

            // Add isLiked flag
            listData.isLiked = listData.likedByUsers ? listData.likedByUsers.includes(currentUserId) : false;

            // Populate creator information
            const creatorDoc = await db.collection('users').doc(listData.created_by).get();
            if (creatorDoc.exists) {
                const creatorData = creatorDoc.data();
                listData.creator = {
                    id: creatorDoc.id,
                    name: creatorData.name,
                    email: creatorData.email,
                    profile_pic: await imageService.getUserProfilePicUrl(creatorDoc.id)
                };
            }

            // Populate hotel information
            if (listData.hotels && listData.hotels.length > 0) {
                const hotelPromises = listData.hotels.map(async (hotel) => {
                    const hotelDoc = await db.collection('hotels').doc(hotel.placeId).get();
                    if (hotelDoc.exists) {
                        return {
                            placeId: hotel.placeId,
                            ...hotelDoc.data()
                        };
                    }
                    return null;
                });

                const hotelDetails = await Promise.all(hotelPromises);
                listData.hotels = hotelDetails.filter(hotel => hotel !== null);
            } else {
                listData.hotels = [];
            }

            // Populate comments
            const commentsSnapshot = await db.collection('comments')
                .where('itemId', '==', doc.id)
                .where('ishotel', '==', false)
                .orderBy('CommentDate', 'desc')
                .get();

            const comments = [];
            for (const commentDoc of commentsSnapshot.docs) {
                const commentData = {
                    id: commentDoc.id,
                    ...commentDoc.data()
                };

                // Populate comment user information
                const commentUserDoc = await db.collection('users').doc(commentData.userId).get();
                if (commentUserDoc.exists) {
                    const userData = commentUserDoc.data();
                    commentData.user = {
                        id: commentUserDoc.id,
                        name: userData.name,
                        profile_pic: await imageService.getUserProfilePicUrl(commentUserDoc.id)
                    };
                }

                comments.push(commentData);
            }

            listData.comments = comments;
            lists.push(listData);
        }

        res.status(200).json({
            success: true,
            data: lists,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error getting following lists:', error);
        res.status(500).json({ error: 'Failed to get following lists' });
    }
};

module.exports = getUserFollowingList;
