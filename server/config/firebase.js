const admin = require('firebase-admin');
const serviceAccount = require('../services/serviceAccountKey.json');
// Initialize Firebase Admin with service account
// Note: You need to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// pointing to your service account key file
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://lstd-aaa28.firebaseio.com'
});

const db = admin.firestore();

module.exports = {
    admin,
    db
}; 