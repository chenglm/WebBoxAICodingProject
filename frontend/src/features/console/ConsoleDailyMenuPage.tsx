import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, DatePicker, InputNumber, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { copy } from '../../shared/copy/en';
import { describeError } from '../../shared/api/http';
import { addDays, todayInBusinessZone } from '../../shared/lib/mealSlot';
import { ErrorView } from '../../shared/ui/StateViews';
import { fetchAdminDishes, fetchDailyMenu, saveDailyMenu } from './api';

interface EditableEntry {
  dishId: number;
  dishName: string;
  visible: boolean;
  availableQuantity: number;
}

export function ConsoleDailyMenuPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const defaultDate = addDays(todayInBusinessZone(), 1);
  const [date, setDate] = useState<Dayjs>(dayjs(defaultDate));
  const dateString = date.format('YYYY-MM-DD');

  // Scheduled entries for the date (visible dishes; see api.ts note).
  const menuQuery = useQuery({
    queryKey: ['admin', 'daily-menu', dateString],
    queryFn: () => fetchDailyMenu(dateString),
  });

  // All visible dishes are candidates for scheduling.
  const dishesQuery = useQuery({
    queryKey: ['admin', 'dishes', '', null],
    queryFn: () => fetchAdminDishes({ keyword: '', category: null }),
  });

  const [entries, setEntries] = useState<EditableEntry[]>([]);
  const [dishToAdd, setDishToAdd] = useState<number | null>(null);

  useEffect(() => {
    if (menuQuery.data) {
      setEntries(
        menuQuery.data.items.map((d) => ({
          dishId: d.id,
          dishName: d.name,
          visible: d.visible,
          availableQuantity: d.availableQuantity ?? 0,
        })),
      );
    }
  }, [menuQuery.data]);

  const addableDishes = useMemo(() => {
    const scheduled = new Set(entries.map((e) => e.dishId));
    return (dishesQuery.data ?? []).filter((d) => d.visible && !scheduled.has(d.id));
  }, [dishesQuery.data, entries]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveDailyMenu(
        dateString,
        entries.map((e) => ({ dishId: e.dishId, availableQuantity: e.availableQuantity })),
      ),
    onSuccess: () => {
      message.success(copy.console.menuSaved);
      queryClient.invalidateQueries({ queryKey: ['admin', 'daily-menu'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
    onError: (error) => message.error(describeError(error)),
  });

  const columns = [
    {
      title: copy.common.name,
      dataIndex: 'dishName',
      key: 'dishName',
      render: (_: unknown, entry: EditableEntry) => (
        <Space size={8}>
          <Typography.Text strong>{entry.dishName}</Typography.Text>
          {!entry.visible ? <Tag>{copy.console.unlisted}</Tag> : null}
        </Space>
      ),
    },
    {
      title: copy.console.availableQuantity,
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 200,
      render: (_: unknown, entry: EditableEntry) => (
        <InputNumber
          min={0}
          precision={0}
          value={entry.availableQuantity}
          onChange={(value) =>
            setEntries((current) =>
              current.map((e) =>
                e.dishId === entry.dishId ? { ...e, availableQuantity: Math.max(0, value ?? 0) } : e,
              ),
            )
          }
          aria-label={`${copy.console.availableQuantity} - ${entry.dishName}`}
        />
      ),
    },
    {
      title: copy.common.actions,
      key: 'actions',
      width: 140,
      render: (_: unknown, entry: EditableEntry) => (
        <Button
          type="link"
          danger
          onClick={() => setEntries((current) => current.filter((e) => e.dishId !== entry.dishId))}
        >
          {copy.console.removeFromMenu}
        </Button>
      ),
    },
  ];

  return (
    <div className="webox-page">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {copy.console.dailyMenuTitle}
        </Typography.Title>
        <Typography.Text type="secondary">{copy.console.dailyMenuHint}</Typography.Text>
        <Space wrap>
          <DatePicker
            value={date}
            allowClear={false}
            onChange={(d) => d && setDate(d)}
            aria-label={copy.console.pickDate}
          />
          <Select
            showSearch
            placeholder={copy.console.addDish}
            style={{ minWidth: 240 }}
            value={dishToAdd}
            options={addableDishes.map((d) => ({ label: d.name, value: d.id }))}
            onChange={(value) => setDishToAdd(value)}
            loading={dishesQuery.isLoading}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            aria-label={copy.console.addDish}
          />
          <Button
            type="primary"
            disabled={dishToAdd === null}
            onClick={() => {
              const dish = addableDishes.find((d) => d.id === dishToAdd);
              if (!dish) return;
              setEntries((current) => [
                ...current,
                {
                  dishId: dish.id,
                  dishName: dish.name,
                  visible: dish.visible,
                  availableQuantity: 0,
                },
              ]);
              setDishToAdd(null);
            }}
          >
            {copy.common.add}
          </Button>
        </Space>

        {menuQuery.isError ? (
          <ErrorView error={menuQuery.error} onRetry={() => menuQuery.refetch()} />
        ) : (
          <Table<EditableEntry>
            rowKey="dishId"
            loading={menuQuery.isLoading}
            columns={columns}
            dataSource={entries}
            pagination={false}
            locale={{ emptyText: copy.empty.dailyMenu }}
            scroll={{ x: 560 }}
          />
        )}

        <div>
          <Button type="primary" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {copy.common.save}
          </Button>
        </div>
      </Space>
    </div>
  );
}
