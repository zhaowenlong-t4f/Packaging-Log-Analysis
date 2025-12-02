/**
 * 日志分析状态管理
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LogAnalysisResult, ErrorDetail, LogDetailQueryParams } from '@/types/log.types';

interface LogState {
  currentAnalysis: LogAnalysisResult | null;
  errorDetails: Record<string, ErrorDetail>; // errorId -> ErrorDetail
  queryParams: LogDetailQueryParams | null;
  loading: boolean;
  error: string | null;
}

const initialState: LogState = {
  currentAnalysis: null,
  errorDetails: {},
  queryParams: null,
  loading: false,
  error: null,
};

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    setCurrentAnalysis: (state, action: PayloadAction<LogAnalysisResult>) => {
      state.currentAnalysis = action.payload;
      state.error = null;
    },
    setErrorDetail: (state, action: PayloadAction<{ errorId: string; detail: ErrorDetail }>) => {
      state.errorDetails[action.payload.errorId] = action.payload.detail;
    },
    setQueryParams: (state, action: PayloadAction<LogDetailQueryParams>) => {
      state.queryParams = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAnalysis: (state) => {
      state.currentAnalysis = null;
      state.errorDetails = {};
      state.queryParams = null;
      state.error = null;
    },
  },
});

export const {
  setCurrentAnalysis,
  setErrorDetail,
  setQueryParams,
  setLoading,
  setError,
  clearAnalysis,
} = logSlice.actions;

export default logSlice.reducer;

