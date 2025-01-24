const admin = require('firebase-admin');
const db = admin.firestore();

const unfollow = async (req, res) => {
    try {
        const { currentUserId, userToUnfollowId } = req.body;

        if (!currentUserId || !userToUnfollowId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Remove userToUnfollowId from current user's following list
        await db.collection('users').doc(currentUserId).update({
            following: admin.firestore.FieldValue.arrayRemove(userToUnfollowId)
        });

        // Remove currentUserId from target user's followers list
        await db.collection('users').doc(userToUnfollowId).update({
            followers: admin.firestore.FieldValue.arrayRemove(currentUserId)
        });

        return res.status(200).json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return res.status(500).json({ error: 'Failed to unfollow user' });
    }
};

module.exports = unfollow; 