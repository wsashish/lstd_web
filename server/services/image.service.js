const admin = require('firebase-admin');

class ImageService {
    constructor() {
        this.bucket = admin.storage().bucket(
            'gs://lstd-aaa28.appspot.com'
        );
    }

    async getUserProfilePicUrl(userId) {
        const profilePicPath = `users/profile_pic/user_${userId}`;
        try {
            const [files] = await this.bucket.getFiles({ prefix: profilePicPath });
            if (files && files.length > 0) {
                const [url] = await files[0].getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                });
                return url;
            }
            return null;
        } catch (error) {
            console.error('Error getting profile pic:', error);
            return null;
        }
    }

    // Add more image-related methods here as needed
    // For example: getHotelImageUrl, getListImageUrl, etc.
}

module.exports = new ImageService(); 