import { useState } from 'react';
import {
  Table,
  Input,
  Select,
  Space,
  Button,
  Tag,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Rule } from '@/types/rule.types';
import { SEVERITY_OPTIONS } from '@/config/constants';
import { PagePagination } from '@/components/Common/PagePagination';
import { PaginationResponse } from '@/types/common.types';

interface RuleListProps {
  rules: Rule[];
  pagination: PaginationResponse | null;
  selectedRules: string[];
  loading?: boolean;
  onRuleSelect: (rule: Rule) => void;
  onRuleEdit: (rule: Rule) => void;
  onRuleDelete: (ruleId: string) => void;
  onBatchDelete: (ruleIds: string[]) => void;
  onRuleHistory: (rule: Rule) => void;
  onPageChange: (pageNo: number, pageSize: number) => void;
  onSearch: (keyword: string) => void;
  onCategoryFilter: (categories: string[]) => void;
  onSeverityFilter: (severities: string[]) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onSelectionChange: (selectedRowKeys: React.Key[]) => void;
}

export function RuleList({
  rules,
  pagination,
  selectedRules,
  loading = false,
  onRuleSelect,
  onRuleEdit,
  onRuleDelete,
  onBatchDelete,
  onRuleHistory,
  onPageChange,
  onSearch,
  onCategoryFilter,
  onSeverityFilter,
  onSort,
  onSelectionChange,
}: RuleListProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);

  const getSeverityColor = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.color || '#8c8c8c';
  };

  const getSeverityLabel = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.label || severity;
  };

  const columns: ColumnsType<Rule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text: string, record: Rule) => (
        <a onClick={() => onRuleSelect(record)}>{text}</a>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      sorter: true,
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>{getSeverityLabel(severity)}</Tag>
      ),
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      sorter: true,
    },
    {
      title: '分类',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories: string[]) =>
        categories?.map((cat) => <Tag key={cat}>{cat}</Tag>) || '-',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_: any, record: Rule) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onRuleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="历史">
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={() => onRuleHistory(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这条规则吗？"
            onConfirm={() => onRuleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    onSearch(value);
  };

  const handleCategoryFilter = (values: string[]) => {
    setCategoryFilter(values);
    onCategoryFilter(values);
  };

  const handleSeverityFilter = (values: string[]) => {
    setSeverityFilter(values);
    onSeverityFilter(values);
  };

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field) {
      onSort(sorter.field, sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  const rowSelection = {
    selectedRowKeys: selectedRules,
    onChange: onSelectionChange,
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space wrap>
          <Input
            placeholder="搜索规则..."
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            mode="multiple"
            placeholder="筛选分类"
            value={categoryFilter}
            onChange={handleCategoryFilter}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            mode="multiple"
            placeholder="筛选严重程度"
            value={severityFilter}
            onChange={handleSeverityFilter}
            options={SEVERITY_OPTIONS}
            style={{ width: 200 }}
            allowClear
          />
          {selectedRules.length > 0 && (
            <Popconfirm
              title={`确定要删除选中的 ${selectedRules.length} 条规则吗？`}
              onConfirm={() => {
                onBatchDelete(selectedRules);
                onSelectionChange([]);
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button danger>批量删除 ({selectedRules.length})</Button>
            </Popconfirm>
          )}
        </Space>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={false}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />

        {pagination && (
          <PagePagination pagination={pagination} onChange={onPageChange} />
        )}
      </Space>
    </div>
  );
}

