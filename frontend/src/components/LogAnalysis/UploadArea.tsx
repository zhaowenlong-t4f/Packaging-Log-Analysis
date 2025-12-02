import { useState } from 'react';
import { Tabs, Input, Button, Upload, message, Progress, Space, Typography } from 'antd';
import { UploadOutlined, LinkOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import { UploadType, LogUploadRequest } from '@/types/log.types';
import { MAX_FILE_SIZE, MAX_TEXT_SIZE } from '@/config/constants';

const { TextArea } = Input;
const { Text } = Typography;

interface UploadAreaProps {
  onUpload: (request: LogUploadRequest) => Promise<void>;
  loading?: boolean;
}

export function UploadArea({ onUpload, loading = false }: UploadAreaProps) {
  const [activeTab, setActiveTab] = useState<UploadType>('url');
  const [url, setUrl] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [text, setText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // URL 上传
  const handleUrlUpload = async () => {
    if (!url.trim()) {
      message.error('请输入URL');
      return;
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      message.error('请输入有效的URL');
      return;
    }

    try {
      setUploadProgress(0);
      await onUpload({
        uploadType: 'url',
        content: url,
        fileName: url.split('/').pop() || 'log.txt',
      });
      setUrl('');
      setUploadProgress(100);
    } catch (error) {
      message.error('上传失败');
    }
  };


  const fileUploadProps: UploadProps = {
    fileList,
    beforeUpload: (file) => {
      if (file.size > MAX_FILE_SIZE) {
        message.error(`文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return false;
      }
      return false; // 阻止自动上传
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    customRequest: () => {}, // 阻止自动上传，手动处理
    maxCount: 1,
  };

  // 文本上传
  const handleTextUpload = async () => {
    if (!text.trim()) {
      message.error('请输入日志内容');
      return;
    }

    const textSize = new Blob([text]).size;
    if (textSize > MAX_TEXT_SIZE) {
      message.error(`文本大小不能超过 ${MAX_TEXT_SIZE / 1024 / 1024}MB`);
      return;
    }

    try {
      setUploadProgress(0);
      await onUpload({
        uploadType: 'text',
        content: text,
        fileName: 'pasted-log.txt',
      });
      setText('');
      setUploadProgress(100);
    } catch (error) {
      message.error('上传失败');
    }
  };

  // 计算文本大小
  const textSize = new Blob([text]).size;
  const textSizeMB = (textSize / 1024 / 1024).toFixed(2);

  const tabItems = [
    {
      key: 'url',
      label: (
        <Space>
          <LinkOutlined />
          URL上传
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="请输入日志文件的URL（http:// 或 https://）"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPressEnter={handleUrlUpload}
            disabled={loading}
          />
          <Button
            type="primary"
            onClick={handleUrlUpload}
            loading={loading}
            block
          >
            上传并分析
          </Button>
        </Space>
      ),
    },
    {
      key: 'file',
      label: (
        <Space>
          <UploadOutlined />
          本地文件
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload.Dragger {...fileUploadProps} disabled={loading}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 .log, .txt 等格式，最大 {MAX_FILE_SIZE / 1024 / 1024}MB
            </p>
          </Upload.Dragger>
          {fileList.length > 0 && (
            <Button
              type="primary"
              onClick={async () => {
                // 触发文件上传
                const file = fileList[0];
                if (file.originFileObj instanceof File) {
                  try {
                    setUploadProgress(0);
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      const base64 = e.target?.result as string;
                      const base64Content = base64.split(',')[1];
                      await onUpload({
                        uploadType: 'file',
                        content: base64Content,
                        fileName: file.originFileObj!.name,
                      });
                      setUploadProgress(100);
                      setFileList([]);
                    };
                    reader.onerror = () => {
                      message.error('文件读取失败');
                    };
                    reader.readAsDataURL(file.originFileObj);
                  } catch (error) {
                    message.error('上传失败');
                  }
                }
              }}
              loading={loading}
              block
            >
              上传并分析
            </Button>
          )}
        </Space>
      ),
    },
    {
      key: 'text',
      label: (
        <Space>
          <FileTextOutlined />
          粘贴文本
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            placeholder="请粘贴日志内容..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={15}
            disabled={loading}
            style={{ fontFamily: 'monospace' }}
          />
          <Space>
            <Text type="secondary">
              当前大小: {textSizeMB}MB / {MAX_TEXT_SIZE / 1024 / 1024}MB
            </Text>
          </Space>
          <Button
            type="primary"
            onClick={handleTextUpload}
            loading={loading}
            block
          >
            上传并分析
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as UploadType)}
        items={tabItems}
      />
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Progress percent={uploadProgress} style={{ marginTop: 16 }} />
      )}
    </div>
  );
}

