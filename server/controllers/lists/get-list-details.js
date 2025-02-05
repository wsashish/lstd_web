const { db } = require('../../config/firebase');
const imageService = require('../../services/image.service');
const createError = require('http-errors');

const getListDetails = async (req, res, next) => {

    try {
        const { listId } = req.params;

        if (!listId) {
            return next(createError(400, 'List ID is required'));
        }

        const listRef = db.collection('lists').doc(listId);
        const list = await listRef.get();

        const listData = list.data();

        if (!listData) {
            return next(createError(404, 'List not found'));
        }

        let hotels = [];

        if (!listData.hotels) {

            for (const listHotelData of listData.hotels) {
                let placeId = typeof listHotelData === 'object' && listHotelData['placeId'] ? listHotelData['placeId'] : listHotelData;

                const hotel = await db.collection('hotels').where('placeId', '==', placeId).get();
                const hotelData = hotel.docs[0].data();
                hotels.push(hotelData);
            }

            listData.hotels = hotels;
        }



        let commentRef = db.collection('comments').where('itemId', '==', listId);
        const comments = await commentRef.get();
        listData.comments = comments.docs.map(doc => doc.data());


        let creatorRef = db.collection('users').doc(listData.created_by);
        const creator = await creatorRef.get();
        listData.creator = {
            id: creator.id,
            name: creator.data().name,
            profile_picture: await imageService.getUserProfilePicUrl(creator.id)
        }


        // Increment views count
        const currentViews = listData.views || 0;
        await listRef.update({
            views: currentViews + 1
        });
        listData.views = currentViews + 1;

        res.json({
            success: true,
            data: listData
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports = { getListDetails };