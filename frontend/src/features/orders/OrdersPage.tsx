import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Drawer, List, Popconfirm, Space, Tag, Typography } from 'antd';
import { copy } from '../../shared/copy/en';
import type { Order, OrderStatus } from '../../shared/api/types';
import { ApiError, describeError } from '../../shared/api/http';
import { PriceText } from '../../shared/ui/PriceText';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/StateViews';
import { cancelOrder, fetchOrders } from './api';

function statusTagColor(status: OrderStatus): string {
  switch (status) {
    case 'Pending':
      return 'gold';
    case 'Confirmed':
      return 'blue';
    case 'Cancelled':
      return 'default';
  }
}

export function OrdersPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);

  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (updated) => {
      message.success(copy.orders.cancelSuccess);
      setSelected(updated);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'ORDER_NOT_CANCELLABLE') {
        message.error(copy.orders.cancelFailed);
      } else {
        message.error(describeError(error));
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  if (ordersQuery.isLoading) {
    return (
      <div className="webox-page">
        <LoadingView />
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="webox-page">
        <ErrorView error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <div className="webox-page" style={{ maxWidth: 960, margin: '0 auto' }}>
      <Typography.Title level={3}>{copy.orders.title}</Typography.Title>
      {orders.length === 0 ? (
        <>
          <EmptyView description={copy.empty.orders} />
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" href="/menu">
              {copy.checkout.backToMenu}
            </Button>
          </div>
        </>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2 }}
          dataSource={orders}
          renderItem={(order) => (
            <List.Item>
              <Card hoverable onClick={() => setSelected(order)}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text strong>
                      {copy.orders.orderNumber} {order.orderNumber}
                    </Typography.Text>
                    <Tag color={statusTagColor(order.status)}>{copy.orderStatus[order.status]}</Tag>
                  </div>
                  <Typography.Text type="secondary">
                    {copy.orders.deliveryOn}: {order.deliveryDate} · {copy.mealPeriod[order.mealPeriod]}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {order.items.map((i) => `${i.dishName} × ${i.quantity}`).join(', ')}
                  </Typography.Text>
                  <PriceText cents={order.totalCents} strong />
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Drawer
        title={`${copy.orders.detailTitle} · ${selected?.orderNumber ?? ''}`}
        open={selected !== null}
        onClose={() => setSelected(null)}
        width={480}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space size={8} wrap>
              <Tag color={statusTagColor(selected.status)}>{copy.orderStatus[selected.status]}</Tag>
            </Space>
            <div>
              <Typography.Text strong>{copy.orders.addressLabel}</Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 0 }}>{selected.addressSnapshot}</Typography.Paragraph>
              <Typography.Text type="secondary">
                {selected.deliveryDate} · {copy.mealPeriod[selected.mealPeriod]}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text strong>{copy.orders.items}</Typography.Text>
              <List
                dataSource={selected.items}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${item.dishName} × ${item.quantity}`}
                      description={
                        item.options.length > 0
                          ? item.options.map((o) => o.name).join(', ')
                          : undefined
                      }
                    />
                    <PriceText cents={item.subtotalCents} />
                  </List.Item>
                )}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography.Text strong>{copy.common.total}</Typography.Text>
              <PriceText cents={selected.totalCents} strong style={{ fontSize: 18 }} />
            </div>
            {selected.status === 'Pending' ? (
              <Popconfirm
                title={copy.orders.cancelConfirmTitle}
                description={copy.orders.cancelConfirmBody}
                okText={copy.common.confirm}
                cancelText={copy.common.cancel}
                onConfirm={() => cancelMutation.mutate(selected.id)}
              >
                <Button danger block loading={cancelMutation.isPending}>
                  {copy.orders.cancelOrder}
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
