const { db } = require('../../config/firebase');
const createError = require('http-errors');
const imageService = require('../../services/image.service');

const getAllLists = async (req, res, next) => {
    try {
        const {
            sort = 'recent',
            page = 1,
            limit = 10,
            currentUserId = null
        } = req.query;

        const pageSize = parseInt(limit);
        const currentPage = parseInt(page);

        // Get total count first
        const totalQuery = await db.collection('lists')
            .where('isDeleted', '==', false)
            .where('listPublic', '==', true)
            .count()
            .get();

        const total = totalQuery.data().count;

        let listsRef = db.collection('lists');
        let query = listsRef
            .where('isDeleted', '==', false)
            .where('listPublic', '==', true);

        // Apply sorting
        switch (sort.toLowerCase()) {
            case 'liked':
                query = query.orderBy('likes', 'desc');
                break;
            case 'views':
                query = query.orderBy('views', 'desc');
                break;
            case 'rate':
                query = query.orderBy('averageRating', 'desc');
                break;
            case 'recent':
            default:
                query = query.orderBy('created_date', 'desc');
        }

        // Apply pagination using offset
        query = query
            .limit(pageSize)
            .offset((currentPage - 1) * pageSize);

        // Get documents
        const querySnapshot = await query.get();

        const lists = [];
        for (const doc of querySnapshot.docs) {
            const listData = {
                id: doc.id,
                ...doc.data()
            };

            // Add isLiked flag if currentUserId is provided
            if (currentUserId) {
                listData.isLiked = listData.likedByUsers ? listData.likedByUsers.includes(currentUserId) : false;
            }

            // Fetch creator data
            if (listData.created_by) {
                const userDoc = await db.collection('users').doc(listData.created_by).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    listData.creator = {
                        id: userDoc.id,
                        name: userData.name,
                        email: userData.email,
                        profile_pic: await imageService.getUserProfilePicUrl(userDoc.id)
                    };
                }
            }

            // Fetch hotels data
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

            // Fetch comments
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

        res.json({
            success: true,
            data: lists,
            pagination: {
                total,
                currentPage,
                pageSize,
                hasMore: total > currentPage * pageSize
            }
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports = getAllLists;
