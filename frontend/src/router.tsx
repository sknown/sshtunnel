import { createHashRouter } from 'react-router-dom';
import App from './App';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '',
        lazy: async () => {
          const { HomePage } = await import('./pages/Home');
          return { Component: HomePage };
        },
      },
      {
        path: 'login',
        lazy: async () => {
          const { LoginPage } = await import('./pages/Login');
          return { Component: LoginPage };
        },
      },
      {
        path: 'register',
        lazy: async () => {
          const { RegisterPage } = await import('./pages/Register');
          return { Component: RegisterPage };
        },
      },
      {
        path: 'dashboard',
        lazy: async () => {
          const { DashboardPage } = await import('./pages/Dashboard');
          return { 
            Component: () => (
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            )
          };
        },
      },
    ],
  },
]);

export default router;