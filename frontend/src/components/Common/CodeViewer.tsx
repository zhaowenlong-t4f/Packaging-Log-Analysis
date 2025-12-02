import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Card, Button } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { ContextLines, ContextLine } from '@/types/log.types';

interface CodeViewerProps {
  context: ContextLines;
  title?: string;
  defaultCollapsed?: boolean;
}

export function CodeViewer({ context, title = '代码上下文', defaultCollapsed = false }: CodeViewerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // 将上下文转换为代码字符串
  const formatCode = (lines: ContextLine[]): string => {
    return lines.map((line) => line.content).join('\n');
  };

  const beforeCode = formatCode(context.before);
  const currentCode = context.current.content;
  const afterCode = formatCode(context.after);

  const fullCode = [beforeCode, currentCode, afterCode].filter(Boolean).join('\n');

  // 计算当前行在完整代码中的行号
  const currentLineNumber = context.before.length + 1;

  return (
    <Card
      title={title}
      extra={
        <Button
          type="text"
          icon={collapsed ? <DownOutlined /> : <UpOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '展开' : '折叠'}
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      {!collapsed && (
        <Editor
          height="400px"
          defaultLanguage="plaintext"
          value={fullCode}
          options={{
            readOnly: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
          }}
          onMount={(editor) => {
            // 高亮当前行
            editor.deltaDecorations(
              [],
              [
                {
                  range: {
                    startLineNumber: currentLineNumber,
                    startColumn: 1,
                    endLineNumber: currentLineNumber,
                    endColumn: 1,
                  },
                  options: {
                    isWholeLine: true,
                    className: 'highlighted-line',
                    glyphMarginClassName: 'highlighted-line-glyph',
                  },
                },
              ]
            );
          }}
        />
      )}
    </Card>
  );
}

