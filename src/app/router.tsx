import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { FullScreenLoader } from '@/components/feedback/FullScreenLoader'
import { NotFoundPage } from '@/components/feedback/NotFoundPage'
import { AppError, PageError } from '@/components/feedback/RouteError'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'

type SettingsSections = typeof import('@/features/settings/pages/SettingsSections')

/** The settings pages share one chunk; this picks one of them. */
const settingsPage = (name: keyof SettingsSections) =>
  import('@/features/settings/pages/SettingsSections').then((m) => ({ Component: m[name] }))

/** Each feature page is loaded on demand, so the first load stays small. */
export const router = createBrowserRouter([
  {
    // Signed-in visits (most of them) never need the login form, so it loads on demand.
    path: '/login',
    lazy: () => import('@/features/auth/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
    HydrateFallback: FullScreenLoader,
    ErrorBoundary: AppError,
  },
  {
    Component: ProtectedRoute,
    HydrateFallback: FullScreenLoader,
    ErrorBoundary: AppError,
    children: [
      {
        Component: AppLayout,
        children: [
          {
            // A page that crashes shows its error inside the frame; the sidebar keeps working.
            ErrorBoundary: PageError,
            children: [
              {
                index: true,
                lazy: () => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
              },
              {
                path: 'sales',
                lazy: () => import('@/features/sales/pages/SalesPage').then((m) => ({ Component: m.SalesPage })),
              },
              {
                path: 'sales/:saleId',
                lazy: () => import('@/features/sales/pages/SaleDetailPage').then((m) => ({ Component: m.SaleDetailPage })),
              },
              {
                path: 'tasks',
                lazy: () => import('@/features/tasks/pages/TasksPage').then((m) => ({ Component: m.TasksPage })),
              },
              {
                path: 'invoices',
                lazy: () => import('@/features/invoices/pages/InvoicesPage').then((m) => ({ Component: m.InvoicesPage })),
              },
              {
                path: 'expenses',
                lazy: () => import('@/features/expenses/pages/ExpensesPage').then((m) => ({ Component: m.ExpensesPage })),
              },
              {
                path: 'employees',
                lazy: () => import('@/features/employees/pages/EmployeesPage').then((m) => ({ Component: m.EmployeesPage })),
              },
              {
                path: 'employees/:employeeId',
                lazy: () =>
                  import('@/features/employees/pages/EmployeeDetailPage').then((m) => ({ Component: m.EmployeeDetailPage })),
              },
              {
                path: 'statement',
                lazy: () => import('@/features/statement/pages/StatementPage').then((m) => ({ Component: m.StatementPage })),
              },
              {
                path: 'settings',
                lazy: () => import('@/features/settings/pages/SettingsLayout').then((m) => ({ Component: m.SettingsLayout })),
                children: [
                  { index: true, element: <Navigate to="tax" replace /> },
                  { path: 'tax', lazy: () => settingsPage('TaxSharesSettings') },
                  { path: 'fx-rates', lazy: () => settingsPage('FxRatesSettings') },
                  { path: 'rtos', lazy: () => settingsPage('RtosSettings') },
                  { path: 'courses', lazy: () => settingsPage('CoursesSettings') },
                  { path: 'invoice', lazy: () => settingsPage('InvoiceProfileSettings') },
                  { path: 'backup', lazy: () => settingsPage('BackupSettings') },
                  { path: '*', element: <Navigate to="/settings" replace /> },
                ],
              },
              { path: '*', Component: NotFoundPage },
            ],
          },
        ],
      },
    ],
  },
])
