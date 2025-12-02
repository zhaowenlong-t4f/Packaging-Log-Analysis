import { useState, memo } from 'react';
import { Card, Descriptions, Tag, Space, Button, Empty, Typography, Tabs } from 'antd';
import { CodeViewer } from '@/components/Common/CodeViewer';
import { ErrorDetail as ErrorDetailType } from '@/types/log.types';
import { SEVERITY_OPTIONS } from '@/config/constants';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;

interface ErrorDetailProps {
  error: ErrorDetailType | null;
  loading?: boolean;
}

export const ErrorDetail = memo(function ErrorDetail({ error }: ErrorDetailProps) {
  const [selectedOccurrenceIndex, setSelectedOccurrenceIndex] = useState(0);

  if (!error) {
    return (
      <Empty description="请选择一个错误查看详情" style={{ marginTop: 100 }} />
    );
  }

  const getSeverityColor = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.color || '#8c8c8c';
  };

  const getSeverityLabel = (severity: string): string => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.label || severity;
  };

  const occurrences = error.occurrences || [];
  const currentOccurrence = occurrences[selectedOccurrenceIndex];

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="错误标题">{error.title}</Descriptions.Item>
          <Descriptions.Item label="错误类型">{error.type}</Descriptions.Item>
          <Descriptions.Item label="严重程度">
            <Tag color={getSeverityColor(error.severity)}>
              {getSeverityLabel(error.severity)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="出现次数">{error.count}</Descriptions.Item>
          <Descriptions.Item label="权重">{error.weight}</Descriptions.Item>
          {error.description && (
            <Descriptions.Item label="错误描述">
              <Text>{error.description}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      ),
    },
    {
      key: 'solution',
      label: '解决方案',
      children: error.solution ? (
        <Card>
          <ReactMarkdown>{error.solution}</ReactMarkdown>
        </Card>
      ) : (
        <Empty description="暂无解决方案" />
      ),
    },
    {
      key: 'stack',
      label: '堆栈信息',
      children: error.stackTrace ? (
        <CodeViewer
          context={{
            before: [],
            current: { lineNo: 1, content: error.stackTrace, isMatch: true },
            after: [],
          }}
          title="堆栈跟踪"
        />
      ) : (
        <Empty description="暂无堆栈信息" />
      ),
    },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
          <Title level={4}>{error.title}</Title>
          <Space>
            <Tag color={getSeverityColor(error.severity)}>
              {getSeverityLabel(error.severity)}
            </Tag>
            <Text type="secondary">出现 {error.count} 次</Text>
          </Space>
        </Card>

        <Tabs items={tabItems} />

        {occurrences.length > 0 && (
          <Card title="出现位置">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space>
                {occurrences.map((occurrence, index) => (
                  <Button
                    key={index}
                    type={selectedOccurrenceIndex === index ? 'primary' : 'default'}
                    onClick={() => setSelectedOccurrenceIndex(index)}
                  >
                    位置 {index + 1} - 第 {occurrence.lineNumber} 行
                  </Button>
                ))}
              </Space>

              {currentOccurrence && (
                <CodeViewer
                  context={currentOccurrence.context}
                  title={`位置 ${selectedOccurrenceIndex + 1} - 第 ${currentOccurrence.lineNumber} 行`}
                />
              )}
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
});

