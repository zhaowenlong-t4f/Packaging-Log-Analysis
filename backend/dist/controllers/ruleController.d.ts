import { Request, Response } from 'express';
export declare function getRules(req: Request, res: Response): Promise<void>;
export declare function createRule(req: Request, res: Response): Promise<void>;
export declare function updateRule(req: Request, res: Response): Promise<void>;
export declare function deleteRule(req: Request, res: Response): Promise<void>;
export declare function batchDeleteRules(req: Request, res: Response): Promise<void>;
export declare function exportRules(req: Request, res: Response): Promise<void>;
export declare function importRules(req: Request, res: Response): Promise<void>;
export declare function getRuleHistory(req: Request, res: Response): Promise<void>;
export declare function rollbackRule(req: Request, res: Response): Promise<void>;
export declare function validateRules(req: Request, res: Response): Promise<void>;
export declare function batchUpdateCategories(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=ruleController.d.ts.map