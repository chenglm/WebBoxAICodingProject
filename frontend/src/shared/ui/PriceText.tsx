import { Typography } from 'antd';
import { formatCents } from '../lib/money';

interface PriceTextProps {
  cents: number;
  strong?: boolean;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  style?: React.CSSProperties;
}

/** Renders integer cents as ¥xx.xx. The only sanctioned way to show money. */
export function PriceText({ cents, strong, type, style }: PriceTextProps) {
  return (
    <Typography.Text className="webox-price" strong={strong} type={type} style={style}>
      {formatCents(cents)}
    </Typography.Text>
  );
}
