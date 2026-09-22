import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  App,
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
  Upload,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { copy } from '../../shared/copy/en';
import { describeError } from '../../shared/api/http';
import type { Dish, DishInput } from '../../shared/api/types';
import {
  ALLERGEN_OPTIONS,
  PROTEIN_OPTIONS,
  SPICE_LEVELS,
  type SpiceLevel,
} from '../../shared/lib/constants';
import { centsToYuan, yuanToCents } from '../../shared/lib/money';
import { createDish, updateDish, uploadDishImage } from './api';

interface OptionItemFormValue {
  name: string;
  extraPriceYuan: number | null;
}

interface OptionGroupFormValue {
  name: string;
  required: boolean;
  maxSelections: number;
  items: OptionItemFormValue[];
}

interface DishFormValues {
  name: string;
  description: string;
  priceYuan: number;
  category: string;
  protein: string | null;
  spiceLevel: SpiceLevel;
  allergens: string[];
  visible: boolean;
  optionGroups: OptionGroupFormValue[];
}

interface DishEditDrawerProps {
  dish: Dish | null;
  /** True when creating a new dish. */
  creating: boolean;
  categoryOptions: string[];
  onClose: () => void;
}

export function DishEditDrawer({ dish, creating, categoryOptions, onClose }: DishEditDrawerProps) {
  const [form] = Form.useForm<DishFormValues>();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const open = creating || dish !== null;

  useEffect(() => {
    if (!open) return;
    if (dish) {
      form.setFieldsValue({
        name: dish.name,
        description: dish.description,
        priceYuan: centsToYuan(dish.priceCents),
        category: dish.category,
        protein: dish.protein,
        spiceLevel: dish.spiceLevel,
        allergens: dish.allergens,
        visible: dish.visible,
        optionGroups: dish.optionGroups.map((g) => ({
          name: g.name,
          required: g.required,
          maxSelections: g.maxSelections,
          items: g.items.map((i) => ({ name: i.name, extraPriceYuan: centsToYuan(i.extraPriceCents) })),
        })),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        spiceLevel: 'NONE',
        visible: true,
        allergens: [],
        optionGroups: [],
      });
    }
  }, [open, dish, form]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'dishes'] });

  const saveMutation = useMutation({
    mutationFn: (body: DishInput) => (dish ? updateDish(dish.id, body) : createDish(body)),
    onSuccess: () => {
      message.success(copy.console.dishSaved);
      invalidate();
      onClose();
    },
    onError: (error) => {
      message.error(describeError(error) || copy.console.dishSaveFailed);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ dishId, file }: { dishId: number; file: File }) => uploadDishImage(dishId, file),
    onSuccess: () => {
      message.success(copy.console.imageUploadSuccess);
      invalidate();
    },
    onError: () => message.error(copy.console.imageUploadFailed),
  });

  const handleSubmit = (values: DishFormValues) => {
    saveMutation.mutate({
      name: values.name.trim(),
      description: values.description ?? '',
      category: (values.category ?? '').trim(),
      protein: values.protein ?? null,
      spiceLevel: values.spiceLevel,
      priceCents: yuanToCents(values.priceYuan),
      imageUrl: dish?.imageUrl ?? null,
      visible: values.visible ?? true,
      allergens: values.allergens ?? [],
      optionGroups: (values.optionGroups ?? []).map((g) => ({
        name: g.name.trim(),
        required: g.required ?? false,
        minSelections: g.required ? 1 : 0,
        maxSelections: g.maxSelections ?? 1,
        items: (g.items ?? [])
          .filter((i) => i.name && i.name.trim().length > 0)
          .map((i) => ({
            name: i.name.trim(),
            extraPriceCents: yuanToCents(i.extraPriceYuan ?? 0),
          })),
      })),
    });
  };

  return (
    <Drawer
      title={creating ? copy.console.newDish : copy.console.editDish}
      open={open}
      onClose={onClose}
      width={560}
      footer={
        <Button type="primary" block loading={saveMutation.isPending} onClick={() => form.submit()}>
          {copy.common.save}
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label={copy.common.name}
          rules={[{ required: true, message: copy.console.nameRequired }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="description" label={copy.common.description}>
          <Input.TextArea rows={2} maxLength={500} />
        </Form.Item>
        <Form.Item
          name="priceYuan"
          label={copy.console.priceYuan}
          rules={[
            { required: true, message: copy.console.priceRequired },
            {
              validator: (_, value: number) =>
                value > 0 ? Promise.resolve() : Promise.reject(new Error(copy.console.priceInvalid)),
            },
          ]}
        >
          <InputNumber min={0} precision={2} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="category" label={copy.console.categoriesLabel}>
          <AutoComplete
            options={categoryOptions.map((c) => ({ label: c, value: c }))}
            placeholder={copy.console.categoriesLabel}
            allowClear
          />
        </Form.Item>
        <Form.Item name="protein" label={copy.console.proteinLabel}>
          <Select
            allowClear
            options={PROTEIN_OPTIONS.map((p) => ({ label: p, value: p }))}
          />
        </Form.Item>
        <Form.Item name="spiceLevel" label={copy.console.spiceLabel}>
          <Select options={SPICE_LEVELS.map((s) => ({ label: copy.spice[s], value: s }))} />
        </Form.Item>
        <Form.Item name="allergens" label={copy.console.allergensLabel}>
          <Checkbox.Group
            options={ALLERGEN_OPTIONS.map((a) => ({ label: a, value: a }))}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          />
        </Form.Item>
        <Form.Item name="visible" label={copy.console.listed} valuePropName="checked">
          <Switch aria-label={copy.console.listed} />
        </Form.Item>

        <Form.Item label={copy.console.imageUpload}>
          {dish ? (
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={({ file, onSuccess, onError }) => {
                uploadMutation.mutate(
                  { dishId: dish.id, file: file as File },
                  {
                    onSuccess: () => onSuccess?.({}),
                    onError: () => onError?.(new Error('upload failed')),
                  },
                );
              }}
            >
              <Button icon={<UploadOutlined />} loading={uploadMutation.isPending}>
                {copy.console.imageUpload}
              </Button>
            </Upload>
          ) : (
            <Typography.Text type="secondary">{copy.console.imageUploadHint}</Typography.Text>
          )}
        </Form.Item>

        <Typography.Title level={5}>{copy.console.optionGroupsLabel}</Typography.Title>
        <Form.List name="optionGroups">
          {(groupFields, { add: addGroup, remove: removeGroup }) => (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {groupFields.map((groupField) => (
                <Card
                  key={groupField.key}
                  size="small"
                  title={
                    <Form.Item
                      name={[groupField.name, 'name']}
                      rules={[{ required: true, message: copy.console.groupNamePlaceholder }]}
                      style={{ margin: 0 }}
                    >
                      <Input placeholder={copy.console.groupNamePlaceholder} />
                    </Form.Item>
                  }
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      aria-label={copy.common.remove}
                      onClick={() => removeGroup(groupField.name)}
                    />
                  }
                >
                  <Space size={16} wrap>
                    <Form.Item
                      name={[groupField.name, 'required']}
                      valuePropName="checked"
                      label={copy.console.groupRequired}
                      style={{ marginBottom: 8 }}
                    >
                      <Switch aria-label={copy.console.groupRequired} />
                    </Form.Item>
                    <Form.Item
                      name={[groupField.name, 'maxSelections']}
                      label={copy.console.pickMany}
                      style={{ marginBottom: 8 }}
                      initialValue={1}
                    >
                      <InputNumber min={1} max={10} />
                    </Form.Item>
                  </Space>
                  <Form.List name={[groupField.name, 'items']}>
                    {(itemFields, { add: addItem, remove: removeItem }) => (
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {itemFields.map((itemField) => (
                          <Space key={itemField.key} align="baseline" wrap>
                            <Form.Item
                              name={[itemField.name, 'name']}
                              rules={[{ required: true, message: copy.console.itemNamePlaceholder }]}
                              style={{ margin: 0 }}
                            >
                              <Input placeholder={copy.console.itemNamePlaceholder} style={{ width: 200 }} />
                            </Form.Item>
                            <Form.Item
                              name={[itemField.name, 'extraPriceYuan']}
                              initialValue={0}
                              style={{ margin: 0 }}
                            >
                              <InputNumber
                                min={0}
                                precision={2}
                                placeholder={copy.console.itemExtraPricePlaceholder}
                                style={{ width: 160 }}
                              />
                            </Form.Item>
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              aria-label={copy.common.remove}
                              onClick={() => removeItem(itemField.name)}
                            />
                          </Space>
                        ))}
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => addItem({ name: '', extraPriceYuan: 0 })}>
                          {copy.console.addOptionItem}
                        </Button>
                      </Space>
                    )}
                  </Form.List>
                </Card>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => addGroup({ name: '', required: false, maxSelections: 1, items: [] })}
              >
                {copy.console.addOptionGroup}
              </Button>
            </Space>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
}
