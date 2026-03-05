import type { Request, Response } from "express";
export declare const getPersonalRecords: (req: Request, res: Response) => Promise<void>;
export declare const getAllEmployeeRecords: (req: Request, res: Response) => Promise<void>;
export declare const getMonthlyRecords: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const approveOvertime: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const get30DaySummary: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=recordsController.d.ts.map