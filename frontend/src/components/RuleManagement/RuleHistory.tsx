import { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Descriptions,
  Tag,
} from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Rule, RuleHistory as RuleHistoryType } from '@/types/rule.types';
import { getRuleHistory, rollbackRule } from '@/services/api/ruleApi';
import { SEVERITY_OPTIONS } from '@/config/constants';
import { PagePagination } from '@/components/Common/PagePagination';
import { PaginationResponse } from '@/types/common.types';

interface RuleHistoryProps {
  visible: boolean;
  rule: Rule | null;
  onCancel: () => void;
  onRollbackSuccess?: () => void;
}

export function RuleHistory({
  visible,
  rule,
  onCancel,
  onRollbackSuccess,
}: RuleHistoryProps) {
  const [histories, setHistories] = useState<RuleHistoryType[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<RuleHistoryType | null>(null);

  useEffect(() => {
    if (visible && rule) {
      loadHistories(rule.id, 1, 10);
    }
  }, [visible, rule]);

  const loadHistories = async (ruleId: string, pageNo: number, pageSize: number) => {
    try {
      setLoading(true);
      const result = await getRuleHistory(ruleId, pageNo, pageSize);
      setHistories(result.versions);
      setPagination(result.pagination);
    } catch (error: any) {
      message.error(error.message || '加载历史失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!rule) return;

    try {
      setLoading(true);
      await rollbackRule(rule.id, version);
      message.success('回滚成功');
      onRollbackSuccess?.();
      loadHistories(rule.id, 1, 10);
    } catch (error: any) {
      message.error(error.message || '回滚失败');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.color || '#8c8c8c';
  };

  const getSeverityLabel = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.label || severity;
  };

  const columns: ColumnsType<RuleHistoryType> = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>{getSeverityLabel(severity)}</Tag>
      ),
    },
    {
      title: '修改时间',
      dataIndex: 'changedAt',
      key: 'changedAt',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: RuleHistoryType) => (
        <Popconfirm
          title="确定要回滚到此版本吗？"
          onConfirm={() => handleRollback(record.version)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" icon={<RollbackOutlined />} size="small">
            回滚
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={`规则历史 - ${rule?.name}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Table
          columns={columns}
          dataSource={histories}
          rowKey="version"
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onClick: () => setSelectedVersion(record),
            style: { cursor: 'pointer' },
          })}
        />

        {pagination && (
          <PagePagination
            pagination={pagination}
            onChange={(pageNo, pageSize) => {
              if (rule) {
                loadHistories(rule.id, pageNo, pageSize);
              }
            }}
          />
        )}

        {selectedVersion && (
          <Descriptions title="版本详情" bordered column={2}>
            <Descriptions.Item label="版本">{selectedVersion.version}</Descriptions.Item>
            <Descriptions.Item label="规则名称">{selectedVersion.name}</Descriptions.Item>
            <Descriptions.Item label="正则表达式">
              <code>{selectedVersion.regex}</code>
            </Descriptions.Item>
            <Descriptions.Item label="关键词">
              {selectedVersion.keywords.map((kw) => (
                <Tag key={kw}>{kw}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <Tag color={getSeverityColor(selectedVersion.severity)}>
                {getSeverityLabel(selectedVersion.severity)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="权重">{selectedVersion.weight}</Descriptions.Item>
            <Descriptions.Item label="分类" span={2}>
              {selectedVersion.categories?.map((cat) => (
                <Tag key={cat}>{cat}</Tag>
              )) || '-'}
            </Descriptions.Item>
            {selectedVersion.changeLog && (
              <Descriptions.Item label="变更说明" span={2}>
                {selectedVersion.changeLog}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="修改时间" span={2}>
              {new Date(selectedVersion.changedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Space>
    </Modal>
  );
}

