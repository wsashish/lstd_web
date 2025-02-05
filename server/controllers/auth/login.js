const { auth, db } = require('../../config/firebase');
const createError = require('http-errors');
const imageService = require('../../services/image.service');
const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../../utils/jwt.utils');

const GOOGLE_CLIENT_ID = '384545805633-js10ecupkle997vhiv8e5o1ar7ri910f.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const login = async (req, res, next) => {
    try {
        const { loginType, register = false, idToken, email, password, fullName } = req.body;

        console.log(req.body);

        let uid;

        switch (loginType) {
            case 'google':
                try {
                    // Verify the Google ID token first
                    const ticket = await client.verifyIdToken({
                        idToken: idToken,
                        audience: GOOGLE_CLIENT_ID
                    });

                    const payload = ticket.getPayload();
                    const googleEmail = payload['email'];
                    const googleId = payload['sub'];

                    try {
                        // First check if a user exists with this Google ID
                        try {
                            const existingUser = await db.collection('users').where('email', '==', googleEmail).get();


                            if (existingUser.docs.length > 0) {
                                uid = existingUser.docs[0].id;
                                return;
                            }
                        } catch (error) {
                            console.error('Error listing users:', error);
                        }


                    } catch (error) {
                        console.log(error.code);
                        if (error.code === 'auth/user-not-found' && register) {
                            // Create new user with Google provider
                            const newUser = await auth.createUser({
                                email: googleEmail,
                                emailVerified: true,
                                displayName: payload['name'],
                                photoURL: payload['picture'],
                                providerToLink: {
                                    providerId: 'google.com',
                                    uid: googleId
                                }
                            });
                            uid = newUser.uid;
                        } else {
                            throw error;
                        }
                    }
                } catch (error) {
                    console.error('Google authentication error:', error);
                    return next(createError(401, 'Invalid Google token'));
                }
                break;

            case 'email':
                try {
                    if (!email || !password) {
                        return next(createError(400, 'Email and password are required'));
                    }
                    // Sign in with email and password using Firebase Admin
                    try {
                        const existingUser = await db.collection('users').where('email', '==', email).get();


                        if (existingUser.docs.length > 0) {
                            uid = existingUser.docs[0].id;

                        } else {
                            return next(createError(401, 'Invalid email or password'));
                        }
                    } catch (error) {
                        console.error('Error listing users:', error);
                    }
                } catch (error) {
                    console.error('Email login error:', error);
                    if (error.code === 'auth/user-not-found') {
                        if (register) {
                            const newUser = await auth.createUser({
                                email: email,
                                displayName: fullName,
                                photoURL: null,
                                providerToLink: {
                                    providerId: 'email',
                                    uid: email
                                },
                            });
                            uid = newUser.uid;
                        }
                        return next(createError(401, 'Invalid email or password'));
                    }
                    throw error;
                }
                break;

            default:
                return next(createError(400, 'Invalid login type'));
        }

        // Check if user exists in users collection
        const userDoc = await db.collection('users').doc(uid).get();

        let userData;

        if (userDoc.exists) {
            // Check if user is deleted or blocked
            const user = userDoc.data();
            if (user.isDeleted || user.isBlocked) {
                return next(createError(403, 'Account is not active'));
            }

            // User exists, get their data
            userData = {
                id: userDoc.id,
                name: user.name,
                email: user.email,
                bio: user.bio || '',
                phoneNo: user.phoneNo,
                location: user.location,
                profilePhotoUrl: await imageService.getUserProfilePicUrl(userDoc.id) || null,
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
        } else {

            if (register) {

                // Get user info from Firebase Auth
                const firebaseUser = await auth.getUser(uid);

                // User doesn't exist, create new user document
                const newUser = {
                    name: firebaseUser.displayName || (email ? email.split('@')[0] : ''),
                    email: firebaseUser.email,
                    bio: '',
                    phoneNo: firebaseUser.phoneNumber || '',
                    location: null,
                    profilePhotoUrl: firebaseUser.photoURL || null,
                    created_date: new Date().toISOString(),
                    bookMarksLists: [],
                    followers: [],
                    following: [],
                    hotelBookmarks: [],
                    hotelViewedLists: [],
                    hotellikedLists: [],
                    likedLists: [],
                    visitedRestaurants: [],
                    isDeleted: false,
                    isBlocked: false
                };

                // Save new user to users collection
                await db.collection('users').doc(uid).set(newUser);
                userData = { id: uid, ...newUser };

            }
        }
        console.log(userData);

        // Generate a session token
        const token = await generateToken(userData);


        res.json({
            success: true,
            data: userData,
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);

        // Handle specific Firebase Auth errors
        switch (error.code) {
            case 'auth/id-token-expired':
                return next(createError(401, 'Token expired'));
            case 'auth/wrong-password':
                return next(createError(401, 'Invalid email or password'));
            case 'auth/user-disabled':
                return next(createError(403, 'Account has been disabled'));
            case 'auth/too-many-requests':
                return next(createError(429, 'Too many login attempts. Please try again later'));
            default:
                return next(createError(500, 'Login failed. Please try again'));
        }
    }
};

module.exports = { login }; 