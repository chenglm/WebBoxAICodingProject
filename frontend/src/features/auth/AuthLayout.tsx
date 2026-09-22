import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import { copy } from '../../shared/copy/en';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="webox-auth-layout">
      <Card className="webox-auth-card">
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          {copy.app.name}
        </Typography.Title>
        <Typography.Paragraph type="secondary">{copy.app.tagline}</Typography.Paragraph>
        <Typography.Title level={4}>{title}</Typography.Title>
        {children}
      </Card>
    </div>
  );
}
