import { JwtService } from '@nestjs/jwt';
import { CustomersService } from '../customers/customers.service';
import { TechniciansService } from '../technicians/technicians.service';
export declare class AuthService {
    private readonly customersService;
    private readonly techniciansService;
    private readonly jwtService;
    constructor(customersService: CustomersService, techniciansService: TechniciansService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<import("../customers/customer.entity").Customer>;
    loginCustomer(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            sub: string;
            email: string;
            name: string;
            role: string;
            meterId: string;
        };
    }>;
    loginAdmin(email: string, password: string): Promise<{
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
    register(name: string, email: string, password: string, meterId?: string): Promise<{
        accessToken: string;
        user: {
            sub: string;
            email: string;
            name: string;
            role: string;
            meterId: string;
        };
    }>;
    changePassword(userId: string, oldPass: string, newPass: string): Promise<{
        success: boolean;
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
