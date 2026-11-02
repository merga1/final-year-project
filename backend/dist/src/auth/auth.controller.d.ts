import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly service;
    constructor(service: AuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: {
            sub: string;
            technicianId: string;
            email: string;
            name: string;
            role: string;
            meterId: undefined;
        };
    } | {
        accessToken: string;
        user: {
            sub: string;
            email: string;
            name: string;
            role: string;
            meterId: string;
        };
    }>;
    forgotPassword(body: {
        email: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    register(body: {
        name: string;
        email: string;
        password: string;
        meterId?: string;
    }): Promise<{
        accessToken: string;
        user: {
            sub: string;
            email: string;
            name: string;
            role: string;
            meterId: string;
        };
    }>;
    changePassword(user: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
