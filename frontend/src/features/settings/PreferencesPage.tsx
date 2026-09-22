import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Card, Checkbox, Form, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { copy } from '../../shared/copy/en';
import { describeError } from '../../shared/api/http';
import {
  ALLERGEN_OPTIONS,
  SPICE_LEVELS,
  TASTE_OPTIONS,
  type SpiceLevel,
  type TastePreference,
} from '../../shared/lib/constants';
import { centsToYuan, yuanToCents } from '../../shared/lib/money';
import { ErrorView, LoadingView } from '../../shared/ui/StateViews';
import { fetchMenuCategories } from '../menu/api';
import { usePreferences, useSavePreferences } from './hooks';
import { useRecommendedEnabled } from './recommended';

interface PreferencesFormValues {
  allergens: string[];
  preferredCategories: string[];
  spicePreference: SpiceLevel | null;
  tastePreference: TastePreference | null;
  budgetYuan: number | null;
}

export function PreferencesPage() {
  const [form] = Form.useForm<PreferencesFormValues>();
  const { message } = App.useApp();
  const preferencesQuery = usePreferences();
  const savePreferences = useSavePreferences();
  const categoriesQuery = useQuery({ queryKey: ['menu', 'categories'], queryFn: fetchMenuCategories });
  const [recommendedEnabled, setRecommendedEnabled] = useRecommendedEnabled();

  useEffect(() => {
    if (preferencesQuery.data) {
      const p = preferencesQuery.data;
      form.setFieldsValue({
        allergens: p.allergens,
        preferredCategories: p.preferredCategories,
        spicePreference: p.spicePreference,
        tastePreference: p.tastePreference,
        budgetYuan: p.budgetCents !== null ? centsToYuan(p.budgetCents) : null,
      });
    }
  }, [preferencesQuery.data, form]);

  if (preferencesQuery.isLoading) {
    return (
      <div className="webox-page">
        <LoadingView />
      </div>
    );
  }

  if (preferencesQuery.isError) {
    return (
      <div className="webox-page">
        <ErrorView error={preferencesQuery.error} onRetry={() => preferencesQuery.refetch()} />
      </div>
    );
  }

  const handleSubmit = (values: PreferencesFormValues) => {
    savePreferences.mutate(
      {
        allergens: values.allergens ?? [],
        preferredCategories: values.preferredCategories ?? [],
        spicePreference: values.spicePreference ?? null,
        tastePreference: values.tastePreference ?? null,
        budgetCents:
          values.budgetYuan !== null && values.budgetYuan !== undefined
            ? yuanToCents(values.budgetYuan)
            : null,
      },
      {
        onSuccess: () => message.success(copy.settings.saveSuccess),
        onError: (error) => message.error(describeError(error)),
      },
    );
  };

  return (
    <div className="webox-page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <Typography.Title level={3}>{copy.settings.title}</Typography.Title>
      <Card title={copy.settings.dietaryTitle}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="allergens" label={copy.settings.allergens}>
            <Checkbox.Group
              options={ALLERGEN_OPTIONS.map((a) => ({ label: a, value: a }))}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            />
          </Form.Item>
          <Form.Item name="preferredCategories" label={copy.settings.categories}>
            <Select
              mode="multiple"
              allowClear
              options={(categoriesQuery.data ?? []).map((c) => ({ label: c, value: c }))}
              loading={categoriesQuery.isLoading}
            />
          </Form.Item>
          <Form.Item name="spicePreference" label={copy.settings.spice}>
            <Select
              allowClear
              options={SPICE_LEVELS.map((s) => ({ label: copy.spice[s], value: s }))}
            />
          </Form.Item>
          <Form.Item name="tastePreference" label={copy.settings.taste}>
            <Select
              allowClear
              options={TASTE_OPTIONS.map((t) => ({ label: copy.settings.tasteOptions[t], value: t }))}
            />
          </Form.Item>
          <Form.Item
            name="budgetYuan"
            label={copy.settings.budget}
            rules={[
              {
                validator: (_, value: number | null) =>
                  value === null || value === undefined || value > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error(copy.settings.budgetInvalid)),
              },
            ]}
          >
            <InputNumber min={0} precision={2} placeholder={copy.settings.budgetPlaceholder} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item label={copy.settings.recommended} extra={copy.settings.recommendedHint}>
            <Switch
              checked={recommendedEnabled}
              onChange={setRecommendedEnabled}
              aria-label={copy.settings.recommended}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={savePreferences.isPending}>
                {copy.common.save}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
