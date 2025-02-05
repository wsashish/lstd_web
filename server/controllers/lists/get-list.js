const { db } = require('../../config/firebase');
const createError = require('http-errors');
const imageService = require('../../services/image.service');
const List = require('../../models/List.model');

const getList = async (req, res, next) => {
    try {
        const currentUserId = req.headers['user-id'] || null;
        const { page, limit } = req.query;
        const isPaginated = page && limit;

        // Get user details first if currentUserId is provided
        let userData = null;
        if (currentUserId) {
            const userDoc = await db.collection('users')
                .doc(currentUserId)
                .get();

            if (userDoc.exists) {
                const user = userDoc.data();
                userData = {
                    id: userDoc.id,
                    name: user.name,
                    email: user.email,
                    bio: user.bio || '',
                    phoneNo: user.phoneNo,
                    location: user.location,
                    profilePhotoUrl: user.profilePhotoUrl,
                    created_date: user.created_date,
                    bookMarksLists: user.bookMarksLists || [],
                    followers: user.followers || [],
                    following: user.following || [],
                    hotelBookmarks: user.hotelBookmarks || [],
                    hotelViewedLists: user.hotelViewedLists || [],
                    hotellikedLists: user.hotellikedLists || [],
                    likedLists: user.likedLists || [],
                    visitedRestaurants: user.visitedRestaurants || []
                };
            }
        }

        // Get valid users (not deleted and not blocked)
        const userQuery = await db.collection('users')
            .where('isDeleted', '==', false)
            .where('isBlocked', '==', false)
            .get();

        const validUserIds = userQuery.docs.map(doc => doc.id);

        // Get total count of lists from valid users
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



        // Apply pagination if page and limit are provided
        if (isPaginated) {
            const pageSize = parseInt(limit);
            const currentPage = parseInt(page);
            query = query
                .limit(pageSize)
                .offset((currentPage - 1) * pageSize);
        }

        // Get documents
        const querySnapshot = await query.get();

        const allLists = [];
        for (const doc of querySnapshot.docs) {
            // Use List model to validate and structure the data
            const listModel = List.fromFirestore(doc);
            const listData = {
                ...listModel.toFirestore(),
                id: listModel.id
            };

            // Add isLiked flag if currentUserId is provided
            if (currentUserId) {
                listData.isLiked = userData?.likedLists?.includes(doc.id) || false;
            }

            // Add hotels count instead of full details
            listData.hotelsCount = listData.hotels ? listData.hotels.length : 0;
            delete listData.hotels; // Remove full hotels array

            // Fetch basic creator data
            if (listData.created_by) {
                const userDoc = await db.collection('users').doc(listData.created_by).get();
                if (userDoc.exists) {
                    const creatorData = userDoc.data();
                    listData.creator = {
                        id: userDoc.id,
                        name: creatorData.name,
                        profile_pic: await imageService.getUserProfilePicUrl(userDoc.id)
                    };
                }
            }

            // Get comment count instead of full comments
            const commentsCount = await db.collection('comments')
                .where('itemId', '==', doc.id)
                .where('ishotel', '==', false)
                .count()
                .get();

            listData.commentsCount = commentsCount.data().count;
            delete listData.comments; // Remove comments array if it exists

            allLists.push(listData);
        }

        // Organize lists into categories
        const categorizedLists = {
            recent: [...allLists].sort((a, b) => b.created_date - a.created_date).slice(0, isPaginated ? undefined : 10),
            mostLiked: [...allLists].sort((a, b) => b.likes - a.likes).slice(0, isPaginated ? undefined : 10),
            mostViewed: [...allLists].sort((a, b) => b.views - a.views).slice(0, isPaginated ? undefined : 10),
            topRated: [...allLists].sort((a, b) => b.averageRating - a.averageRating).slice(0, isPaginated ? undefined : 10)
        };

        // Add user-specific lists if currentUserId is provided
        if (currentUserId && userData) {
            // Get user's lists
            categorizedLists.userList = allLists.filter(list => list.created_by === currentUserId);

            // Get following user's lists
            const validFollowing = userData.following.filter(userId => validUserIds.includes(userId));
            categorizedLists.following = allLists.filter(list =>
                validFollowing.includes(list.created_by)
            );
        }

        const response = {
            success: true,
            data: categorizedLists,
            total,
            user: userData
        };

        // Add pagination info if paginated
        if (isPaginated) {
            const pageSize = parseInt(limit);
            const currentPage = parseInt(page);
            response.pagination = {
                currentPage,
                pageSize,
                total,
                hasMore: total > currentPage * pageSize
            };
        }

        res.json(response);
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports = getList;
