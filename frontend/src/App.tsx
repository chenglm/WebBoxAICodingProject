import { Navigate, Route, Routes } from 'react-router-dom';
import { Button, Result } from 'antd';
import { copy } from './shared/copy/en';
import { AppShell } from './shared/ui/AppShell';
import { AuthProvider } from './features/auth/AuthContext';
import { RequireAdmin, RequireAuth } from './features/auth/guards';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { CartProvider } from './features/cart/CartContext';
import { MenuPage } from './features/menu/MenuPage';
import { CheckoutPage } from './features/cart/CheckoutPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { PreferencesPage } from './features/settings/PreferencesPage';
import { ConsoleDishesPage } from './features/console/ConsoleDishesPage';
import { ConsoleDailyMenuPage } from './features/console/ConsoleDailyMenuPage';

function NotFound() {
  return (
    <Result
      status="404"
      title={copy.guard.notFoundTitle}
      extra={
        <Button type="primary" href="/menu">
          {copy.guard.backToMenu}
        </Button>
      }
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Navigate to="/menu" replace />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/settings" element={<PreferencesPage />} />
            <Route
              path="/console/dishes"
              element={
                <RequireAdmin>
                  <ConsoleDishesPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/console/daily-menu"
              element={
                <RequireAdmin>
                  <ConsoleDailyMenuPage />
                </RequireAdmin>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
