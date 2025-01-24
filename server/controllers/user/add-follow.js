const admin = require('firebase-admin');
const db = admin.firestore();

const addFollow = async (req, res) => {
    try {
        const { currentUserId, userToFollowId } = req.body;

        if (!currentUserId || !userToFollowId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Add userToFollowId to current user's following list
        await db.collection('users').doc(currentUserId).update({
            following: admin.firestore.FieldValue.arrayUnion(userToFollowId)
        });

        // Add currentUserId to target user's followers list
        await db.collection('users').doc(userToFollowId).update({
            followers: admin.firestore.FieldValue.arrayUnion(currentUserId)
        });

        return res.status(200).json({ message: 'Successfully followed user' });
    } catch (error) {
        console.error('Error following user:', error);
        return res.status(500).json({ error: 'Failed to follow user' });
    }
};

module.exports = addFollow;
