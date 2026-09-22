# WebBoxEnterpriseEmployeeMealOrderingPlatform — 技术方案概要

## 1. 目标与范围

WeBox 是面向企业员工的餐食订购平台。本阶段交付 **Tier 1（核心）** 与 **Tier 2（进阶）**：一个可本地启动、可持久化、可演示的前后端系统。

本阶段不实现 Tier 3 的实时库存同步、LLM 推荐和经营看板；但订单、库存和数据模型会保留可扩展边界，避免后续重构核心流程。

### 1.1 本阶段验收目标

| 范围 | 关键结果 |
| --- | --- |
| Tier 1 | 注册登录、菜单浏览/检索/多分类筛选/详情、带定制项的购物车、结算下单、订单历史/详情/取消 |
| Tier 2 | 饮食偏好与过敏原提醒、推荐排序、预算提醒、下单规则、管理员 Console 菜品与每日菜单管理 |
| 基础设施 | Frontend SPA → Spring Boot（JDK 17）→ 独立 MySQL 8.4 |
| 质量基线 | 全英文用户界面；金额按分计算；鉴权与角色隔离；参数校验；幂等下单；核心服务测试 |

### 1.2 明确不在本阶段范围内

- 菜单库存的实时推送（SSE / WebSocket）；
- AI 流式推荐及 LLM API 集成；
- Console 经营数据看板。

> **本次范围内的库存能力**：每日菜单的 `availableQuantity` 是当前可售库存。下单事务会以带库存条件的原子更新扣减，库存不足时回滚订单并返回具体缺货菜品；`Pending` 订单取消成功后在同一事务中返还库存。此项用于验证并发安全、防超卖。仅不实现其他浏览者无需刷新即可看到库存变化的实时推送能力。

## 2. 需求分析

### 2.1 用户与权限

系统包含两类身份：

| 角色 | 能力 | 访问边界 |
| --- | --- | --- |
| `EMPLOYEE` | 菜单、购物车、偏好、结算、本人订单 | 只能访问和修改自己的资源 |
| `ADMIN` | Console 菜品管理、上下架、每日菜单配置 | 不可通过员工端 API 越权操作；员工不可访问 `/console` 或 `/api/admin/**` |

认证使用企业邮箱和密码。邮箱不限制特定域名，但必须格式合法且唯一；密码至少 8 位并同时包含字母和数字。密码只保存 BCrypt 哈希，登录后以 HTTP-only Cookie 持有短生命周期访问令牌（JWT）。

### 2.2 员工端关键业务规则

1. **菜单**：只展示当前日期、已上架且被配置进当日菜单的菜品；支持名称/描述关键词搜索、分类多选和分页。
2. **定制项**：必选组选项未完成时不可加入购物车；每种选择组合是独立购物车条目；加价即时体现在单价和小计中。
3. **购物车**：同一菜品、同一配置合并数量；不同配置分行；总份数上限为 5。购物车先由前端保存，结算时后端重新计算价格并校验，客户端价格不被信任。
4. **餐次与截单**：午餐截止 10:00，晚餐截止 15:00。若默认餐次已截止，自动选择最近可订餐次：当日晚餐未截止则选当日晚餐，否则选次日午餐。
5. **重复下单**：同一员工、同一配送日期、同一餐次只能存在一个有效订单（`Pending` / `Confirmed`）。若已有有效订单，前端引导查看，后端仍强制校验。
6. **幂等提交**：结算页为每次提交生成 `Idempotency-Key`；相同用户与键的重复请求返回同一订单结果，不能多建订单。
7. **库存扣减**：提交订单时服务端按菜品汇总份数，以库存条件更新原子扣减；任一菜品库存不足则整单失败并指出缺货菜品，不能超卖。
8. **取消订单**：仅 `Pending` 可取消；状态更新必须受服务端条件限制，禁止由客户端直接传入任意状态。取消成功后原子返还对应菜品库存。

### 2.3 偏好与提醒

- 过敏原是提醒而非过滤：命中员工标记的过敏原时，前端弹出英文确认框；员工确认后仍可加入。
- 「Recommended for me」开启时，按菜系、辣度匹配度排序并突出展示；关闭则采用默认排序。
- 购物车总价超过单餐预算上限时，结算页提示但不阻止下单。

### 2.4 管理员 Console

管理员可搜索和按分类筛选全部菜品，创建/编辑菜品，维护图像地址、价格、分类、蛋白质来源、过敏原、辣度和定制项，并控制上架状态。每日菜单按日期配置菜品及供应数量；默认操作日期为次日，同时允许初始化或调整当日菜单。

## 3. 技术选型

| 层级 | 选型 | 原因 |
| --- | --- | --- |
| 前端 | React + TypeScript + Vite + React Router + TanStack Query | SPA 开发效率高，类型约束清晰，适合表单、缓存与响应式页面 |
| UI | Ant Design + 少量 CSS Modules | 表格、表单校验、弹窗、抽屉、日期选择器和响应式栅格开箱即用，确保 1.5 小时内可完成高质量交互；仅用 CSS Modules 补充品牌样式与移动端细节 |
| 后端 | Java 17 + Spring Boot 3 + Spring Web / Validation / Security / Data JPA | 满足 PRD 强制栈，生态成熟，便于事务、认证授权与测试 |
| 数据库 | 独立 MySQL 8.4 | 满足持久化要求，支持唯一索引和事务约束 |
| 迁移 | Flyway | 以版本化 SQL 初始化 schema 与种子菜单，启动可重复 |
| API 描述 | OpenAPI / springdoc | 开发时可交互查看接口；交付时同时提供静态 API 文档 |
| 测试 | JUnit 5 + Mockito + Spring Boot Test | 覆盖下单、时间规则、权限与价格计算等核心逻辑 |

本地开发使用已创建的 MySQL `webox` 数据库。连接账户和密码由本地环境变量提供，绝不提交真实密码或 `.env` 文件。

## 4. 系统架构与数据流

```text
Browser (React SPA)
       │ HTTPS / JSON + Idempotency-Key
       ▼
Spring Boot REST API
 ├─ Security: JWT authentication + role authorization
 ├─ Controllers: request validation and HTTP mapping
 ├─ Application services: menu, cart checkout, order, preference, admin
 ├─ Domain rules: pricing, cutoff resolution, duplicate-order check
 └─ Repositories: JPA parameterized queries
       │ transaction
       ▼
MySQL 8.4 (schema managed by Flyway)
```

菜单读路径采用 Redis 缓存：缓存「日期 + 筛选前的可见菜单」的轻量投影，短 TTL（例如 60 秒）。管理员变更菜品上架状态或每日菜单后主动失效对应日期缓存。Redis 同时用于短生命周期的重复提交抑制；订单的幂等记录和唯一约束仍以 MySQL 为最终依据。开发环境使用与其他项目隔离的 `127.0.0.1:6380` 实例，生产环境通过环境变量接入托管 Redis。

## 5. 后端模块划分

```text
backend/
  auth/          注册、登录、令牌、当前用户
  user/          用户资料、配送地址、饮食偏好
  menu/          菜品、定制项、每日菜单、员工菜单查询
  cart/          请求模型与服务端购物车校验（持久化可后置）
  order/         结算、价格快照、幂等、取消、订单查询
  admin/         菜品与每日菜单 Console API
  common/        异常、统一响应、审计字段、金额/时间工具
```

前端按 `auth`、`menu`、`cart`、`orders`、`settings`、`console` 分 feature 组织；每个 feature 内聚页面、业务组件、请求 hooks 与类型。`shared/ui` 统一封装 Ant Design 的主题、常用确认弹窗与状态组件，`shared/api` 管理请求客户端和错误映射，`shared/lib` 放金额与时间工具。路由守卫同时处理未登录和角色不匹配；所有面向用户的字符串集中在英文文案文件，避免遗漏中文提示。

## 6. 数据模型概要

| 实体 | 关键字段与约束 |
| --- | --- |
| `users` | `id`、唯一 `email`、`password_hash`、`role`、时间戳 |
| `user_preferences` | `user_id`、preferred categories、spice preference、taste preference、预算上下限 |
| `user_allergens` | `user_id` + `allergen` 唯一 |
| `addresses` | `id`、`user_id`、地址、是否默认 |
| `dishes` | 名称、描述、`price_cents`、分类、蛋白质、辣度、是否上架、图片地址 |
| `dish_allergens` | `dish_id` + `allergen` 唯一 |
| `option_groups` / `option_items` | 菜品定制组、必选标记、选项、`extra_price_cents` |
| `daily_menus` | `menu_date` + `dish_id` 唯一、当前可售 `available_quantity`（非负）；下单以条件更新原子扣减，取消时条件状态变更成功后原子返还 |
| `orders` | 用户、日期、餐次、地址快照、状态、`total_cents`、幂等键；有效订单唯一约束策略见下文 |
| `order_items` | 菜品名称/价格快照、数量、小计 |
| `order_item_options` | 已选选项名称/加价快照 |
| `idempotency_records` | 用户、幂等键、请求摘要、订单 ID、响应状态 |

金额字段一律使用 `BIGINT` 的分（如 `2250` 表示 `¥22.50`），Java 使用 `long`/`BigDecimal` 转换展示，绝不使用 `double`。

## 7. 可靠性与安全设计

### 7.1 下单事务与幂等

1. 校验 JWT 身份、请求格式、购物车总份数、菜品可见性、定制项和截单规则；
2. 在单个数据库事务中读取/创建幂等记录；已存在完成记录则直接返回原订单；
3. 检查该员工同日期同餐次是否有有效订单；
4. 服务端根据菜单和选项当前价格计算金额；按菜品汇总数量并逐项执行 `UPDATE daily_menus SET available_quantity = available_quantity - :quantity WHERE menu_date = :date AND dish_id = :dishId AND available_quantity >= :quantity`。任一更新影响行数为 0 时抛出缺货错误，整个事务回滚；
5. 仅在全部库存更新成功后写入订单、订单项和选项快照；
6. 写入幂等结果后提交事务。

数据库使用唯一约束辅助保护幂等键（`user_id, idempotency_key`）。对「有效订单唯一」使用事务内条件检查，并在 schema 中使用可唯一化的 `active_meal_key`（有效状态为 `date#meal`，取消后为 `NULL`）建立 `(user_id, active_meal_key)` 唯一索引，避免并发请求穿透业务检查。取消操作先条件更新订单（`status = Pending`），仅在影响行数为 1 时返还库存；从而使重复取消不会重复返库。

### 7.2 授权与输入防护

- Spring Security 的方法级角色控制保护管理员接口；资源查询始终带当前 `user_id` 条件。
- Controller 使用 Bean Validation 限制长度、枚举和格式（邮箱/地址 ≤ 200，搜索词 ≤ 50）。
- JPA Criteria / 参数绑定实现搜索和筛选，不拼接 SQL；HTML/URL 输入按白名单和输出编码处理。
- 统一异常处理返回英文、可操作但不泄露内部信息的错误消息。
- 登录失败返回通用提示，密码以 BCrypt 存储，敏感配置仅从环境变量加载。

### 7.3 时间与可测试性

后端统一使用 `Asia/Shanghai` 时区，并注入 `Clock`，使截单规则能够稳定测试。配送日期和餐次由后端最终解析；前端展示后端返回的建议值，避免浏览器时钟或时区差异导致不一致。

## 8. 初始数据与演示策略

Flyway 种子数据将创建：管理员账户、演示员工账户、PRD 中的 9 个英文菜品、菜品定制项、当日与次日的可订菜单、供应数量和示例地址。密码不会以明文写入数据库，将以预生成 BCrypt 哈希插入；演示账户信息会在 README 明确说明。

产品图片从候选人交付包的 `product_images/` 复制到前端静态资源并建立稳定映射。图片缺失时使用英文占位状态，不影响核心下单流程。

## 9. 测试与交付

最低测试集：

- 价格计算（加料、多数量、分单位精度）；
- 截单自动切换（10:00、15:00 边界及跨日）；
- 总份数上限、必选定制项和预算提醒；
- 幂等键重复提交只产生一个订单；
- 同餐次有效订单唯一、取消后可重新下单；
- 并发下单不会使库存小于零；库存不足时整单回滚，成功取消只返还一次库存；
- 员工访问 Console 被拒绝，管理员可操作。

交付时项目根目录将包含 `README.md`、`API.md`、本技术方案、可执行测试，以及 `ai-conversations/` 的完整原始 AI 对话导出文件。每个已验证变更单元均提交 Git commit。

## 10. 实施顺序

1. 初始化 Maven 后端、React 前端、环境变量模板、MySQL/Flyway；
2. 建模与种子数据，完成认证、英文基础布局；
3. 完成菜单、详情、定制、购物车、带条件库存扣减的下单；
4. 完成订单查询/取消、偏好与全部订餐规则；
5. 完成 Console 菜品/每日菜单管理；
6. 补齐测试、API 文档、启动说明并进行端到端验证。
