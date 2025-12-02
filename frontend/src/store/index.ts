/**
 * Redux Store 配置
 */

import { configureStore } from '@reduxjs/toolkit';
import logSlice from './slices/logSlice';
import ruleSlice from './slices/ruleSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    log: logSlice,
    rule: ruleSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

