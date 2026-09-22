import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Input, Popconfirm, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { copy } from '../../shared/copy/en';
import { describeError } from '../../shared/api/http';
import type { Dish } from '../../shared/api/types';
import { MAX_SEARCH_LENGTH } from '../../shared/lib/constants';
import { DishImage } from '../../shared/ui/DishImage';
import { PriceText } from '../../shared/ui/PriceText';
import { ErrorView } from '../../shared/ui/StateViews';
import { fetchAdminDishes, setDishVisible } from './api';
import { DishEditDrawer } from './DishEditDrawer';

const PAGE_SIZE = 10;

export function ConsoleDishesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [creating, setCreating] = useState(false);

  const dishesQuery = useQuery({
    queryKey: ['admin', 'dishes', submittedKeyword, category],
    queryFn: () => fetchAdminDishes({ keyword: submittedKeyword, category }),
  });

  // Category options derive from the full dish list (no dictionary endpoint).
  const allCategoriesQuery = useQuery({
    queryKey: ['admin', 'dishes', '', null],
    queryFn: () => fetchAdminDishes({ keyword: '', category: null }),
  });
  const categoryOptions = useMemo(
    () => [...new Set((allCategoriesQuery.data ?? []).map((d) => d.category).filter(Boolean))].sort(),
    [allCategoriesQuery.data],
  );

  const statusMutation = useMutation({
    mutationFn: ({ dishId, visible }: { dishId: number; visible: boolean }) =>
      setDishVisible(dishId, visible),
    onSuccess: () => {
      message.success(copy.console.statusUpdated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'dishes'] });
    },
    onError: (error) => message.error(describeError(error)),
  });

  const pagedDishes = useMemo(() => {
    const all = dishesQuery.data ?? [];
    const start = (page - 1) * PAGE_SIZE;
    return all.slice(start, start + PAGE_SIZE);
  }, [dishesQuery.data, page]);

  const columns = [
    {
      title: '',
      key: 'image',
      width: 72,
      render: (_: unknown, dish: Dish) => (
        <div style={{ width: 56, overflow: 'hidden', borderRadius: 6 }}>
          <DishImage imageUrl={dish.imageUrl} alt={dish.name} />
        </div>
      ),
    },
    {
      title: copy.common.name,
      dataIndex: 'name',
      key: 'name',
      render: (_: unknown, dish: Dish) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{dish.name}</Typography.Text>
          {dish.category ? <Tag>{dish.category}</Tag> : null}
        </Space>
      ),
    },
    {
      title: copy.common.price,
      dataIndex: 'priceCents',
      key: 'priceCents',
      width: 120,
      render: (cents: number) => <PriceText cents={cents} />,
    },
    {
      title: copy.console.spiceLabel,
      dataIndex: 'spiceLevel',
      key: 'spiceLevel',
      width: 110,
      render: (level: Dish['spiceLevel']) => copy.spice[level],
    },
    {
      title: copy.common.status,
      key: 'visible',
      width: 130,
      render: (_: unknown, dish: Dish) => (
        <Popconfirm
          title={dish.visible ? copy.console.unlistConfirm : copy.console.listConfirm}
          okText={copy.common.confirm}
          cancelText={copy.common.cancel}
          onConfirm={() => statusMutation.mutate({ dishId: dish.id, visible: !dish.visible })}
        >
          <Switch
            checked={dish.visible}
            checkedChildren={copy.console.listed}
            unCheckedChildren={copy.console.unlisted}
            aria-label={dish.visible ? copy.console.unlistAction : copy.console.listAction}
          />
        </Popconfirm>
      ),
    },
    {
      title: copy.common.actions,
      key: 'actions',
      width: 100,
      render: (_: unknown, dish: Dish) => (
        <Button
          type="link"
          onClick={() => {
            setCreating(false);
            setEditingDish(dish);
          }}
        >
          {copy.common.edit}
        </Button>
      ),
    },
  ];

  return (
    <div className="webox-page">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {copy.console.dishesTitle}
          </Typography.Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingDish(null);
              setCreating(true);
            }}
          >
            {copy.console.newDish}
          </Button>
        </div>
        <Space wrap>
          <Input.Search
            placeholder={copy.console.searchPlaceholder}
            allowClear
            maxLength={MAX_SEARCH_LENGTH}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(value) => {
              setSubmittedKeyword(value.trim().slice(0, MAX_SEARCH_LENGTH));
              setPage(1);
            }}
            style={{ width: 280 }}
            aria-label={copy.common.search}
          />
          <Select
            allowClear
            placeholder={copy.console.categoryFilter}
            style={{ width: 200 }}
            options={categoryOptions.map((c) => ({ label: c, value: c }))}
            value={category}
            onChange={(value) => {
              setCategory(value ?? null);
              setPage(1);
            }}
            aria-label={copy.console.categoryFilter}
          />
        </Space>

        {dishesQuery.isError ? (
          <ErrorView error={dishesQuery.error} onRetry={() => dishesQuery.refetch()} />
        ) : (
          <Table<Dish>
            rowKey="id"
            loading={dishesQuery.isLoading}
            columns={columns}
            dataSource={pagedDishes}
            scroll={{ x: 720 }}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: dishesQuery.data?.length ?? 0,
              onChange: setPage,
              showSizeChanger: false,
            }}
          />
        )}
      </Space>

      <DishEditDrawer
        dish={editingDish}
        creating={creating}
        categoryOptions={categoryOptions}
        onClose={() => {
          setEditingDish(null);
          setCreating(false);
        }}
      />
    </div>
  );
}
