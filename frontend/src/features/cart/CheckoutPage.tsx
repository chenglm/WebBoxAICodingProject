import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Input,
  List,
  Radio,
  Result,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { ApiError, describeError } from '../../shared/api/http';
import { copy } from '../../shared/copy/en';
import type { Order } from '../../shared/api/types';
import {
  addDays,
  isSlotOpen,
  resolveSuggestedSlot,
  todayInBusinessZone,
  type MealPeriod,
} from '../../shared/lib/mealSlot';
import { MAX_ADDRESS_LENGTH } from '../../shared/lib/constants';
import { formatCents } from '../../shared/lib/money';
import { PriceText } from '../../shared/ui/PriceText';
import { EmptyView } from '../../shared/ui/StateViews';
import { fetchSlotSuggestion } from '../menu/api';
import { fetchAddresses, submitOrder } from '../orders/api';
import { DEFAULT_PREFERENCES, usePreferences } from '../settings/hooks';
import { lineSubtotalCents, lineUnitPriceCents } from './cartReducer';
import { useCart } from './CartContext';

function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutPage() {
  const { state, total, dispatch } = useCart();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const preferencesQuery = usePreferences();
  const preferences = preferencesQuery.data ?? DEFAULT_PREFERENCES;
  const addressesQuery = useQuery({ queryKey: ['addresses'], queryFn: fetchAddresses });
  const slotQuery = useQuery({
    queryKey: ['orders', 'suggestion'],
    queryFn: fetchSlotSuggestion,
    retry: false,
  });

  const suggestedSlot = slotQuery.data ?? {
    deliveryDate: resolveSuggestedSlot().date,
    mealPeriod: resolveSuggestedSlot().mealPeriod,
  };
  const [date, setDate] = useState<Dayjs>(dayjs(suggestedSlot.deliveryDate));
  const [mealPeriod, setMealPeriod] = useState<MealPeriod>(suggestedSlot.mealPeriod);
  const [addressChoice, setAddressChoice] = useState<number | 'new' | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [duplicateOrder, setDuplicateOrder] = useState(false);

  // Sync from the backend suggestion once it arrives (backend is authoritative).
  useEffect(() => {
    if (slotQuery.data) {
      setDate(dayjs(slotQuery.data.deliveryDate));
      setMealPeriod(slotQuery.data.mealPeriod);
    }
  }, [slotQuery.data]);

  // Pick the default address once history loads.
  useEffect(() => {
    if (addressChoice === null && addressesQuery.data && addressesQuery.data.length > 0) {
      const preferred = addressesQuery.data.find((a) => a.isDefault) ?? addressesQuery.data[0];
      setAddressChoice(preferred.id);
    }
  }, [addressesQuery.data, addressChoice]);

  // One Idempotency-Key per cart content + slot: retries of the same order
  // reuse the key; a genuinely different order gets a fresh key.
  const cartSignature = useMemo(
    () =>
      state.lines
        .map((l) => `${l.key}:${l.quantity}`)
        .sort()
        .join('|') +
      `@${date.format('YYYY-MM-DD')}#${mealPeriod}`,
    [state.lines, date, mealPeriod],
  );
  const idempotencyKeyRef = useRef<{ signature: string; key: string } | null>(null);
  if (idempotencyKeyRef.current?.signature !== cartSignature) {
    idempotencyKeyRef.current = { signature: cartSignature, key: newIdempotencyKey() };
  }

  const submitMutation = useMutation({
    mutationFn: () => {
      const addressId = typeof addressChoice === 'number' ? addressChoice : undefined;
      const trimmed = newAddress.trim();
      return submitOrder(
        {
          deliveryDate: date.format('YYYY-MM-DD'),
          mealPeriod,
          addressId,
          deliveryAddress: addressId === undefined ? trimmed : undefined,
          items: state.lines.map((line) => ({
            dishId: line.dishId,
            quantity: line.quantity,
            optionItemIds: line.options.map((o) => o.itemId),
          })),
        },
        idempotencyKeyRef.current!.key,
      );
    },
    onSuccess: (order) => {
      setPlacedOrder(order);
      setStockError(null);
      setDuplicateOrder(false);
      dispatch({ type: 'CLEAR' });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        // OUT_OF_STOCK names the unavailable dish in its English message.
        if (error.code === 'OUT_OF_STOCK') {
          setStockError(error.message);
          return;
        }
        if (error.code === 'ACTIVE_ORDER_EXISTS') {
          setDuplicateOrder(true);
          return;
        }
      }
      message.error(describeError(error));
    },
  });

  if (placedOrder) {
    return (
      <div className="webox-page" style={{ maxWidth: 640, margin: '0 auto' }}>
        <Result
          status="success"
          title={copy.checkout.successTitle}
          subTitle={
            <Space direction="vertical" size={8} style={{ marginTop: 8 }}>
              <Typography.Text>
                {copy.checkout.successOrderNumber}:{' '}
                <Typography.Text strong>{placedOrder.orderNumber}</Typography.Text>
              </Typography.Text>
              <Typography.Text>
                {copy.checkout.successDelivery}: {placedOrder.deliveryDate} ·{' '}
                {copy.mealPeriod[placedOrder.mealPeriod]} · {placedOrder.addressSnapshot}
              </Typography.Text>
              <PriceText cents={placedOrder.totalCents} strong style={{ fontSize: 18 }} />
            </Space>
          }
          extra={[
            <Button type="primary" key="orders" href="/orders">
              {copy.checkout.viewOrders}
            </Button>,
            <Button key="menu" href="/menu">
              {copy.checkout.backToMenu}
            </Button>,
          ]}
        />
      </div>
    );
  }

  if (state.lines.length === 0) {
    return (
      <div className="webox-page">
        <EmptyView description={copy.checkout.emptyNotice} />
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" href="/menu">
            {copy.checkout.backToMenu}
          </Button>
        </div>
      </div>
    );
  }

  const today = todayInBusinessZone();
  const maxDate = addDays(today, 6);
  const dateString = date.format('YYYY-MM-DD');
  const slotOpen = isSlotOpen(dateString, mealPeriod);
  const trimmedAddress = newAddress.trim();
  const addressValid =
    typeof addressChoice === 'number' ||
    (addressChoice === 'new' && trimmedAddress.length > 0 && trimmedAddress.length <= MAX_ADDRESS_LENGTH);
  const canSubmit = slotOpen && addressValid && !submitMutation.isPending;
  const budgetExceeded = preferences.budgetCents !== null && total > preferences.budgetCents;

  return (
    <div className="webox-page" style={{ maxWidth: 960, margin: '0 auto' }}>
      <Typography.Title level={3}>{copy.checkout.title}</Typography.Title>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {duplicateOrder ? (
          <Alert
            type="warning"
            showIcon
            message={copy.checkout.duplicateTitle}
            description={
              <>
                {copy.checkout.duplicateBody} <Link to="/orders">{copy.checkout.viewOrders}</Link>
              </>
            }
          />
        ) : null}
        {stockError ? (
          <Alert type="error" showIcon message={copy.checkout.stockTitle} description={stockError} />
        ) : null}

        <Card title={copy.checkout.deliveryDate}>
          <Space direction="vertical" size={12}>
            <DatePicker
              value={date}
              allowClear={false}
              disabledDate={(d) => {
                const s = d.format('YYYY-MM-DD');
                return s < today || s > maxDate;
              }}
              onChange={(d) => d && setDate(d)}
              aria-label={copy.checkout.deliveryDate}
            />
            <Radio.Group
              value={mealPeriod}
              onChange={(e) => setMealPeriod(e.target.value as MealPeriod)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button
                value="LUNCH"
                disabled={!isSlotOpen(dateString, 'LUNCH')}
                aria-label={copy.mealPeriod.LUNCH}
              >
                {copy.mealPeriod.LUNCH}
              </Radio.Button>
              <Radio.Button
                value="DINNER"
                disabled={!isSlotOpen(dateString, 'DINNER')}
                aria-label={copy.mealPeriod.DINNER}
              >
                {copy.mealPeriod.DINNER}
              </Radio.Button>
            </Radio.Group>
            {!slotOpen ? <Alert type="warning" showIcon message={copy.checkout.cutoffPassed} /> : null}
          </Space>
        </Card>

        <Card title={copy.checkout.address}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Radio.Group
              value={addressChoice}
              onChange={(e) => setAddressChoice(e.target.value as number | 'new')}
            >
              <Space direction="vertical">
                {(addressesQuery.data ?? []).map((address) => (
                  <Radio key={address.id} value={address.id}>
                    {address.label ? <Typography.Text strong>{address.label}: </Typography.Text> : null}
                    {address.address}
                    {address.isDefault ? (
                      <Tag color="blue" style={{ marginInlineStart: 8 }}>
                        {copy.checkout.defaultBadge}
                      </Tag>
                    ) : null}
                  </Radio>
                ))}
                <Radio value="new">{copy.checkout.newAddress}</Radio>
              </Space>
            </Radio.Group>
            {addressChoice === 'new' ? (
              <Input.TextArea
                rows={2}
                maxLength={MAX_ADDRESS_LENGTH}
                showCount
                placeholder={copy.checkout.newAddressPlaceholder}
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                aria-label={copy.checkout.address}
              />
            ) : null}
            {!addressValid ? (
              <Typography.Text type="danger">{copy.checkout.addressRequired}</Typography.Text>
            ) : null}
          </Space>
        </Card>

        <Card title={copy.checkout.orderSummary}>
          <List
            dataSource={state.lines}
            renderItem={(line) => (
              <List.Item>
                <List.Item.Meta
                  title={`${line.dishName} × ${line.quantity}`}
                  description={
                    line.options.length > 0
                      ? line.options.map((o) => o.name).join(', ')
                      : undefined
                  }
                />
                <Space size={16}>
                  <Typography.Text type="secondary">
                    <PriceText cents={lineUnitPriceCents(line)} />
                  </Typography.Text>
                  <PriceText cents={lineSubtotalCents(line)} strong />
                </Space>
              </List.Item>
            )}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Typography.Text strong>{copy.common.total}</Typography.Text>
            <PriceText cents={total} strong style={{ fontSize: 20 }} />
          </div>
          {budgetExceeded ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
              message={copy.checkout.budgetNotice.replace(
                '{budget}',
                formatCents(preferences.budgetCents!),
              )}
            />
          ) : null}
        </Card>

        <Button
          type="primary"
          size="large"
          block
          disabled={!canSubmit}
          loading={submitMutation.isPending}
          onClick={() => {
            setStockError(null);
            setDuplicateOrder(false);
            submitMutation.mutate();
          }}
        >
          {submitMutation.isPending ? copy.checkout.placing : copy.checkout.placeOrder}
        </Button>
      </Space>
    </div>
  );
}
