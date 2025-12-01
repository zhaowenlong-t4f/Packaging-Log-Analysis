import { z } from 'zod';
export declare const analyzeLogSchema: z.ZodObject<{
    uploadType: z.ZodEnum<["url", "file", "text"]>;
    content: z.ZodString;
    fileName: z.ZodString;
    metadata: z.ZodOptional<z.ZodObject<{
        projectName: z.ZodOptional<z.ZodString>;
        buildVersion: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        projectName?: string | undefined;
        buildVersion?: string | undefined;
        platform?: string | undefined;
    }, {
        projectName?: string | undefined;
        buildVersion?: string | undefined;
        platform?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    uploadType: "url" | "file" | "text";
    content: string;
    fileName: string;
    metadata?: {
        projectName?: string | undefined;
        buildVersion?: string | undefined;
        platform?: string | undefined;
    } | undefined;
}, {
    uploadType: "url" | "file" | "text";
    content: string;
    fileName: string;
    metadata?: {
        projectName?: string | undefined;
        buildVersion?: string | undefined;
        platform?: string | undefined;
    } | undefined;
}>;
export declare const createRuleSchema: z.ZodObject<{
    name: z.ZodString;
    regex: z.ZodEffects<z.ZodString, string, string>;
    keywords: z.ZodArray<z.ZodString, "many">;
    severity: z.ZodDefault<z.ZodEnum<["CRITICAL", "ERROR", "WARNING", "INFO"]>>;
    weight: z.ZodDefault<z.ZodNumber>;
    solution: z.ZodOptional<z.ZodString>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
    weight: number;
    name: string;
    regex: string;
    keywords: string[];
    solution?: string | undefined;
    categories?: string[] | undefined;
}, {
    name: string;
    regex: string;
    keywords: string[];
    severity?: "CRITICAL" | "ERROR" | "WARNING" | "INFO" | undefined;
    weight?: number | undefined;
    solution?: string | undefined;
    categories?: string[] | undefined;
}>;
export declare const updateRuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    regex: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    severity: z.ZodOptional<z.ZodDefault<z.ZodEnum<["CRITICAL", "ERROR", "WARNING", "INFO"]>>>;
    weight: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    solution: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    categories: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    severity?: "CRITICAL" | "ERROR" | "WARNING" | "INFO" | undefined;
    weight?: number | undefined;
    name?: string | undefined;
    regex?: string | undefined;
    keywords?: string[] | undefined;
    solution?: string | undefined;
    categories?: string[] | undefined;
}, {
    severity?: "CRITICAL" | "ERROR" | "WARNING" | "INFO" | undefined;
    weight?: number | undefined;
    name?: string | undefined;
    regex?: string | undefined;
    keywords?: string[] | undefined;
    solution?: string | undefined;
    categories?: string[] | undefined;
}>;
export declare const ruleListQuerySchema: z.ZodObject<{
    pageNo: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    pageSize: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    sortBy: z.ZodDefault<z.ZodEnum<["updatedAt", "createdAt", "severity", "weight"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    searchKeyword: z.ZodOptional<z.ZodString>;
    categoryFilter: z.ZodEffects<z.ZodOptional<z.ZodString>, string[] | undefined, string | undefined>;
    severityFilter: z.ZodEffects<z.ZodOptional<z.ZodString>, any, string | undefined>;
}, "strip", z.ZodTypeAny, {
    pageNo: number;
    pageSize: number;
    sortBy: "severity" | "weight" | "updatedAt" | "createdAt";
    sortOrder: "asc" | "desc";
    searchKeyword?: string | undefined;
    severityFilter?: any;
    categoryFilter?: string[] | undefined;
}, {
    pageNo?: string | undefined;
    pageSize?: string | undefined;
    sortBy?: "severity" | "weight" | "updatedAt" | "createdAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    searchKeyword?: string | undefined;
    severityFilter?: string | undefined;
    categoryFilter?: string | undefined;
}>;
export declare const logDetailsQuerySchema: z.ZodObject<{
    pageNo: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    pageSize: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    sortBy: z.ZodDefault<z.ZodEnum<["severity", "weight", "count", "firstOccurrenceLine"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    searchKeyword: z.ZodOptional<z.ZodString>;
    severityFilter: z.ZodEffects<z.ZodOptional<z.ZodString>, any, string | undefined>;
}, "strip", z.ZodTypeAny, {
    pageNo: number;
    pageSize: number;
    sortBy: "severity" | "weight" | "count" | "firstOccurrenceLine";
    sortOrder: "asc" | "desc";
    searchKeyword?: string | undefined;
    severityFilter?: any;
}, {
    pageNo?: string | undefined;
    pageSize?: string | undefined;
    sortBy?: "severity" | "weight" | "count" | "firstOccurrenceLine" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    searchKeyword?: string | undefined;
    severityFilter?: string | undefined;
}>;
export declare const batchDeleteRulesSchema: z.ZodObject<{
    ruleIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ruleIds: string[];
}, {
    ruleIds: string[];
}>;
export declare const batchUpdateCategoriesSchema: z.ZodEffects<z.ZodObject<{
    ruleIds: z.ZodArray<z.ZodString, "many">;
    addCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    removeCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    ruleIds: string[];
    addCategories?: string[] | undefined;
    removeCategories?: string[] | undefined;
}, {
    ruleIds: string[];
    addCategories?: string[] | undefined;
    removeCategories?: string[] | undefined;
}>, {
    ruleIds: string[];
    addCategories?: string[] | undefined;
    removeCategories?: string[] | undefined;
}, {
    ruleIds: string[];
    addCategories?: string[] | undefined;
    removeCategories?: string[] | undefined;
}>;
export declare const validateRulesSchema: z.ZodObject<{
    ruleIds: z.ZodArray<z.ZodString, "many">;
    uploadType: z.ZodEnum<["text", "url", "file"]>;
    content: z.ZodString;
    fileName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uploadType: "url" | "file" | "text";
    content: string;
    fileName: string;
    ruleIds: string[];
}, {
    uploadType: "url" | "file" | "text";
    content: string;
    fileName: string;
    ruleIds: string[];
}>;
export type AnalyzeLogInput = z.infer<typeof analyzeLogSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type RuleListQueryInput = z.infer<typeof ruleListQuerySchema>;
export type LogDetailsQueryInput = z.infer<typeof logDetailsQuerySchema>;
export type BatchDeleteRulesInput = z.infer<typeof batchDeleteRulesSchema>;
export type BatchUpdateCategoriesInput = z.infer<typeof batchUpdateCategoriesSchema>;
export type ValidateRulesInput = z.infer<typeof validateRulesSchema>;
//# sourceMappingURL=index.d.ts.map