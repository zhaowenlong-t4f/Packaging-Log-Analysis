import { useState, useEffect, useCallback } from 'react';
import { Space, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { RuleList } from '@/components/RuleManagement/RuleList';
import { RuleForm } from '@/components/RuleManagement/RuleForm';
import { RuleImportExport } from '@/components/RuleManagement/RuleImportExport';
import { RuleHistory } from '@/components/RuleManagement/RuleHistory';
import { RuleValidator } from '@/components/RuleManagement/RuleValidator';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  batchDeleteRules,
} from '@/services/api/ruleApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setRules,
  addRule,
  updateRule as updateRuleState,
  removeRule,
  removeRules,
  setSelectedRules,
  setQueryParams,
  setPagination,
  setLoading,
  setCurrentRule,
} from '@/store/slices/ruleSlice';
import { CreateRuleInput, UpdateRuleInput, Rule } from '@/types/rule.types';
import { ErrorBoundary } from '@/components/Common/ErrorBoundary';

function RuleManagementPage() {
  const dispatch = useAppDispatch();
  const {
    rules,
    selectedRules,
    queryParams,
    pagination,
    loading,
  } = useAppSelector((state) => state.rule);

  const [formVisible, setFormVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyRule, setHistoryRule] = useState<Rule | null>(null);
  const [validatorVisible, setValidatorVisible] = useState(false);

  // 加载规则列表
  const loadRules = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const result = await getRules(queryParams);
      dispatch(setRules(result.rules));
      dispatch(setPagination(result.pagination));
    } catch (error: any) {
      message.error(error.message || '加载规则失败');
    } finally {
      dispatch(setLoading(false));
    }
  }, [queryParams, dispatch]);

  useEffect(() => {
    // 初始化时加载规则列表
    loadRules().catch((error) => {
      console.error('Failed to load rules:', error);
    });
  }, [loadRules]);

  // 创建规则
  const handleCreate = async (values: CreateRuleInput) => {
    try {
      const rule = await createRule(values);
      dispatch(addRule(rule));
      message.success('规则创建成功');
      setFormVisible(false);
      loadRules();
    } catch (error: any) {
      message.error(error.message || '创建失败');
      throw error;
    }
  };

  // 编辑规则
  const handleEdit = async (values: UpdateRuleInput) => {
    if (!editingRule) return;

    try {
      const rule = await updateRule(editingRule.id, values);
      dispatch(updateRuleState(rule));
      message.success('规则更新成功');
      setFormVisible(false);
      setEditingRule(null);
      loadRules();
    } catch (error: any) {
      message.error(error.message || '更新失败');
      throw error;
    }
  };

  // 删除规则
  const handleDelete = async (ruleId: string) => {
    try {
      await deleteRule(ruleId);
      dispatch(removeRule(ruleId));
      message.success('规则删除成功');
      loadRules();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async (ruleIds: string[]) => {
    try {
      await batchDeleteRules({ ruleIds });
      dispatch(removeRules(ruleIds));
      dispatch(setSelectedRules([]));
      message.success(`成功删除 ${ruleIds.length} 条规则`);
      loadRules();
    } catch (error: any) {
      message.error(error.message || '批量删除失败');
    }
  };

  // 搜索
  const handleSearch = (keyword: string) => {
    dispatch(
      setQueryParams({
        ...queryParams,
        searchKeyword: keyword,
        pageNo: 1,
      })
    );
  };

  // 分类筛选
  const handleCategoryFilter = (categories: string[]) => {
    dispatch(
      setQueryParams({
        ...queryParams,
        categoryFilter: categories,
        pageNo: 1,
      })
    );
  };

  // 严重程度筛选
  const handleSeverityFilter = (severities: string[]) => {
    dispatch(
      setQueryParams({
        ...queryParams,
        severityFilter: severities as any,
        pageNo: 1,
      })
    );
  };

  // 排序
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    dispatch(
      setQueryParams({
        ...queryParams,
        sortBy,
        sortOrder,
      })
    );
  };

  // 分页
  const handlePageChange = (pageNo: number, pageSize: number) => {
    dispatch(
      setQueryParams({
        ...queryParams,
        pageNo,
        pageSize,
      })
    );
  };

  // 选择变化
  const handleSelectionChange = (selectedRowKeys: React.Key[]) => {
    dispatch(setSelectedRules(selectedRowKeys as string[]));
  };

  // 打开编辑表单
  const handleEditClick = (rule: Rule) => {
    setEditingRule(rule);
    setFormVisible(true);
  };

  // 打开历史
  const handleHistoryClick = (rule: Rule) => {
    setHistoryRule(rule);
    setHistoryVisible(true);
  };

  return (
    <ErrorBoundary>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRule(null);
              setFormVisible(true);
            }}
          >
            新建规则
          </Button>
          <RuleImportExport
            selectedRuleIds={selectedRules}
            onImportSuccess={loadRules}
          />
          <Button onClick={() => setValidatorVisible(true)}>验证规则</Button>
        </Space>

        <RuleList
          rules={rules}
          pagination={pagination}
          selectedRules={selectedRules}
          loading={loading}
          onRuleSelect={(rule) => dispatch(setCurrentRule(rule))}
          onRuleEdit={handleEditClick}
          onRuleDelete={handleDelete}
          onBatchDelete={handleBatchDelete}
          onRuleHistory={handleHistoryClick}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onCategoryFilter={handleCategoryFilter}
          onSeverityFilter={handleSeverityFilter}
          onSort={handleSort}
          onSelectionChange={handleSelectionChange}
        />

        <RuleForm
          visible={formVisible}
          rule={editingRule}
          onCancel={() => {
            setFormVisible(false);
            setEditingRule(null);
          }}
          onSubmit={editingRule ? (handleEdit as any) : (handleCreate as any)}
          loading={loading}
        />

        <RuleHistory
          visible={historyVisible}
          rule={historyRule}
          onCancel={() => {
            setHistoryVisible(false);
            setHistoryRule(null);
          }}
          onRollbackSuccess={loadRules}
        />

        <RuleValidator
          visible={validatorVisible}
          rules={rules}
          onCancel={() => setValidatorVisible(false)}
        />
      </Space>
    </ErrorBoundary>
  );
}

export default RuleManagementPage;
