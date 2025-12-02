/**
 * 规则管理状态管理
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Rule, RuleQueryParams, RuleHistory } from '@/types/rule.types';
import { PaginationResponse } from '@/types/common.types';

interface RuleState {
  rules: Rule[];
  selectedRules: string[]; // 选中的规则ID
  currentRule: Rule | null;
  ruleHistories: Record<string, RuleHistory[]>; // ruleId -> histories
  queryParams: RuleQueryParams;
  pagination: PaginationResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: RuleState = {
  rules: [],
  selectedRules: [],
  currentRule: null,
  ruleHistories: {},
  queryParams: {
    pageNo: 1,
    pageSize: 20,
  },
  pagination: null,
  loading: false,
  error: null,
};

const ruleSlice = createSlice({
  name: 'rule',
  initialState,
  reducers: {
    setRules: (state, action: PayloadAction<Rule[]>) => {
      state.rules = action.payload;
      state.error = null;
    },
    addRule: (state, action: PayloadAction<Rule>) => {
      state.rules.push(action.payload);
    },
    updateRule: (state, action: PayloadAction<Rule>) => {
      const index = state.rules.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.rules[index] = action.payload;
      }
      if (state.currentRule?.id === action.payload.id) {
        state.currentRule = action.payload;
      }
    },
    removeRule: (state, action: PayloadAction<string>) => {
      state.rules = state.rules.filter((r) => r.id !== action.payload);
      state.selectedRules = state.selectedRules.filter((id) => id !== action.payload);
      if (state.currentRule?.id === action.payload) {
        state.currentRule = null;
      }
    },
    removeRules: (state, action: PayloadAction<string[]>) => {
      state.rules = state.rules.filter((r) => !action.payload.includes(r.id));
      state.selectedRules = state.selectedRules.filter((id) => !action.payload.includes(id));
      if (state.currentRule && action.payload.includes(state.currentRule.id)) {
        state.currentRule = null;
      }
    },
    setSelectedRules: (state, action: PayloadAction<string[]>) => {
      state.selectedRules = action.payload;
    },
    toggleRuleSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedRules.indexOf(action.payload);
      if (index === -1) {
        state.selectedRules.push(action.payload);
      } else {
        state.selectedRules.splice(index, 1);
      }
    },
    clearSelection: (state) => {
      state.selectedRules = [];
    },
    setCurrentRule: (state, action: PayloadAction<Rule | null>) => {
      state.currentRule = action.payload;
    },
    setRuleHistories: (state, action: PayloadAction<{ ruleId: string; histories: RuleHistory[] }>) => {
      state.ruleHistories[action.payload.ruleId] = action.payload.histories;
    },
    setQueryParams: (state, action: PayloadAction<Partial<RuleQueryParams>>) => {
      state.queryParams = { ...state.queryParams, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<PaginationResponse>) => {
      state.pagination = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setRules,
  addRule,
  updateRule,
  removeRule,
  removeRules,
  setSelectedRules,
  toggleRuleSelection,
  clearSelection,
  setCurrentRule,
  setRuleHistories,
  setQueryParams,
  setPagination,
  setLoading,
  setError,
} = ruleSlice.actions;

export default ruleSlice.reducer;

