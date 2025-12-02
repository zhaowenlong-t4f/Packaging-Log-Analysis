import { useState, useCallback } from 'react';
import { Layout, Row, Col, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { UploadArea } from '@/components/LogAnalysis/UploadArea';
import { ErrorList } from '@/components/LogAnalysis/ErrorList';
import { ErrorDetail } from '@/components/LogAnalysis/ErrorDetail';
import { analyzeLog, getLogDetails } from '@/services/api/logApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentAnalysis,
  setErrorDetail,
  setQueryParams,
  setLoading,
  clearAnalysis,
} from '@/store/slices/logSlice';
import { LogUploadRequest, ErrorSummary, LogDetailQueryParams } from '@/types/log.types';
import { ErrorBoundary } from '@/components/Common/ErrorBoundary';

const { Content } = Layout;

function LogAnalysisPage() {
  const dispatch = useAppDispatch();
  const { currentAnalysis, errorDetails, queryParams, loading } = useAppSelector(
    (state) => state.log
  );

  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [currentErrors, setCurrentErrors] = useState<ErrorSummary[]>([]);
  const [currentPagination, setCurrentPagination] = useState<any>(null);

  // 处理日志上传
  const handleUpload = useCallback(
    async (request: LogUploadRequest) => {
      try {
        dispatch(setLoading(true));
        const result = await analyzeLog(request);
        dispatch(setCurrentAnalysis(result));
        const errors = result.errors || [];
        setCurrentErrors(errors);
        setSelectedErrorId(errors.length > 0 ? errors[0].id : null);

        // 如果有错误，加载第一个错误的详情
        if (errors.length > 0) {
          await loadErrorDetails(result.analysisId, errors[0].id);
        }

        message.success('日志分析完成');
      } catch (error: any) {
        message.error(error.message || '日志分析失败');
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  // 加载错误详情
  const loadErrorDetails = async (analysisId: string, errorId: string) => {
    try {
      // 如果已缓存，直接使用
      if (errorDetails[errorId]) {
        return;
      }

      // 从当前错误列表或通过API获取详情
      let errorDetail = currentErrors.find((e) => e.id === errorId);
      
      if (!errorDetail) {
        // 如果当前列表中没有，通过API获取
        const params: LogDetailQueryParams = {
          analysisId,
          pageNo: 1,
          pageSize: 100, // 获取更多数据以便找到目标错误
        };
        const detailsResult = await getLogDetails(params);
        const items = detailsResult.data?.items || [];
        errorDetail = items.find((e) => e.id === errorId);
      }
      
      if (errorDetail) {
        // 确保 errorDetail 包含 occurrences 字段，并且是 ErrorDetail 类型
        const detail: any = {
          ...errorDetail,
          occurrences: (errorDetail as any).occurrences || [],
        };
        dispatch(setErrorDetail({ errorId, detail }));
      } else {
        // 如果找不到详情，尝试从当前错误列表中找到并设置基本信息
        const summaryError = currentErrors.find((e) => e.id === errorId);
        if (summaryError) {
          const detail: any = {
            ...summaryError,
            occurrences: [],
          };
          dispatch(setErrorDetail({ errorId, detail }));
        }
      }
    } catch (error) {
      console.error('加载错误详情失败:', error);
    }
  };

  // 选择错误
  const handleErrorSelect = useCallback(
    async (error: ErrorSummary) => {
      setSelectedErrorId(error.id);
      if (currentAnalysis) {
        await loadErrorDetails(currentAnalysis.analysisId, error.id);
      }
    },
    [currentAnalysis]
  );

  // 分页变化
  const handlePageChange = useCallback(
    async (pageNo: number, pageSize: number) => {
      if (!currentAnalysis) return;

      try {
        dispatch(setLoading(true));
        const params: LogDetailQueryParams = {
          ...queryParams,
          analysisId: currentAnalysis.analysisId,
          pageNo,
          pageSize,
        };
        dispatch(setQueryParams(params));

        const result = await getLogDetails(params);
        const items = result.data?.items || [];
        const pagination = result.data?.pagination;
        setCurrentErrors(items);
        setCurrentPagination(pagination);
      } catch (error: any) {
        message.error(error.message || '加载失败');
        setCurrentErrors([]);
        setCurrentPagination(null);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [currentAnalysis, queryParams, dispatch]
  );

  // 搜索
  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!currentAnalysis) return;

      try {
        dispatch(setLoading(true));
        const params: LogDetailQueryParams = {
          ...queryParams,
          analysisId: currentAnalysis.analysisId,
          searchKeyword: keyword || undefined,
          pageNo: 1, // 搜索时重置到第一页
        };
        dispatch(setQueryParams(params));

        const result = await getLogDetails(params);
        const items = result.data?.items || [];
        const pagination = result.data?.pagination;
        setCurrentErrors(items);
        setCurrentPagination(pagination);
        
        // 如果当前选中的错误不在搜索结果中，选择第一个
        if (items.length > 0 && (!selectedErrorId || !items.find(e => e.id === selectedErrorId))) {
          setSelectedErrorId(items[0].id);
          await loadErrorDetails(currentAnalysis.analysisId, items[0].id);
        } else if (items.length === 0) {
          setSelectedErrorId(null);
        }
      } catch (error: any) {
        message.error(error.message || '搜索失败');
        setCurrentErrors([]);
        setCurrentPagination(null);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [currentAnalysis, queryParams, dispatch, selectedErrorId]
  );

  // 严重程度筛选
  const handleSeverityFilter = useCallback(
    async (severities: string[]) => {
      if (!currentAnalysis) return;

      try {
        dispatch(setLoading(true));
        const params: LogDetailQueryParams = {
          ...queryParams,
          analysisId: currentAnalysis.analysisId,
          severityFilter: severities.length > 0 ? severities : undefined,
          pageNo: 1, // 筛选时重置到第一页
        };
        dispatch(setQueryParams(params));

        const result = await getLogDetails(params);
        const items = result.data?.items || [];
        const pagination = result.data?.pagination;
        setCurrentErrors(items);
        setCurrentPagination(pagination);
        
        // 如果当前选中的错误不在筛选结果中，选择第一个
        if (items.length > 0 && (!selectedErrorId || !items.find(e => e.id === selectedErrorId))) {
          setSelectedErrorId(items[0].id);
          await loadErrorDetails(currentAnalysis.analysisId, items[0].id);
        } else if (items.length === 0) {
          setSelectedErrorId(null);
        }
      } catch (error: any) {
        message.error(error.message || '筛选失败');
        setCurrentErrors([]);
        setCurrentPagination(null);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [currentAnalysis, queryParams, dispatch, selectedErrorId]
  );

  // 处理回退到上传界面
  const handleBackToUpload = useCallback(() => {
    dispatch(clearAnalysis());
    setCurrentErrors([]);
    setCurrentPagination(null);
    setSelectedErrorId(null);
  }, [dispatch]);

  const selectedError = selectedErrorId ? errorDetails[selectedErrorId] || null : null;

  return (
    <ErrorBoundary>
      <Content>
        {!currentAnalysis ? (
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
            <UploadArea onUpload={handleUpload} loading={loading} />
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Button
                icon={<UploadOutlined />}
                onClick={handleBackToUpload}
                type="default"
              >
                重新上传日志
              </Button>
            </div>
            <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
              <Col span={8} style={{ height: '100%' }}>
                <ErrorList
                  errors={currentErrors}
                  pagination={currentPagination}
                  loading={loading}
                  selectedErrorId={selectedErrorId || undefined}
                  onErrorSelect={handleErrorSelect}
                  onPageChange={handlePageChange}
                  onSearch={handleSearch}
                  onSeverityFilter={handleSeverityFilter}
                />
              </Col>
              <Col span={16} style={{ height: '100%' }}>
                <ErrorDetail error={selectedError} loading={loading} />
              </Col>
            </Row>
          </div>
        )}
      </Content>
    </ErrorBoundary>
  );
}

export default LogAnalysisPage;
