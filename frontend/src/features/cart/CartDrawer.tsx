import { useNavigate } from 'react-router-dom';
import { App, Button, Drawer, InputNumber, List, Space, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { copy } from '../../shared/copy/en';
import { MAX_TOTAL_PORTIONS } from '../../shared/lib/constants';
import { PriceText } from '../../shared/ui/PriceText';
import { EmptyView } from '../../shared/ui/StateViews';
import { lineSubtotalCents, lineUnitPriceCents } from './cartReducer';
import { useCart } from './CartContext';

export function CartDrawer() {
  const { state, isOpen, closeCart, dispatch, total, portions } = useCart();
  const navigate = useNavigate();
  const { message } = App.useApp();

  return (
    <Drawer
      title={`${copy.cart.title} (${portions}/${MAX_TOTAL_PORTIONS})`}
      open={isOpen}
      onClose={closeCart}
      width={420}
      footer={
        state.lines.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Text type="secondary">{copy.cart.portionLimitHint}</Typography.Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Text strong>{copy.cart.subtotal}</Typography.Text>
              <PriceText cents={total} strong style={{ fontSize: 18 }} />
            </div>
            <Button
              type="primary"
              block
              onClick={() => {
                closeCart();
                navigate('/checkout');
              }}
            >
              {copy.cart.checkout}
            </Button>
          </Space>
        ) : undefined
      }
    >
      {state.lines.length === 0 ? (
        <EmptyView description={copy.empty.cart} />
      ) : (
        <List
          dataSource={state.lines}
          renderItem={(line) => (
            <List.Item
              actions={[
                <Button
                  key="remove"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={copy.cart.removeLine}
                  onClick={() => dispatch({ type: 'REMOVE', key: line.key })}
                />,
              ]}
            >
              <List.Item.Meta
                title={line.dishName}
                description={
                  line.options.length > 0
                    ? `${copy.cart.optionsLabel}: ${line.options.map((o) => o.name).join(', ')}`
                    : undefined
                }
              />
              <Space direction="vertical" align="end" size={4}>
                <InputNumber
                  min={1}
                  max={MAX_TOTAL_PORTIONS}
                  value={line.quantity}
                  onChange={(value) => {
                    const rejected = dispatch({
                      type: 'SET_QUANTITY',
                      key: line.key,
                      quantity: value ?? 1,
                    });
                    if (rejected > 0) {
                      message.warning(copy.cart.portionLimitReached);
                    }
                  }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  <PriceText cents={lineUnitPriceCents(line)} /> × {line.quantity}
                </Typography.Text>
                <PriceText cents={lineSubtotalCents(line)} strong />
              </Space>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
