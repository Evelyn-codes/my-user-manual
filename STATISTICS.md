# 匿名人格统计

## 已部署
- 小游戏仍在 https://evelyn-codes.github.io/my-user-manual/
- 统计服务：Cloudflare Pages + D1（复用同一个数据库，不需要自有域名）
- 管理页：https://manual-personality-stats.pages.dev/admin
- 管理密钥在本机 `stats/.dev.vars` 的 ADMIN_TOKEN 值中，文件权限 0600；云端使用 Pages Secret，不提交到 GitHub。登录后密钥只留在页面内存，刷新需重新输入。
- 原 Workers 部署为备用，正式前端使用 Pages 地址。没有启用付费套餐。

## 数据及接口
只有一张业务表 `personality_results`，字段 id、device_key、result_code、created_at、updated_at。D1 的 migrations 表仅管理数据库版本。

POST `/api/personality-result` 只接受随机 UUID installationId 和合法 result，服务端 SHA-256 后存储，UNIQUE(device_key) + 原子 UPSERT 防止重复记录。相同结果不改记录；不同结果更新人格和更新时间。拒绝额外字段。

GET `/api/admin/personality-stats` 要求 Authorization: Bearer 管理密钥。返回总设备数及全部 18 种人数与百分比（1 位小数），按人数降序。无读取单设备、删除或修改他人数据的公开接口。

## 前端
`src/lib/statistics.ts` 在首次进入时生成并持久保存随机安装 ID。完成测试后结果立即展示，后台异步提交；已完成的旧用户重新打开结果时也会提交。只保留最新待提交人格，网络恢复、下次访问或每分钟重试；统计失败不影响答题和结果。清空并重测不更换安装 ID。

统计从功能上线后开始，无法追溯从未重新打开的历史用户。
“设备”实际指同一浏览器的本地安装：清理存储、无痕模式、更换浏览器会成为新样本；不使用硬件标识或指纹识别。禁止本地存储时跳过统计。

## 验证
- `npm test`：真实 SQLite 检查重复并发提交、LOADING→TBD 后总数不变、18 类零值、百分比、鉴权、非法输入与字段最小化。
- `VITE_STATS_API_URL=http://localhost:8787/api/personality-result npm run dev -- --port 5177 --strictPort` 后运行 `node tests/statistics-ui.cjs`：模拟接口检查安装 ID 持久化、重测复用 ID、失败不阻塞与重试。测试使用隔离浏览器上下文。
- 线上已用独立测试 UUID 验证 LOADING→LOADING→TBD，总数始终只增加 1；验证后只删除该测试记录。
- 手工验收：同一浏览器完成一次→后台记下总数→重测→后台总数不变，相应人格迁移；不同浏览器为新样本。

## 维护部署
在 `stats/pages` 下使用 Wrangler：
- `npx wrangler pages deploy public --project-name manual-personality-stats --branch main`
- 更新密钥用 `npx wrangler pages secret put ADMIN_TOKEN --project-name manual-personality-stats`，随后重新部署。不要将密钥写入任何 VITE_ 变量。
- D1 迁移位于 `stats/migrations`；已有数据库不能重复创建。
- 正式接口地址为 `.env.production` 的 VITE_STATS_API_URL，空值会禁用提交。

## 隐私与权限边界
应用不采集或存储题目答案、三维分数、姓名、电话、OpenID、真实硬件 ID、IP、User Agent、精确位置或浏览记录。测试答案仅在用户本机用于进度恢复。数据库只保存匿名哈希、人格及记录时间。不写请求日志、不安装第三方行为分析。

原始随机 ID 经 HTTPS 传输，只用于服务端计算哈希，不写入数据库。网络服务提供商处理连接时仍会接触 IP 等传输信息；不能把“不入业务库”理解为平台完全不处理网络元数据。

这是匿名统计，不是防作弊系统：公开提交入口无法阻止有人主动生成大量新 UUID；不引入 IP 统计或设备指纹。持有某安装 ID 即可更新该安装的结果，随机 UUID 的不可猜测性用于隔离正常用户。管理员密钥泄露需立即更换。
