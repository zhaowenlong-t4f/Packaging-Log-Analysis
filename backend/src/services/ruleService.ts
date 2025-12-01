// @ts-nocheck
import { RuleResponse, RuleListQuery } from '../types/rule.types';
import { PaginatedResponse } from '../types/api.types';
import { logger } from '../utils/logger';
import prisma from '../config/database';

/**
 * 规则服务类
 */
export class RuleService {

  /**
   * 获取规则列表
   */
  async getRules(query: RuleListQuery): Promise<PaginatedResponse<RuleResponse>> {
    try {
      const pageNo = query.pageNo || 1;
      const pageSize = query.pageSize || 20;
      
      const rules = await prisma.rule.findMany({
        where: { enabled: true },
        skip: (pageNo - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' }
      });

      const total = await prisma.rule.count({ where: { enabled: true } });

      const formattedRules = rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        regex: rule.regex,
        keywords: JSON.parse(rule.keywords),
        solution: rule.solution || '',
        severity: rule.severity as any,
        weight: rule.weight,
        categories: rule.categories ? JSON.parse(rule.categories) : [],
        enabled: rule.enabled,
        version: rule.version,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        usageCount: 0
      }));

      return {
        code: 0,
        message: 'success',
        data: {
          pagination: {
            pageNo: pageNo,
            pageSize: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          },
          items: formattedRules
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get rules', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * 创建规则
   */
  async createRule(request: any): Promise<RuleResponse> {
    try {
      const rule = await prisma.rule.create({
        data: {
          name: request.name,
          regex: request.regex,
          keywords: JSON.stringify(request.keywords),
          solution: request.solution,
          severity: request.severity || 'ERROR',
          weight: request.weight || 50,
          categories: request.categories ? JSON.stringify(request.categories) : null,
          enabled: true,
          version: 1
        }
      });

      return {
        id: rule.id,
        name: rule.name,
        regex: rule.regex,
        keywords: JSON.parse(rule.keywords),
        solution: rule.solution,
        severity: rule.severity,
        weight: rule.weight,
        categories: rule.categories ? JSON.parse(rule.categories) : [],
        enabled: rule.enabled,
        version: rule.version,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        usageCount: 0
      };
    } catch (error) {
      logger.error('Failed to create rule', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * 更新规则
   */
  async updateRule(ruleId: string, request: any): Promise<RuleResponse> {
    try {
      const rule = await prisma.rule.update({
        where: { id: ruleId },
        data: {
          name: request.name,
          regex: request.regex,
          keywords: JSON.stringify(request.keywords),
          solution: request.solution,
          severity: request.severity,
          weight: request.weight,
          categories: request.categories ? JSON.stringify(request.categories) : null
        }
      });

      return {
        id: rule.id,
        name: rule.name,
        regex: rule.regex,
        keywords: JSON.parse(rule.keywords),
        solution: rule.solution,
        severity: rule.severity,
        weight: rule.weight,
        categories: rule.categories ? JSON.parse(rule.categories) : [],
        enabled: rule.enabled,
        version: rule.version,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        usageCount: 0
      };
    } catch (error) {
      logger.error('Failed to update rule', { ruleId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * 删除规则
   */
  async deleteRule(ruleId: string): Promise<void> {
    try {
      await prisma.rule.delete({
        where: { id: ruleId }
      });
    } catch (error) {
      logger.error('Failed to delete rule', { ruleId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

// 导出单例实例
export const ruleService = new RuleService();
