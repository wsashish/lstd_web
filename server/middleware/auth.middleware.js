const createError = require('http-errors');
const { verifyJwtToken } = require('../utils/jwt.utils');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(createError(401, 'No token provided'));
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decoded = verifyJwtToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Error verifying token:', error);
            return next(createError(401, 'Invalid token'));
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return next(createError(500, 'Internal server error'));
    }
};

module.exports = { verifyToken }; 