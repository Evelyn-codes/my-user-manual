# V2 升级验收（2026-09-19）

内容唯一来源：项目旁的《本人使用说明书 V2.md》。仅去除 Markdown 加粗/高亮标记，不改写题目或结果文案。

## 实际规则
- 固定顺序 18 题：A/B/C 各 6 题，每选项至多一个非零维度，只有 -1/0/+1。
- 总分各 -6～6；A≥2→A3，A≤-2→A1，其余A2；B≥2→B1，B≤-2→B3，其余B2。
- C 正负对应 C1/C2；恰好0时 Q18 A/B→C1、C/D→C2，Q18自身正常累加。
- 三条数据使用 round((score+6)/12*100)，并限制0～100。
- 18种组合代码不变；按V2文档使用“缓冲中 LOADING”。
- 结果卡顺序：人格名、标签、OS、描述、好友说明、系统状态、给自己的Tips。原图片/数据条位置保留。
- 新增个人Tips只在结果页展示。海报使用新文案并呈现标签与系统状态，不加入个人Tips。

## 保留与升级
现有视觉、角色图片、分享、重测、匿名安装ID、统计API和部署配置保留。旧答案不能解释为新题答案：保留本机v1记录，提示重新测试，v2进度单独保存。不会因为升级自动计算并提交旧答案。新测试完成仍使用原安装ID，更新原设备结果，不增加设备总数。

## 旧逻辑清理
旧规则出现在 questions.ts、scoring.ts、demoFixtures.ts、design 的两份内容配置及导入脚本、source-scores.json、内容/逻辑测试及README，均已替换。全局检索生产源码、测试与预览没有旧±18百分比、±3分档、多维加分或旧Q18分流。保留数字18用于题目数和人格数。

## 自测
|测试|结果|
|---|---|
|Test 1 A=+6进入A3|通过|
|Test 2 A=-6进入A1|通过|
|Test 3 A/B中间-1/0/+1及两端边界|通过|
|Test 4 C正负分|通过|
|Test 5 C=0时Q18四个选项分流|通过|
|Test 6 DND/LOADING/POWER/LIVE及全部18组合|通过|
|Test 7 三维-6/0/+6对应0/50/100%|通过|
|Test 8 首页→18题→结果/数据条/好友说明/状态/Tips→重测|通过|

还通过10,000组答案验证、72组移动端结果/海报检查、18张PNG二维码解码、图片延迟/失败重试、旧版记录隔离、新版第6题恢复、跨标签页同步及统计去重回归。正式构建通过。

## 修改文件（相对于本项目）
- `src/data/questions.ts`
- `src/data/results.ts`
- `src/data/types.ts`
- `src/data/demoFixtures.ts`
- `src/lib/scoring.ts`
- `src/lib/progress.ts`
- `src/lib/poster.ts`
- `src/App.tsx`
- `src/styles.css`
- `tests/content.test.mjs`
- `tests/logic.test.mjs`
- `tests/v2.test.mjs`
- `tests/interaction.cjs`
- `tests/images.cjs`
- `tests/statistics-ui.cjs`
- `tests/upgrade.cjs`
- `tests/fixtures/source-scores.json`
- `tests/fixtures/content-v2.json`
- `design/content.js`
- `design/header-review-content.js`
- `design/update-content.py`
- `design/preview.js`
- `design/header-review.js`
- `design/style.css`
- `design/header-review.css`
- `package.json`
- `README.md`
- `ACCEPTANCE.md`
- `V2_UPGRADE.md`
