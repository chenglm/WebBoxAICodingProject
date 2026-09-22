import { Card, Space, Tag, Typography } from 'antd';
import { copy } from '../../shared/copy/en';
import type { Dish, Preferences } from '../../shared/api/types';
import { DishImage } from '../../shared/ui/DishImage';
import { PriceText } from '../../shared/ui/PriceText';
import { allergenHits, isRecommended } from './recommendation';

interface DishCardProps {
  dish: Dish;
  preferences: Preferences | null;
  showRecommended: boolean;
  onSelect: (dish: Dish) => void;
}

export function DishCard({ dish, preferences, showRecommended, onSelect }: DishCardProps) {
  const soldOut = dish.availableQuantity !== undefined && dish.availableQuantity <= 0;
  const hits = preferences ? allergenHits(dish, preferences) : [];
  const recommended = showRecommended && preferences ? isRecommended(dish, preferences) : false;

  return (
    <Card
      className="webox-dish-card"
      hoverable={!soldOut}
      onClick={() => !soldOut && onSelect(dish)}
      cover={<DishImage imageUrl={dish.imageUrl} alt={dish.name} />}
      styles={{ body: { padding: 16 } }}
      aria-label={dish.name}
    >
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Typography.Text strong ellipsis={{ tooltip: dish.name }} style={{ flex: 1 }}>
            {dish.name}
          </Typography.Text>
          <PriceText cents={dish.priceCents} strong />
        </div>
        <Space size={4} wrap>
          {dish.category ? <Tag>{dish.category}</Tag> : null}
          {dish.spiceLevel !== 'None' ? <Tag color="volcano">{copy.spice[dish.spiceLevel]}</Tag> : null}
          {dish.protein ? <Tag>{dish.protein}</Tag> : null}
          {recommended ? <Tag color="green">{copy.menu.recommendedTag}</Tag> : null}
          {hits.length > 0 ? <Tag color="red">{copy.menu.allergenTag}</Tag> : null}
        </Space>
        <Typography.Text type={soldOut ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
          {soldOut
            ? copy.menu.soldOut
            : dish.availableQuantity !== undefined
              ? `${dish.availableQuantity} ${copy.menu.portionsLeft}`
              : ''}
        </Typography.Text>
      </Space>
    </Card>
  );
}
