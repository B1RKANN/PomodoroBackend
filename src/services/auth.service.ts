import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { UserRepository } from '../repositories/user.repository';
import { IUser } from '../models/user.model';
import { config } from '../config/env';

export class AuthService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async register(userData: Partial<IUser>) {
        const existingEmail = await this.userRepository.findByEmail(userData.email!);
        if (existingEmail) {
            throw new Error('Email already exists');
        }

        const existingNickname = await this.userRepository.findByNickname(userData.nickname!);
        if (existingNickname) {
            throw new Error('Nickname already exists');
        }

        const user = await this.userRepository.create(userData);
        const accessToken = this.generateAccessToken((user._id as mongoose.Types.ObjectId).toString());
        const refreshToken = this.generateRefreshToken((user._id as mongoose.Types.ObjectId).toString());

        return { user, accessToken, refreshToken };
    }

    async login(identifier: string, password: string) {
        let user = await this.userRepository.findByEmail(identifier);
        if (!user) {
            user = await this.userRepository.findByNickname(identifier);
        }

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const accessToken = this.generateAccessToken((user._id as mongoose.Types.ObjectId).toString());
        const refreshToken = this.generateRefreshToken((user._id as mongoose.Types.ObjectId).toString());

        return { user, accessToken, refreshToken };
    }

    async refreshToken(token: string) {
        try {
            const decoded: any = jwt.verify(token, config.refreshTokenSecret);
            const user = await this.userRepository.findById(decoded.id);

            if (!user) {
                throw new Error('User not found');
            }

            const accessToken = this.generateAccessToken((user._id as mongoose.Types.ObjectId).toString());
            return { accessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    private generateAccessToken(userId: string): string {
        return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '15m' });
    }

    private generateRefreshToken(userId: string): string {
        return jwt.sign({ id: userId }, config.refreshTokenSecret, { expiresIn: '7d' });
    }
}
