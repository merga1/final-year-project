export type AccountStatus = 'active' | 'suspended' | 'pending';
export declare class Customer {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    dateOfBirth: string;
    address: string;
    meterId: string;
    zone: string;
    role: string;
    accountStatus: AccountStatus;
    createdAt: Date;
    updatedAt: Date;
}
