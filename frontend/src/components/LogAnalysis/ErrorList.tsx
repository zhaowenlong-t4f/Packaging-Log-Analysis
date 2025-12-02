import { useState, memo } from 'react';
import { Card, Input, Select, Space, Tag, Typography, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ErrorSummary } from '@/types/log.types';
import { SEVERITY_OPTIONS } from '@/config/constants';
import { PagePagination } from '@/components/Common/PagePagination';
import { PaginationResponse } from '@/types/common.types';

const { Text } = Typography;

interface ErrorListProps {
  errors: ErrorSummary[];
  pagination: PaginationResponse | null;
  loading?: boolean;
  selectedErrorId?: string;
  onErrorSelect: (error: ErrorSummary) => void;
  onPageChange: (pageNo: number, pageSize: number) => void;
  onSearch: (keyword: string) => void;
  onSeverityFilter: (severities: string[]) => void;
}

export const ErrorList = memo(function ErrorList({
  errors,
  pagination,
  loading = false,
  selectedErrorId,
  onErrorSelect,
  onPageChange,
  onSearch,
  onSeverityFilter,
}: ErrorListProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    onSearch(value);
  };

  const handleSeverityFilter = (values: string[]) => {
    setSeverityFilter(values);
    onSeverityFilter(values);
  };

  const getSeverityColor = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.color || '#8c8c8c';
  };

  const getSeverityLabel = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.label || severity;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="搜索错误..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
        <Select
          mode="multiple"
          placeholder="筛选严重程度"
          value={severityFilter}
          onChange={handleSeverityFilter}
          options={SEVERITY_OPTIONS}
          style={{ width: '100%' }}
          allowClear
        />
      </Space>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Spin spinning={loading}>
          {!errors || errors.length === 0 ? (
            <Empty description="暂无错误" />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {errors.map((error) => (
                <Card
                  key={error.id}
                  hoverable
                  onClick={() => onErrorSelect(error)}
                  style={{
                    cursor: 'pointer',
                    border:
                      selectedErrorId === error.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Text strong style={{ fontSize: 16 }}>
                        {error.title}
                      </Text>
                      <Tag color={getSeverityColor(error.severity)}>
                        {getSeverityLabel(error.severity)}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      类型: {error.type} | 出现次数: {error.count || 0}
                    </Text>
                    {error.description && (
                      <Text
                        ellipsis={{ tooltip: error.description }}
                        style={{ fontSize: 12, color: '#595959' }}
                      >
                        {error.description}
                      </Text>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Spin>
      </div>

      {pagination && (
        <div style={{ marginTop: 16 }}>
          <PagePagination pagination={pagination} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
});

