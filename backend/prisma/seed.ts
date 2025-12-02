/**
 * Prisma 数据库种子脚本
 * 用于导入初始规则数据
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RuleData {
  id?: string;
  name: string;
  regex: string;
  keywords: string[];
  solution?: string;
  severity: string;
  weight: number;
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

async function main() {
  console.log('🌱 开始导入规则数据...');

  // 读取 log_rules.json 文件
  const rulesPath = path.join(__dirname, '../../log_rules.json');
  const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as RuleData[];

  let imported = 0;
  let skipped = 0;

  for (const ruleData of rulesData) {
    try {
      // 检查规则是否已存在（按名称）
      const existing = await prisma.rule.findUnique({
        where: { name: ruleData.name },
      });

      if (existing) {
        console.log(`⏭️  跳过已存在的规则: ${ruleData.name}`);
        skipped++;
        continue;
      }

      // 创建规则
      await prisma.rule.create({
        data: {
          name: ruleData.name,
          regex: ruleData.regex,
          keywords: JSON.stringify(ruleData.keywords),
          solution: ruleData.solution || null,
          severity: ruleData.severity,
          weight: ruleData.weight,
          categories: ruleData.categories ? JSON.stringify(ruleData.categories) : null,
          enabled: true,
          version: 1,
        },
      });

      // 创建初始历史版本
      await prisma.ruleHistory.create({
        data: {
          ruleId: (await prisma.rule.findUnique({ where: { name: ruleData.name } }))!.id,
          version: 1,
          name: ruleData.name,
          regex: ruleData.regex,
          keywords: JSON.stringify(ruleData.keywords),
          solution: ruleData.solution || null,
          severity: ruleData.severity,
          weight: ruleData.weight,
          categories: ruleData.categories ? JSON.stringify(ruleData.categories) : null,
          changeLog: 'Initial version',
        },
      });

      imported++;
      console.log(`✅ 导入规则: ${ruleData.name}`);
    } catch (error) {
      console.error(`❌ 导入规则失败: ${ruleData.name}`, error);
    }
  }

  console.log(`\n📊 导入完成: ${imported} 条规则已导入, ${skipped} 条规则已跳过`);
}

main()
  .catch((e) => {
    console.error('❌ 种子脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

