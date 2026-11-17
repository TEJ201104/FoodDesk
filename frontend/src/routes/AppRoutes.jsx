import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthGuard, RoleGuard, PublicAuthRoute } from './ProtectedRoute';
import { StallGuard } from './StallGuard';
import { useAuth } from '../context/AuthContext';

// Stall Pages
import { StallDashboardPage } from '../pages/dashboard/StallDashboardPage';
import { POSPage } from '../pages/pos/POSPage';
import { OrderManagementPage } from '../pages/orders/OrderManagementPage';
import { KitchenDisplayPage } from '../pages/kds/KitchenDisplayPage';
import { MenuManagementPage } from '../pages/menu/MenuManagementPage';
import { ExpenseManagementPage } from '../pages/expenses/ExpenseManagementPage';
import { FinancialAnalyticsPage } from '../pages/analytics/FinancialAnalyticsPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { SupportPage } from '../pages/support/SupportPage';
import { StallSettingsPage } from '../pages/settings/StallSettingsPage';

// Super Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { StallManagementPage } from '../pages/admin/StallManagementPage';
import { OwnerManagementPage } from '../pages/admin/OwnerManagementPage';
import { AdminSupportPage } from '../pages/admin/AdminSupportPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

// Public & Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { PublicMenuPage } from '../pages/public/PublicMenuPage';
import { OrderTrackingPage } from '../pages/public/OrderTrackingPage';

export function AppRoutes() {
  const { isAuthenticated, isSuperAdmin } = useAuth();

  return (
    <Routes>
      {/* Root Entry Point: Clean top-level redirect without mounting protected layouts */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated
                ? isSuperAdmin
                  ? '/admin/dashboard'
                  : '/dashboard'
                : '/login'
            }
            replace
          />
        }
      />

      {/* Public Auth Gate (Default Entry Point is /login) */}
      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />

      {/* Public Customer Pages (No Auth Required) */}
      <Route path="/menu/:stallSlug" element={<PublicMenuPage />} />
      <Route path="/track/:stallSlug" element={<OrderTrackingPage />} />
      <Route path="/track/:stallSlug/:orderNumber" element={<OrderTrackingPage />} />

      {/* Protected App Layout Wrapper */}
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >

        {/* ======================================================== */}
        {/* STALL OWNER OPERATIONAL ROUTES (Strictly Protected)     */}
        {/* ======================================================== */}
        <Route
          element={
            <RoleGuard allowedRoles={['stall_owner']}>
              <StallGuard>
                <Outlet />
              </StallGuard>
            </RoleGuard>
          }
        >
          <Route path="/dashboard" element={<StallDashboardPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/orders" element={<OrderManagementPage />} />
          <Route path="/kds" element={<KitchenDisplayPage />} />
          <Route path="/menu" element={<MenuManagementPage />} />
          <Route path="/expenses" element={<ExpenseManagementPage />} />
          <Route path="/analytics" element={<FinancialAnalyticsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/settings" element={<StallSettingsPage />} />
        </Route>

        {/* ======================================================== */}
        {/* SUPER ADMIN GOVERNANCE ROUTES (Strictly Protected)      */}
        {/* ======================================================== */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRoles={['super_admin']}>
              <AdminDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/stalls"
          element={
            <RoleGuard allowedRoles={['super_admin']}>
              <StallManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/owners"
          element={
            <RoleGuard allowedRoles={['super_admin']}>
              <OwnerManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <RoleGuard allowedRoles={['super_admin']}>
              <AdminSupportPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleGuard allowedRoles={['super_admin']}>
              <AdminSettingsPage />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback Catch-All */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? isSuperAdmin
                  ? '/admin/dashboard'
                  : '/dashboard'
                : '/login'
            }
            replace
          />
        }
      />
    </Routes>
  );
}
