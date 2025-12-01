import { RuleResponse, RuleListQuery } from '../types/rule.types';
import { PaginatedResponse } from '../types/api.types';
export declare class RuleService {
    getRules(query: RuleListQuery): Promise<PaginatedResponse<RuleResponse>>;
    createRule(request: any): Promise<RuleResponse>;
    updateRule(ruleId: string, request: any): Promise<RuleResponse>;
    deleteRule(ruleId: string): Promise<void>;
}
export declare const ruleService: RuleService;
//# sourceMappingURL=ruleService.d.ts.map