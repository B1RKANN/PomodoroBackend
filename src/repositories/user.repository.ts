import User, { IUser } from '../models/user.model';

export class UserRepository {
    async create(userData: Partial<IUser>): Promise<IUser> {
        const user = new User(userData);
        return await user.save();
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email });
    }

    async findByNickname(nickname: string): Promise<IUser | null> {
        return await User.findOne({ nickname });
    }

    async findById(id: string): Promise<IUser | null> {
        return await User.findById(id);
    }
}
