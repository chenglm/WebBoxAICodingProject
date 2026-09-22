import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { App, Col, Input, Pagination, Row, Select, Space, Switch, Typography } from 'antd';
import { copy } from '../../shared/copy/en';
import type { Dish } from '../../shared/api/types';
import { describeError } from '../../shared/api/http';
import { MAX_SEARCH_LENGTH } from '../../shared/lib/constants';
import { EmptyView, ErrorView, LoadingView } from '../../shared/ui/StateViews';
import { fetchMenu, fetchMenuCategories } from './api';
import { DishCard } from './DishCard';
import { DishDetailModal } from './DishDetailModal';
import { sortByRecommendation } from './recommendation';
import { DEFAULT_PREFERENCES, usePreferences, useSavePreferences } from '../settings/hooks';

const PAGE_SIZE = 12;

export function MenuPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  /** One-based for AntD Pagination; converted to zero-based on the wire. */
  const [page, setPage] = useState(1);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const preferencesQuery = usePreferences();
  const preferences = preferencesQuery.data ?? DEFAULT_PREFERENCES;
  const savePreferences = useSavePreferences();
  const recommendedEnabled = preferences.recommendedEnabled;

  const categoriesQuery = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: fetchMenuCategories,
  });

  const menuQuery = useQuery({
    queryKey: ['menu', submittedKeyword, categories, page],
    queryFn: () =>
      fetchMenu({
        keyword: submittedKeyword,
        categories,
        page: page - 1,
        size: PAGE_SIZE,
      }),
  });

  const dishes = useMemo(() => {
    const items = menuQuery.data?.items ?? [];
    return recommendedEnabled ? sortByRecommendation(items, preferences) : items;
  }, [menuQuery.data, preferences, recommendedEnabled]);

  return (
    <div className="webox-page">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography.Title level={3} style={{ margin: 0 }}>
            {copy.menu.title}
          </Typography.Title>
          <Space size={8}>
            <Typography.Text>{copy.menu.recommendedToggle}</Typography.Text>
            <Switch
              checked={recommendedEnabled}
              loading={savePreferences.isPending}
              onChange={(checked) =>
                savePreferences.mutate(
                  { ...preferences, recommendedEnabled: checked },
                  { onError: (error) => message.error(describeError(error)) },
                )
              }
              aria-label={copy.menu.recommendedToggle}
            />
          </Space>
        </div>

        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input.Search
            placeholder={copy.menu.searchPlaceholder}
            allowClear
            maxLength={MAX_SEARCH_LENGTH}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(value) => {
              setSubmittedKeyword(value.trim().slice(0, MAX_SEARCH_LENGTH));
              setPage(1);
            }}
            style={{ maxWidth: 480 }}
            aria-label={copy.common.search}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder={copy.menu.categoriesPlaceholder}
            style={{ minWidth: 240, maxWidth: '100%' }}
            options={(categoriesQuery.data ?? []).map((c) => ({ label: c, value: c }))}
            value={categories}
            onChange={(value) => {
              setCategories(value);
              setPage(1);
            }}
            loading={categoriesQuery.isLoading}
            aria-label={copy.menu.categoriesPlaceholder}
          />
        </Space>

        {menuQuery.isLoading ? (
          <LoadingView />
        ) : menuQuery.isError ? (
          <ErrorView error={menuQuery.error} onRetry={() => menuQuery.refetch()} />
        ) : dishes.length === 0 ? (
          <EmptyView description={copy.empty.menu} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {dishes.map((dish) => (
                <Col key={dish.id} xs={24} sm={12} md={8} lg={6}>
                  <DishCard
                    dish={dish}
                    preferences={preferences}
                    showRecommended={recommendedEnabled}
                    onSelect={setSelectedDish}
                  />
                </Col>
              ))}
            </Row>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={menuQuery.data?.total ?? 0}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Space>

      <DishDetailModal
        dish={selectedDish}
        preferences={preferences}
        onClose={() => setSelectedDish(null)}
      />
    </div>
  );
}
