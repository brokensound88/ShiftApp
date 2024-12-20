export interface Shift {
    id: number;
    employeeId: number;
    startTime: Date;
    endTime: Date;
    role: string;
}

export interface Employee {
    id: number;
    name: string;
    position: string;
    shifts: Shift[];
}

export interface Schedule {
    employeeId: number;
    shifts: Shift[];
}