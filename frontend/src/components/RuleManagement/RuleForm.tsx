import { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
} from 'antd';
import { CreateRuleInput, UpdateRuleInput, Rule } from '@/types/rule.types';
import { SEVERITY_OPTIONS } from '@/config/constants';

const { TextArea } = Input;

interface RuleFormProps {
  visible: boolean;
  rule?: Rule | null;
  onCancel: () => void;
  onSubmit: (values: CreateRuleInput | UpdateRuleInput) => Promise<void>;
  loading?: boolean;
}

export function RuleForm({
  visible,
  rule,
  onCancel,
  onSubmit,
  loading = false,
}: RuleFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (rule) {
        form.setFieldsValue({
          name: rule.name,
          regex: rule.regex,
          keywords: rule.keywords,
          solution: rule.solution,
          severity: rule.severity,
          weight: rule.weight,
          categories: rule.categories,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, rule, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error('提交失败');
    }
  };

  // 验证正则表达式
  const validateRegex = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入正则表达式'));
    }
    try {
      new RegExp(value);
      return Promise.resolve();
    } catch (e: any) {
      return Promise.reject(new Error(`正则表达式语法错误: ${e.message}`));
    }
  };

  return (
    <Modal
      title={rule ? '编辑规则' : '新建规则'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          severity: 'ERROR',
          weight: 50,
        }}
      >
        <Form.Item
          name="name"
          label="规则名称"
          rules={[
            { required: true, message: '请输入规则名称' },
            { min: 2, message: '规则名称至少2个字符' },
            { max: 100, message: '规则名称最多100个字符' },
          ]}
        >
          <Input placeholder="请输入规则名称" />
        </Form.Item>

        <Form.Item
          name="regex"
          label="正则表达式"
          rules={[{ required: true, validator: validateRegex }]}
          extra="用于匹配日志中的错误模式"
        >
          <Input placeholder="例如: error CS\\d{4}: (.*)" />
        </Form.Item>

        <Form.Item
          name="keywords"
          label="关键词"
          rules={[
            { required: true, message: '至少添加一个关键词' },
            {
              validator: (_: any, value: string[]) => {
                if (!value || value.length === 0) {
                  return Promise.reject(new Error('至少添加一个关键词'));
                }
                if (value.length > 50) {
                  return Promise.reject(new Error('最多50个关键词'));
                }
                return Promise.resolve();
              },
            },
          ]}
          extra="用于快速筛选，至少一个关键词出现在日志行中才会进行正则匹配"
        >
          <Select
            mode="tags"
            placeholder="输入关键词后按回车添加"
            tokenSeparators={[',']}
          />
        </Form.Item>

        <Form.Item
          name="severity"
          label="严重程度"
          rules={[{ required: true, message: '请选择严重程度' }]}
        >
          <Select options={SEVERITY_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="weight"
          label="权重"
          rules={[
            { required: true, message: '请输入权重' },
            { type: 'number', min: 0, max: 100, message: '权重必须在0-100之间' },
          ]}
          extra="权重影响错误排序，数值越大优先级越高"
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="categories"
          label="分类标签"
          extra="用于规则分类管理，最多10个"
        >
          <Select
            mode="tags"
            placeholder="输入分类后按回车添加"
            tokenSeparators={[',']}
            maxTagCount={10}
          />
        </Form.Item>

        <Form.Item
          name="solution"
          label="解决方案"
          rules={[{ max: 5000, message: '解决方案最多5000个字符' }]}
          extra="Markdown格式，用于描述如何解决该错误"
        >
          <TextArea
            rows={6}
            placeholder="请输入解决方案（Markdown格式）..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

