import { useState } from 'react';
import { Modal, Checkbox, Space, Button, Card, message, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Rule, RuleValidateResult } from '@/types/rule.types';
import { UploadArea } from '@/components/LogAnalysis/UploadArea';
import { validateRules } from '@/services/api/ruleApi';
import { LogUploadRequest } from '@/types/log.types';

const { Text, Paragraph } = Typography;

interface RuleValidatorProps {
  visible: boolean;
  rules: Rule[];
  onCancel: () => void;
}

export function RuleValidator({ visible, rules, onCancel }: RuleValidatorProps) {
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [uploadType, setUploadType] = useState<'url' | 'file' | 'text'>('text');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [results, setResults] = useState<RuleValidateResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (request: LogUploadRequest) => {
    setUploadType(request.uploadType);
    setUploadContent(request.content);
    setUploadFileName(request.fileName);
  };

  const handleValidate = async () => {
    if (selectedRuleIds.length === 0) {
      message.warning('请至少选择一条规则');
      return;
    }

    if (!uploadContent) {
      message.warning('请先上传或输入日志内容');
      return;
    }

    try {
      setLoading(true);
      const result = await validateRules({
        ruleIds: selectedRuleIds,
        uploadType,
        content: uploadContent,
        fileName: uploadFileName,
      });
      setResults(result.results);
    } catch (error: any) {
      message.error(error.message || '验证失败');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal
      title="规则验证"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="选择规则">
          <Checkbox.Group
            value={selectedRuleIds}
            onChange={(values) => setSelectedRuleIds(values as string[])}
          >
            <Space direction="vertical">
              {rules.map((rule) => (
                <Checkbox key={rule.id} value={rule.id}>
                  {rule.name}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Card>

        <Card title="输入日志内容">
          <UploadArea onUpload={handleUpload} loading={loading} />
        </Card>

        <Button
          type="primary"
          onClick={handleValidate}
          loading={loading}
          disabled={selectedRuleIds.length === 0 || !uploadContent}
          block
        >
          验证规则
        </Button>

        {results.length > 0 && (
          <Card title="验证结果">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {results.map((result) => (
                <Card
                  key={result.ruleId}
                  size="small"
                  style={{
                    border: result.matched ? '1px solid #52c41a' : '1px solid #ff4d4f',
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{result.ruleName}</Text>
                      <Space>
                        {result.matched ? (
                          <>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <Text type="success">匹配 {result.matchCount} 处</Text>
                          </>
                        ) : (
                          <>
                            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                            <Text type="danger">未匹配</Text>
                          </>
                        )}
                      </Space>
                    </div>

                    {result.matches.length > 0 && (
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {result.matches.map((match, index) => (
                          <Card key={index} size="small" style={{ background: '#fafafa' }}>
                            <Paragraph>
                              <Text strong>第 {match.lineNumber} 行：</Text>
                              <code>{match.matchedText}</code>
                            </Paragraph>
                            {match.context.before.length > 0 && (
                              <Paragraph>
                                <Text type="secondary">上下文（前）：</Text>
                                <br />
                                <code>{match.context.before.join('\n')}</code>
                              </Paragraph>
                            )}
                            {match.context.after.length > 0 && (
                              <Paragraph>
                                <Text type="secondary">上下文（后）：</Text>
                                <br />
                                <code>{match.context.after.join('\n')}</code>
                              </Paragraph>
                            )}
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
}

