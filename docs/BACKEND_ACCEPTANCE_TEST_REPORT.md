# WebBox 后端验收测试报告

**验收时间：** 2026-09-22
**验收范围：** Tier 1、Tier 2，以及库存事务、幂等与并发安全相关后端能力。
**验收方式：** 代码审查、Maven 自动化测试、真实 MySQL/Redis 启动验证、只读 API 验证。

## 1. 结论

**有条件通过。**

已提交后端具备进入前后端联调的条件：基础设施、Flyway、认证授权、菜单缓存、菜单分类、偏好枚举、截单、幂等设计和库存事务代码均已验证。

真实并发集成测试已在独立 MySQL 测试库执行通过。当前唯一交付条件是将相关测试和 Maven profile 提交到 Git，使该验证能够随交付物复现。

## 2. 已验证环境与命令

| 项目 | 结果 |
| --- | --- |
| Java | OpenJDK 17.0.20.1 |
| Maven | 3.8.3 |
| MySQL | 独立 MySQL 8.4.11 |
| Redis | 独立项目实例可用 |
| Flyway | 启动时验证 7 个迁移，数据库升级至 V7 |

已执行：

```sh
. scripts/use-project-java.sh
cd backend
mvn test
```

结果：**21 tests passed，0 failures，0 errors，0 skipped**。

已执行真实 MySQL 并发集成测试：

```sh
WEBBOX_TEST_DB_NAME=webbox_backend_it mvn verify -Pmysql-it
```

结果：默认测试 **21/21 通过**；Failsafe MySQL 集成测试 **5/5 通过**。

为避免占用默认端口，服务以临时端口启动，并仅在进程环境中提供审计用 JWT 密钥：

```sh
SERVER_PORT=28094 mvn spring-boot:run
```

启动成功连接真实 MySQL、Redis，并执行 Flyway V7。验收完成后该临时进程已停止。

## 3. 验收矩阵

| 验收项 | 状态 | 证据 |
| --- | --- | --- |
| JDK 17 + Spring Boot + Maven | 通过 | Maven 构建和测试完成 |
| 独立 MySQL 与 Flyway | 通过 | 真实 MySQL 8.4.11；Flyway 验证至 V7 |
| Redis 菜单缓存 | 通过 | Redis 菜单缓存键可见，TTL 为约 60 秒 |
| BCrypt 与 JWT Cookie 认证 | 通过 | BCrypt 编码器、HTTP-only Cookie、JWT 最小密钥长度校验 |
| JWT 环境契约 | 通过 | `.env.example`、`ENVIRONMENT.md`、README 已声明必需的 `WEBBOX_JWT_SECRET` |
| 员工/管理员权限隔离 | 通过 | 员工访问管理员每日菜单接口返回 403 |
| 菜单可见性、筛选、分页、详情 | 通过 | 真实 API 返回已上架每日菜单、分类筛选、定制项、过敏原、库存和整数分价格 |
| PRD 菜品分类 | 通过 | 支持 Chinese、Western、Japanese、Light Meal、Korean、Southeast Asian |
| PRD 过敏原枚举 | 通过 | 支持 Peanuts、Dairy、Egg、Gluten、Soy、Fish、Shellfish |
| 口味浓淡偏好 | 通过 | 后端校验 `Light|Moderate|Rich`；V7 将旧值迁移为 `Moderate` |
| 服务端价格/选项/总价校验 | 通过（代码审查） | 后端重新查询菜品和选项并按整数分计算 |
| 截单自动切换 | 通过（单元测试/代码审查） | `CutoffPolicy.resolve` 覆盖 10:00 和 15:00 边界 |
| 有效订单唯一约束 | 通过（代码/迁移审查） | `uq_active_order(user_id, active_meal_key)` |
| 幂等记录 | 通过（代码/单元测试） | V4 支持预留记录，重复 Key 查询既有订单 |
| 条件库存扣减与整单事务 | 通过（代码/单元测试） | 条件 `UPDATE`、`@Transactional`、非负库存约束 |
| 并发防超卖与重复取消返库 | 通过（真实 MySQL 集成测试） | `webbox_backend_it` 隔离库上 5/5 Failsafe 测试通过 |

## 4. 关键 API 验证结果

| 场景 | 结果 |
| --- | --- |
| 演示员工登录 | 成功，返回 `EMPLOYEE` |
| 演示管理员登录 | 成功，返回 `ADMIN` |
| 51 字符菜单搜索 | 返回 `400 VALIDATION_ERROR` |
| 员工访问管理员接口 | 返回 `403 FORBIDDEN` |
| `Light Meal` 菜单筛选 | 返回迁移后的菜品数据 |
| 管理员读取每日菜单与库存 | 成功 |
| 员工读取偏好 | 返回 `tastePreference: "Moderate"` |

## 5. 测试覆盖缺口与风险

工作区存在新增但尚未提交的 MySQL 集成测试：

- `backend/src/test/java/com/webbox/order/OrderServiceMySqlIT.java`
- `backend/src/test/java/com/webbox/order/MySqlIntegrationTestDatabase.java`
- `backend/pom.xml` 中的 `mysql-it` Failsafe profile

该测试实现覆盖：

- 相同 `Idempotency-Key` 的并发请求返回同一订单；
- 同员工同餐次并发只保留一个有效订单；
- 不同员工并发下单不超卖；
- 任一菜品缺货时整单回滚；
- 并发重复取消只返库一次。

测试要求独立数据库 `webbox_backend_it`，并保护其不得与业务库同名。已确认该库可由 `webox_app` 连接，并在该库上执行通过；业务库 `webox` 未参与测试写入。

## 6. 发布前必做项

1. 提交 MySQL 集成测试文件和 `mysql-it` Maven profile。
2. 保留 `webbox_backend_it` 作为隔离测试库，并为应用测试账号维持最小必要权限。
3. 在 CI 或发布验收中设置环境变量 `WEBBOX_TEST_DB_NAME=webbox_backend_it` 后执行：

   ```sh
   mvn verify -Pmysql-it
   ```

4. 将该命令的通过结果作为库存并发、事务回滚、幂等和取消返库的最终验收证据；本次本地验收结果为 **5/5 通过**。

## 7. 非本期范围

以下项目不计入缺陷：库存实时推送、LLM 智能推荐、Console 经营数据看板。
