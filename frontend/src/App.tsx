import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { MainLayout } from './components/Layout/MainLayout';

// 代码分割 - 懒加载页面
const LogAnalysisPage = lazy(() => import('./pages/LogAnalysisPage'));
const RuleManagementPage = lazy(() => import('./pages/RuleManagementPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/analysis" replace />} />
          <Route
            path="analysis"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LogAnalysisPage />
              </Suspense>
            }
          />
          <Route
            path="rules"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <RuleManagementPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

