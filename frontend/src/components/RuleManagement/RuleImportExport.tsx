import { useState } from 'react';
import { Modal, Button, Upload, Select, message, Descriptions, Space } from 'antd';
import { ImportOutlined, ExportOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { ConflictStrategy, RuleImportResult } from '@/types/rule.types';
import { CONFLICT_STRATEGIES } from '@/config/constants';
import { importRules, exportRules } from '@/services/api/ruleApi';

interface RuleImportExportProps {
  selectedRuleIds?: string[];
  onImportSuccess?: () => void;
}

export function RuleImportExport({
  selectedRuleIds = [],
  onImportSuccess,
}: RuleImportExportProps) {
  const [importVisible, setImportVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip');
  const [importResult, setImportResult] = useState<RuleImportResult | null>(null);

  // 导出规则
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const ruleIds = selectedRuleIds.length > 0 ? selectedRuleIds : undefined;
      await exportRules(ruleIds);
      message.success('规则导出成功');
      setExportVisible(false);
    } catch (error: any) {
      message.error(error.message || '导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 导入规则
  const handleImport: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;

    if (!(file instanceof File)) {
      onError?.(new Error('无效的文件'));
      return;
    }

    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      const error = new Error('请选择JSON格式的文件');
      message.error(error.message);
      onError?.(error);
      return;
    }

    try {
      setImportLoading(true);
      
      // 先读取文件内容验证JSON格式
      const fileContent = await file.text();
      let jsonData: any;
      let cleanedFile: File;
      
      try {
        jsonData = JSON.parse(fileContent);
        if (!Array.isArray(jsonData)) {
          const error = new Error('JSON文件格式错误：期望一个数组');
          message.error(error.message);
          onError?.(error);
          return;
        }
        
        // 验证并清理每个规则对象
        const cleanedRules = [];
        for (let i = 0; i < jsonData.length; i++) {
          const rule = jsonData[i];
          
          // 验证必需字段
          if (!rule.name || typeof rule.name !== 'string') {
            const error = new Error(`规则 ${i + 1} 缺少 name 字段或格式不正确`);
            message.error(error.message);
            onError?.(error);
            return;
          }
          if (!rule.regex || typeof rule.regex !== 'string') {
            const error = new Error(`规则 "${rule.name || i + 1}" 缺少 regex 字段或格式不正确`);
            message.error(error.message);
            onError?.(error);
            return;
          }
          if (!Array.isArray(rule.keywords) || rule.keywords.length === 0) {
            const error = new Error(`规则 "${rule.name}" 的 keywords 必须是至少包含一个元素的数组`);
            message.error(error.message);
            onError?.(error);
            return;
          }
          if (!rule.severity || !['CRITICAL', 'ERROR', 'WARNING', 'INFO'].includes(rule.severity)) {
            const error = new Error(`规则 "${rule.name}" 的 severity 必须是 CRITICAL/ERROR/WARNING/INFO 之一`);
            message.error(error.message);
            onError?.(error);
            return;
          }
          
          // 清理数据：只保留后端需要的字段
          cleanedRules.push({
            name: rule.name,
            regex: rule.regex,
            keywords: rule.keywords,
            solution: rule.solution || undefined,
            severity: rule.severity,
            weight: rule.weight !== undefined ? Number(rule.weight) : undefined,
            categories: rule.categories || undefined,
          });
        }
        
        // 使用清理后的数据重新创建文件
        const cleanedJsonContent = JSON.stringify(cleanedRules, null, 2);
        const cleanedFileBlob = new Blob([cleanedJsonContent], { type: 'application/json' });
        cleanedFile = new File([cleanedFileBlob], file.name, { type: 'application/json' });
      } catch (parseError: any) {
        const error = new Error(`JSON文件格式错误：${parseError.message || '无法解析'}`);
        message.error(error.message);
        onError?.(error);
        return;
      }
      
      // 使用清理后的文件进行导入
      const result = await importRules(cleanedFile, conflictStrategy);
      
      setImportResult(result);
      
      if (result.failed > 0 && result.errors.length > 0) {
        const errorMessages = result.errors.slice(0, 3).map(e => 
          `规则 "${e.ruleName}": ${e.error}`
        ).join('\n');
        message.warning(
          `导入完成但有部分失败: 新增 ${result.imported} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条，失败 ${result.failed} 条\n${errorMessages}`
        );
      } else {
        message.success(`导入完成: 新增 ${result.imported} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条`);
      }
      
      onSuccess?.(file);
      onImportSuccess?.();
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.message || error.message || '导入失败';
      message.error(errorMessage);
      onError?.(error);
    } finally {
      setImportLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    customRequest: handleImport,
    accept: '.json',
    maxCount: 1,
    showUploadList: false,
  };

  return (
    <>
      <Space>
        <Button
          icon={<ExportOutlined />}
          onClick={() => setExportVisible(true)}
        >
          导出规则
        </Button>
        <Button
          icon={<ImportOutlined />}
          onClick={() => setImportVisible(true)}
        >
          导入规则
        </Button>
      </Space>

      {/* 导出对话框 */}
      <Modal
        title="导出规则"
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        onOk={handleExport}
        confirmLoading={exportLoading}
      >
        <p>
          {selectedRuleIds.length > 0
            ? `将导出选中的 ${selectedRuleIds.length} 条规则`
            : '将导出所有规则'}
        </p>
      </Modal>

      {/* 导入对话框 */}
      <Modal
        title="导入规则"
        open={importVisible}
        onCancel={() => {
          setImportVisible(false);
          setImportResult(null);
        }}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Upload.Dragger {...uploadProps} disabled={importLoading}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽JSON文件到此区域上传</p>
            <p className="ant-upload-hint">支持规则JSON格式文件</p>
          </Upload.Dragger>

          <div>
            <label>冲突处理策略：</label>
            <Select
              value={conflictStrategy}
              onChange={setConflictStrategy}
              options={CONFLICT_STRATEGIES}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>

          {importResult && (
            <Descriptions title="导入结果" bordered column={2}>
              <Descriptions.Item label="新增">{importResult.imported}</Descriptions.Item>
              <Descriptions.Item label="更新">{importResult.updated}</Descriptions.Item>
              <Descriptions.Item label="跳过">{importResult.skipped}</Descriptions.Item>
              <Descriptions.Item label="失败">{importResult.failed}</Descriptions.Item>
            </Descriptions>
          )}
        </Space>
      </Modal>
    </>
  );
}

