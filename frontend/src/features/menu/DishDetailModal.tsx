import { useEffect, useMemo, useState } from 'react';
import { App, Button, Checkbox, InputNumber, Modal, Radio, Space, Tag, Typography } from 'antd';
import { copy } from '../../shared/copy/en';
import type { Dish, OptionGroup, Preferences } from '../../shared/api/types';
import { DishImage } from '../../shared/ui/DishImage';
import { PriceText } from '../../shared/ui/PriceText';
import { sumCents } from '../../shared/lib/money';
import { useCart } from '../cart/CartContext';
import { allergenHits } from './recommendation';

interface DishDetailModalProps {
  dish: Dish | null;
  preferences: Preferences | null;
  onClose: () => void;
}

/**
 * Dish detail with customization groups, live pricing, allergen confirmation,
 * and add-to-cart. Required groups must be satisfied before adding.
 */
export function DishDetailModal({ dish, preferences, onClose }: DishDetailModalProps) {
  const { dispatch, openCart } = useCart();
  const { message, modal } = App.useApp();
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelections({});
    setQuantity(1);
  }, [dish?.id]);

  const selectedOptions = useMemo(() => {
    if (!dish) return [];
    return dish.optionGroups.flatMap((group) =>
      group.items
        .filter((item) => (selections[group.id] ?? []).includes(item.id))
        .map((item) => ({ ...item, groupId: group.id })),
    );
  }, [dish, selections]);

  const unitPriceCents = useMemo(() => {
    if (!dish) return 0;
    return dish.priceCents + sumCents(selectedOptions.map((o) => o.extraPriceCents));
  }, [dish, selectedOptions]);

  if (!dish) return null;

  const missingRequired = dish.optionGroups.filter(
    (group) => group.required && (selections[group.id] ?? []).length < Math.max(1, group.minSelections),
  );

  const updateSelection = (group: OptionGroup, itemIds: number[]) => {
    setSelections((current) => {
      let next = itemIds;
      if (group.maxSelections > 0 && next.length > group.maxSelections) {
        next = next.slice(next.length - group.maxSelections);
      }
      return { ...current, [group.id]: next };
    });
  };

  const doAdd = () => {
    const rejected = dispatch({
      type: 'ADD',
      line: {
        dishId: dish.id,
        dishName: dish.name,
        imageUrl: dish.imageUrl,
        basePriceCents: dish.priceCents,
        options: selectedOptions.map((o) => ({
          groupId: o.groupId,
          itemId: o.id,
          name: o.name,
          extraPriceCents: o.extraPriceCents,
        })),
      },
      quantity,
    });
    if (rejected > 0) {
      message.warning(copy.cart.portionLimitReached);
    }
    message.success(copy.menu.addedToCart);
    onClose();
    openCart();
  };

  const handleAdd = () => {
    if (missingRequired.length > 0) {
      message.warning(copy.menu.selectRequired);
      return;
    }
    const hits = preferences ? allergenHits(dish, preferences) : [];
    if (hits.length > 0) {
      modal.confirm({
        title: copy.allergenConfirm.title,
        content: (
          <Space direction="vertical" size={4}>
            <Typography.Text>{copy.allergenConfirm.body}</Typography.Text>
            <Space size={4} wrap>
              {hits.map((a) => (
                <Tag key={a} color="red">
                  {a}
                </Tag>
              ))}
            </Space>
          </Space>
        ),
        okText: copy.allergenConfirm.confirm,
        cancelText: copy.allergenConfirm.cancel,
        onOk: doAdd,
      });
      return;
    }
    doAdd();
  };

  return (
    <Modal
      open={dish !== null}
      onCancel={onClose}
      footer={null}
      width={560}
      title={dish.name}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <DishImage imageUrl={dish.imageUrl} alt={dish.name} large />
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {dish.description}
        </Typography.Paragraph>
        <Space size={8} wrap>
          <Tag>{`${copy.menu.spiceLevel}: ${copy.spice[dish.spiceLevel]}`}</Tag>
          {dish.protein ? <Tag>{`${copy.menu.protein}: ${dish.protein}`}</Tag> : null}
          {dish.allergens.length > 0 ? (
            <Tag color="orange">{`${copy.menu.allergens}: ${dish.allergens.join(', ')}`}</Tag>
          ) : null}
        </Space>

        {dish.optionGroups.length > 0 ? (
          <Typography.Title level={5} style={{ marginBottom: 0 }}>
            {copy.menu.customize}
          </Typography.Title>
        ) : null}
        {dish.optionGroups.map((group) => (
          <div key={group.id}>
            <Space size={8}>
              <Typography.Text strong>{group.name}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {group.required
                  ? group.maxSelections > 1
                    ? `${copy.menu.optionGroupRequired} · ${copy.menu.optionGroupPickUpTo} ${group.maxSelections}`
                    : `${copy.menu.optionGroupRequired} · ${copy.menu.optionGroupPickOne}`
                  : group.maxSelections > 1
                    ? `${copy.common.optional} · ${copy.menu.optionGroupPickUpTo} ${group.maxSelections}`
                    : copy.common.optional}
              </Typography.Text>
            </Space>
            <div style={{ marginTop: 8 }}>
              {group.maxSelections <= 1 ? (
                <Radio.Group
                  value={(selections[group.id] ?? [])[0]}
                  onChange={(e) => updateSelection(group, e.target.value === undefined ? [] : [e.target.value])}
                >
                  <Space direction="vertical">
                    {group.items.map((item) => (
                      <Radio key={item.id} value={item.id}>
                        {item.name}
                        {item.extraPriceCents > 0 ? (
                          <Typography.Text type="secondary"> (+<PriceText cents={item.extraPriceCents} />)</Typography.Text>
                        ) : null}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              ) : (
                <Checkbox.Group
                  value={selections[group.id] ?? []}
                  onChange={(values) => updateSelection(group, values as number[])}
                >
                  <Space direction="vertical">
                    {group.items.map((item) => (
                      <Checkbox key={item.id} value={item.id}>
                        {item.name}
                        {item.extraPriceCents > 0 ? (
                          <Typography.Text type="secondary"> (+<PriceText cents={item.extraPriceCents} />)</Typography.Text>
                        ) : null}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space size={12}>
            <Typography.Text>{copy.common.quantity}</Typography.Text>
            <InputNumber min={1} max={5} value={quantity} onChange={(v) => setQuantity(v ?? 1)} />
          </Space>
          <PriceText cents={unitPriceCents * quantity} strong style={{ fontSize: 20 }} />
        </div>
        <Button
          type="primary"
          block
          size="large"
          disabled={missingRequired.length > 0}
          onClick={handleAdd}
        >
          {copy.menu.addToCart}
        </Button>
      </Space>
    </Modal>
  );
}
