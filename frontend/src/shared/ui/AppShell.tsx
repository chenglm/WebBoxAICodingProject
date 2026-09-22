import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App, Badge, Button, Drawer, Dropdown, Grid, Layout, Menu, Space, Typography } from 'antd';
import { LogoutOutlined, MenuOutlined, SettingOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { copy } from '../copy/en';
import { useAuth } from '../../features/auth/AuthContext';
import { logout } from '../../features/auth/api';
import { useCart } from '../../features/cart/CartContext';
import { CartDrawer } from '../../features/cart/CartDrawer';

const { Header, Content } = Layout;

/**
 * Responsive application shell: top navigation on desktop, hamburger drawer
 * on mobile. Cart entry point lives in the header on every breakpoint.
 */
export function AppShell() {
  const { user, setUser } = useAuth();
  const { portions, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [navOpen, setNavOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      setUser(null);
      message.success(copy.auth.logoutSuccess);
      navigate('/login', { replace: true });
    },
  });

  const navItems = [
    { key: '/menu', label: <Link to="/menu">{copy.nav.menu}</Link> },
    { key: '/orders', label: <Link to="/orders">{copy.nav.orders}</Link> },
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: 'console',
            label: copy.nav.console,
            children: [
              { key: '/console/dishes', label: <Link to="/console/dishes">{copy.nav.consoleDishes}</Link> },
              { key: '/console/daily-menu', label: <Link to="/console/daily-menu">{copy.nav.consoleDailyMenu}</Link> },
            ],
          },
        ]
      : []),
  ];

  const selectedKey =
    navItems
      .flatMap((item) => ('children' in item && item.children ? item.children : [item]))
      .find((item) => location.pathname.startsWith(item.key))?.key ?? '/menu';

  const userMenu = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: copy.nav.settings },
      { key: 'logout', icon: <LogoutOutlined />, label: copy.nav.logout },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'settings') navigate('/settings');
      if (key === 'logout') logoutMutation.mutate();
    },
  };

  const nav = (
    <Menu
      mode={isMobile ? 'inline' : 'horizontal'}
      selectedKeys={[selectedKey]}
      items={navItems}
      onClick={() => setNavOpen(false)}
      style={{ flex: isMobile ? undefined : 1, minWidth: 0, borderBottom: 'none' }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: isMobile ? '0 12px' : '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        {isMobile ? (
          <Button
            type="text"
            icon={<MenuOutlined />}
            aria-label={copy.nav.openNavigation}
            onClick={() => setNavOpen(true)}
          />
        ) : null}
        <Typography.Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>
          <Link to="/menu" style={{ color: 'inherit' }}>
            {copy.app.name}
          </Link>
        </Typography.Title>
        {isMobile ? <div style={{ flex: 1 }} /> : nav}
        <Space size="middle">
          <Badge count={portions} size="small">
            <Button
              type="text"
              icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
              aria-label={copy.nav.cart}
              onClick={openCart}
            />
          </Badge>
          <Dropdown menu={userMenu} trigger={['click']}>
            <Button type="text" icon={<UserOutlined />} aria-label={user?.email}>
              {isMobile ? null : user?.email}
            </Button>
          </Dropdown>
        </Space>
      </Header>
      <Drawer
        placement="left"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        width={260}
        title={copy.app.name}
      >
        {nav}
      </Drawer>
      <Content className="webox-shell-content">
        <Outlet />
      </Content>
      <CartDrawer />
    </Layout>
  );
}
