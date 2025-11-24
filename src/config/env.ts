import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/pomodoro',
    jwtSecret: process.env.JWT_SECRET || 'default_secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret',
};
