import { Button, Empty, Result, Spin } from 'antd';
import { copy } from '../copy/en';
import { describeError } from '../api/http';

export function LoadingView({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }} aria-live="polite">
      <Spin size="large" tip={label ?? copy.common.loading}>
        <div style={{ width: 200, height: 60 }} />
      </Spin>
    </div>
  );
}

export function EmptyView({ description }: { description: string }) {
  return <Empty description={description} style={{ padding: '48px 0' }} />;
}

interface ErrorViewProps {
  error: unknown;
  onRetry?: () => void;
}

/**
 * Actionable error state: explains what happened in English and offers a
 * retry. Used whenever the backend is unreachable or rejects a request.
 */
export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <Result
      status="warning"
      title={copy.errors.loadFailedTitle}
      subTitle={describeError(error)}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            {copy.common.retry}
          </Button>
        ) : undefined
      }
    />
  );
}
