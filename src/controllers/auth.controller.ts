import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    register = async (req: Request, res: Response) => {
        try {
            const user = await this.authService.register(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };

    login = async (req: Request, res: Response) => {
        try {
            const { identifier, password } = req.body;
            const result = await this.authService.login(identifier, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };

    refreshToken = async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body;
            const result = await this.authService.refreshToken(refreshToken);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };
}
