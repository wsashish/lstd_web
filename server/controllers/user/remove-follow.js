const admin = require('firebase-admin');
const db = admin.firestore();

const removeFollow = async (req, res) => {
    try {
        const { currentUserId, followerToRemoveId } = req.body;

        if (!currentUserId || !followerToRemoveId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Remove followerToRemoveId from current user's followers list
        await db.collection('users').doc(currentUserId).update({
            followers: admin.firestore.FieldValue.arrayRemove(followerToRemoveId)
        });

        // Remove currentUserId from the follower's following list
        await db.collection('users').doc(followerToRemoveId).update({
            following: admin.firestore.FieldValue.arrayRemove(currentUserId)
        });

        return res.status(200).json({ message: 'Successfully removed follower' });
    } catch (error) {
        console.error('Error removing follower:', error);
        return res.status(500).json({ error: 'Failed to remove follower' });
    }
};

module.exports = removeFollow;
