export type TechnicianStatus = 'on_duty' | 'off_duty' | 'on_leave';
export declare class Technician {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    accountStatus: 'active' | 'suspended' | 'pending';
    phone: string;
    hireDate: string;
    address: string;
    specialization: string;
    qualifications: string;
    zone: string;
    status: TechnicianStatus;
    currentJobCount: number;
    completedRepairs: number;
    createdAt: Date;
    updatedAt: Date;
}
