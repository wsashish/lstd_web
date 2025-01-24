const { db } = require('../../config/firebase');
const createError = require('http-errors');

const getAllLists = async (req, res, next) => {
    try {
        const {
            sort = 'recent',
            page = 1,
            limit = 10,
            lastVisible = null
        } = req.query;

        const pageSize = parseInt(limit);
        const currentPage = parseInt(page);

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

        // Apply pagination
        if (lastVisible) {
            const lastDoc = await db.collection('lists').doc(lastVisible).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        query = query.limit(pageSize);

        // Get documents
        const querySnapshot = await query.get();
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

        const lists = [];
        for (const doc of querySnapshot.docs) {
            const listData = doc.data();

            // Fetch hotels data
            const populatedHotels = await Promise.all((listData.hotels || []).map(async (hotel) => {
                const hotelDoc = await db.collection('hotels').doc(hotel.placeId).get();
                if (hotelDoc.exists) {
                    return {
                        placeId: hotel.placeId,
                        ...hotelDoc.data()
                    };
                }
                return null;
            }));

            // Fetch user data
            let created = null;
            if (listData.created_by) {
                const userDoc = await db.collection('users').doc(listData.created_by).get();
                if (userDoc.exists) {
                    created = {
                        id: userDoc.id,
                        ...userDoc.data()
                    };
                }
            }

            lists.push({
                id: doc.id,
                ...listData,
                hotels: populatedHotels.filter(hotel => hotel !== null),
                created
            });
        }

        res.json({
            success: true,
            data: lists,
            pagination: {
                currentPage,
                pageSize,
                lastVisible: lastVisibleDoc ? lastVisibleDoc.id : null,
                hasMore: querySnapshot.docs.length === pageSize
            }
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

module.exports = getAllLists;
