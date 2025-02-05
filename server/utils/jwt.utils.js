const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, always use environment variable

const generateToken = (user) => {

    console.log(user);
    return jwt.sign(
        {
            id: user.id || user.uid,
            email: user.email,
            name: user.name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const verifyJwtToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyJwtToken
}; 