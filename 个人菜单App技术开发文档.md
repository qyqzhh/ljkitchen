# 个人菜单管理 App 技术开发文档

> 版本：v1.4　|　日期：2026-11-03　|　状态：已确认需求，持续开发

---

## 1. 项目概述

复刻并实现一款本地运行的个人厨房管理应用，功能分为三大模块：**厨房（菜品浏览）**、**冰箱（食材管理）**、**管理（后台维护 + 数据导入导出）**。取消原方案中的点单/下单、订单页功能。

### 核心特性
- 纯本地运行，不依赖服务器，无需登录
- Android / iOS 双端，一套代码（Vue3 + Capacitor）
- iOS 端通过 PWA（Safari 添加到主屏幕）使用，体验接近原生 App
- Android 端通过 Capacitor 打包为 APK 安装使用
- 数据全量导出为 zip 包（data.json + images/），导入后与原数据完全一致
- 冰箱食材自动计算保质期状态（新鲜 / 快过期 / 已过期）

---

## 2. 技术选型

| 项目 | 选型 | 说明 |
|---|---|---|
| 前端框架 | **Vue 3.x** | 组合式 API，开发体验好 |
| 构建工具 | **Vite** | 极速构建，HMR 热更新 |
| UI 方案 | 纯手写 CSS（移动端优先） | 轻量，无 UI 库依赖 |
| 状态管理 | **Pinia** | Vue 官方推荐，轻量易用 |
| 本地数据库 | **IndexedDB（Dexie.js）** | 浏览器级本地存储，容量大，存结构化数据 |
| 图片存储 | IndexedDB（Base64）+ 可选文件系统 | PWA 模式下存 IndexedDB；原生模式下存沙盒 |
| 相册选图 | **原生文件选择器** | `<input type="file">` + Capacitor 文件插件 |
| zip 打包/解压 | **JSZip** | 纯 JS 实现，浏览器和 Node 环境通用 |
| 星级展示/选择 | 自实现组件 | 轻量可控 |
| PWA 支持 | **vite-plugin-pwa** | 离线缓存、添加到主屏幕 |
| 移动端打包 | **Capacitor 6.x** | Web 套原生壳，打包 Android APK |

### 为什么不用 Flutter
1. 用户暂无 Flutter SDK，环境搭建成本高
2. Vue3 前端开发效率更高，调试更方便
3. PWA + Capacitor 方案同样满足双端需求
4. 项目复杂度不高，Web 技术栈完全够用

---

## 3. 总体架构

```
┌─────────────────────────────────────────┐
│            UI 层（Pages / Components）    │
│  厨房页 │ 冰箱页 │ 管理页 │ 详情页 / 表单   │
├─────────────────────────────────────────┤
│          状态管理（Pinia Stores）         │
│  dishStore │ fridgeStore │ appStore     │
├─────────────────────────────────────────┤
│          数据层（Repository）             │
│  DishRepo │ CategoryRepo │ IngredientRepo│
├─────────────────────────────────────────┤
│     IndexedDB(Dexie.js)    │   图片存储    │
└─────────────────────────────────────────┘
```

- **单一数据源原则**：所有读写都经 Repository 层，UI 不直接碰数据库
- **状态管理**：Pinia（官方推荐，项目规模小，足够）
- **平台适配**：通过 Capacitor 插件在原生模式下增强文件系统能力，PWA 模式下自动降级为浏览器 API

---

## 4. 数据模型

### 4.1 菜品分类 DishCategory
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (PK) | UUID |
| name | string | 分类名，唯一 |
| sort | number | 排序值，越小越靠前 |

### 4.2 菜品 Dish
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (PK) | UUID |
| name | string | 菜名，必填 |
| categoryIds | string[] | 分类 ID 数组，至少一个 |
| imageData | string | Base64 图片数据，**可为空**，空则显示默认占位图 |
| rating | number | 星级 0~5.0，步进 0.5 |
| review | string | 评价文字，可后续修改，可为空 |
| createdAt | number | 时间戳（毫秒） |

> 注意：一个菜品可属于多个分类（多选）。

### 4.3 食材类别 IngredientCategory
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (PK) | UUID |
| name | string | 类别名，唯一 |

### 4.4 食材 Ingredient
| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (PK) | UUID |
| name | string | 食材名，必填 |
| categoryId | string | 关联食材类别，必填 |
| productionDate | string | 生产日期 `YYYY-MM-DD`，可为空 |
| shelfLife | number | 保质期数值 |
| shelfLifeUnit | string | `天` / `周` / `月` / `年` |
| quantity | string | 数量+单位，如 `12个`，可为空 |
| note | string | 备注，≤50字，可为空 |
| createdAt | number | 时间戳（毫秒） |

### 4.5 状态计算规则（冰箱）
- 剩余天数 = (productionDate + shelfLife换算天数) − 今天
- **已过期**：剩余天数 < 0
- **快过期**：0 ≤ 剩余天数 ≤ 3
- **新鲜**：剩余天数 > 3
- 生产日期为空时归入"新鲜"不参与倒计时

---

## 5. 导出 / 导入格式（zip）

### 5.1 包结构
```
menu_backup_20261019_0905.zip
├── data.json
└── images/
    ├── d1.jpg
    └── d3.jpg
```

### 5.2 data.json 示例
```json
{
  "app": "personal_menu",
  "version": 1,
  "exportedAt": 1760000000000,
  "dishCategories": [
    { "id": "c1", "name": "荤菜", "sort": 0 },
    { "id": "c2", "name": "素菜", "sort": 1 }
  ],
  "ingredientCategories": [
    { "id": "ic1", "name": "蔬菜" }
  ],
  "dishes": [
    {
      "id": "d1",
      "name": "排骨炖土豆",
      "categoryIds": ["c1"],
      "imagePath": "images/d1.jpg",
      "rating": 5.0,
      "review": "很入味",
      "createdAt": 1760000000000
    }
  ],
  "ingredients": [
    {
      "id": "i1",
      "name": "鸡蛋",
      "categoryId": "ic1",
      "productionDate": "2026-10-01",
      "shelfLife": 30,
      "shelfLifeUnit": "天",
      "quantity": "12个",
      "note": "",
      "createdAt": 1760000000000
    }
  ]
}
```

### 5.3 导出流程
1. 读取 IndexedDB 全部数据 → 组装 JSON 对象
2. 收集所有有图片的菜品，将 Base64 转为 Blob 文件，放入 zip 内 `images/` 目录（按 dish id 命名）
3. 组装 data.json 写入 zip，图片路径改为相对路径
4. 打包为 zip，文件名含时间戳 `menu_backup_YYYYMMDD_HHmm.zip`
5. PWA 模式：触发浏览器下载；Android 原生模式：写入 Downloads 目录或分享

### 5.4 导入流程（关键：必须可回滚）
1. 用户选择 zip 文件 → 解压到内存
2. 解析 data.json，校验 `app` 字段与 `version`（不支持的版本直接拒绝）
3. **自动备份（v2 分片式）**：把当前 IndexedDB 四张表的数据逐条拆成小记录（每条约一条菜品/分类）流式写入 `backup` 表（id 格式 `表名:记录id`，meta 记录 `import_backup_meta` 标记版本）。**禁止把全部数据（含图片 Base64）打包成单条巨型记录**——大库下单条记录的结构化克隆会让安卓 WebView 内存峰值翻倍，直接 OOM 闪退
4. 清空业务表 → 分类/食材分批 `bulkAdd` → 菜品按 10 条一批「图片转 Base64 → 写库」交替进行，批次间 `setTimeout(0)` 让出主线程，保证 UI 可渲染进度
5. 全程显示进度遮罩（备份中 / 写入分类与食材 / 正在导入菜品 x/y）；中途失败可通过「恢复上次备份」回滚到分片备份
6. 成功后提示"导入完成"，刷新所有页面

> 性能要点（v1.3 修复）：旧实现把所有图片 Base64 同时驻留内存 + 单条巨型备份记录，几百道菜的库在安卓端必崩（系统级 OOM，桌面都被杀重启）。新实现内存峰值 ≈ 一个批次（10 条）大小。
> 大图治理（v1.4）：菜品上传图片时用 canvas 压缩到最长边 1280px / JPEG 质量 0.8（DishEdit）；导入时对超过 1MB 的旧大图自动压缩，存量数据导入一次即"瘦身"（实测 1.53MB → 101KB）。
> 导入日志（v1.4）：`utils/importLog.js` 把导入各阶段（开始/解压/备份/清空/每批菜品/压缩）+ JS 堆内存采样（performance.memory）环形写入 localStorage（最多 300 条）；main.js 注册全局 error/unhandledrejection 钩子捕获非 OOM 异常。闪退后重开 App，从「管理 → 导入日志」页查看最后几条即可定位崩溃阶段，支持复制全部日志。OOM 类崩溃 JS 进程直接被杀，catch 不到，只能靠内存采样趋势判断（最后一条 heap 接近 limit 即为内存爆掉）。
> 兼容：`restoreFromBackup` 优先识别 v2 分片备份；不存在时回退读取旧版单条记录 `last_import_backup`。

---

## 6. 页面与功能规格

### 6.1 底部导航（3 个主 Tab）
```
🍳 厨房    🧊 冰箱    ⚙️ 管理
```

### 6.2 厨房页
- **布局**：顶部搜索框；左侧竖排分类栏（"全部" + 各分类，可滚动）；右侧菜品卡片列表
- **卡片内容**：方形缩略图（无图用默认占位图）、菜名、星级星标 + 分数
- **交互**：
  - 点分类 → 右侧列表按分类过滤（多分类菜品在每个所属分类下都出现）
  - 搜索 → 按菜名模糊匹配
  - 点卡片 → 菜品详情页：大图、菜名、星级、所属分类、评价文字（**只读**）

### 6.3 冰箱页
- **顶部**：状态统计标签 `🟢 新鲜(n)　🟡 快过期(n)　🔴 已过期(n)`，点标签可筛选；搜索框
- **食材列表项**：名称、类别、数量、保质期剩余天数徽标（如"还剩5天"/"已过期"）、生产日期、备注
- **底部按钮**：
  - `+ 添加食材` → 表单页
  - `类别管理` → 食材类别增删改页
- **添加/编辑食材表单**：
  - 名称*（文本）
  - 类别*（从食材类别中选择，单选）
  - 生产日期（日期选择器，可空）
  - 保质期（数字输入 + 天/周/月/年 单位选择）
  - 数量（文本，如"12个"，可空）
  - 备注（多行文本，≤50字，可空）

### 6.4 管理页
- **厨房信息卡片**：厨房名、等级徽标（Lv.1）、菜品额度进度条（如 12/60）、分类额度进度条（如 5/10）
  - 额度规则可配置：菜品上限默认 60，分类上限默认 10
- **功能入口列表**：
  | 入口 | 说明 |
  |---|---|
  | 菜品管理 | 菜品列表 → 新增/编辑/删除 |
  | 菜品分类管理 | 分类增删改、拖拽或按钮调排序 |
  | 百宝箱 | 实用小工具集合，详见 6.6 |
  | 导出全部数据 | 见 5.3 |
  | 导入数据 | 见 5.4 |
  | 恢复上次导入前备份 | 从 backup_before_import 还原 |

### 6.5 菜品编辑表单（新增/修改共用）
| 字段 | 规则 |
|---|---|
| 菜名* | 必填 |
| 分类* | 弹窗多选（从菜品分类查询），至少选 1 个，不能不选 |
| 图片 | 点图片区 → 相册选择；可为空；编辑时可选"更换图片"/"移除图片" |
| 星级 | 星标点选，支持半星（0.5 步进） |
| 评价 | 多行文本，可空 |
| 删除 | 编辑模式下有删除按钮，二次确认后删除 |

**校验规则**：菜名为空或分类未选 → 禁止提交并提示。

### 6.6 百宝箱（管理页二级页面）

实用小工具集合页，入口在管理页功能列表。当前包含功能：通勤费用计算。

#### 6.6.1 通勤费用计算

**需求背景**：根据用户填写的票价与通勤频率，估算每月地铁 + 公交通勤总费用。通勤天数采用**纯手动输入**方案（不联网获取节假日、不读取系统日历，保证安卓 APK 与 iOS PWA 双端一致、离线可用、零权限门槛）。

**输入参数**：
| 字段 | 规则 |
|---|---|
| 地铁折前单程金额 | 数字 ≥ 0，默认 0 元，≤ 1000，支持一位小数 |
| 公交单程金额 | 数字 ≥ 0，默认 0 元，≤ 1000，支持一位小数 |
| 每日通勤次数 | 1 ~ 10 的整数，默认 2（上班 + 下班） |
| 每月通勤天数 * | 1 ~ 31 的整数，必填 |

**计费口径**：每次通勤按**地铁 1 趟 + 公交 1 趟**计算（组合通勤，如公交接驳地铁）；只用其中一种时将另一项金额填 0，但两者不能同时为 0。

**地铁折扣规则**（参照北京地铁，按自然月内累计实付金额逐次模拟）：
- 累计实付 < 100 元：原价
- 累计实付满 100 元后：后续乘次 8 折（从下一次乘车生效）
- 累计实付满 150 元后：后续乘次 5 折
- 累计实付满 400 元后：恢复原价
- 阈值按"累计实付"判断，即折扣金额也计入累计；公交不打折

**计算公式**：
- 地铁趟数 = 每月通勤天数 × 每日通勤次数；公交趟数相同
- 地铁月费用 = 按上述规则逐趟模拟累加；公交月费用 = 公交单价 × 趟数
- 月总费用 = 地铁月费用 + 公交月费用

**结果展示**：每月通勤天数、地铁月费用（含原价与优惠节省金额）、公交月费用、月通勤总费用（高亮），以及折扣规则说明。

**校验规则**：金额为空/负数、次数非 1~10 整数、天数非 1~31 整数、地铁公交同时为 0 → 显示错误提示且不计算。

---

## 7. 本地数据库设计（IndexedDB / Dexie.js）

### 数据库名：`ljkitchen_db`

```javascript
// 表结构（Dexie.js 版本）
db.version(1).stores({
  dishCategory: 'id, name, sort',
  dish: 'id, name, rating, createdAt, *categoryIds',
  ingredientCategory: 'id, name',
  ingredient: 'id, name, categoryId, productionDate, createdAt',
  backup: 'id, createdAt'  // 存放导入前的备份数据
});
```

**索引说明**：
- `dish.categoryIds` 使用 MultiEntry 索引，方便按分类查询
- 常用查询都走索引，避免全表扫描

**图片存储**：
- PWA 模式：图片以 Base64 字符串存在 `dish.imageData` 字段
- 原生模式（可选优化）：图片存文件系统，数据库存路径

---

## 8. 权限与平台适配

| 事项 | Android（Capacitor） | iOS（PWA / Safari） |
|---|---|---|
| 读取相册 | 需申请存储权限 | 无需权限声明（系统弹窗） |
| 导出文件 | 可写入 Download 目录 | 触发浏览器下载 / 分享面板 |
| 离线使用 | ✅ 完整支持 | ✅ PWA 离线缓存 |
| 添加到主屏幕 | ✅（安装 APK） | ✅（Safari "添加到主屏幕"） |
| 返回手势 | 物理返回键 | 边缘滑动返回 |

---

## 9. 边界与异常处理

1. **分类被删除**：禁止删除仍有菜品引用的分类，提示"该分类下还有 N 个菜品"
2. **图片丢失**：读取时 imageData 为空 → 显示默认占位图，不崩溃
3. **导入 zip 损坏**：解压/解析失败 → 提示"文件无效"，回滚
4. **导入旧版本备份**：version 低于当前 → 按迁移规则升级；高于当前 → 拒绝并提示升级 App
5. **额度上限**：菜品达 60 时，新增按钮置灰并提示
6. **星级为空**：默认 0，前端显示"未评分"
7. **IndexedDB 不可用**：降级提示用户使用现代浏览器

---

## 10. 开发计划

| 阶段 | 内容 | 预估 |
|---|---|---|
| P1 | 项目搭建（Vite + Vue3 + PWA）、数据库层（Dexie.js）、四个表 CRUD | 基础 |
| P2 | 厨房页：分类栏、列表、搜索、详情页 | 核心展示 |
| P3 | 冰箱页：食材 CRUD、类别管理、过期状态计算 | 核心业务 |
| P4 | 管理页：菜品管理表单（多选分类/相册选图/星级）、分类管理、额度条 | 核心维护 |
| P5 | 导出/导入（zip 全流程 + 备份回滚） | 关键可靠性 |
| P6 | Capacitor 集成、Android 打包配置、PWA 图标配置、联调测试 | 收尾 |

> iOS 端通过 PWA 方式使用，无需开发者账号；Android 端需 Android SDK 打包 APK（也可先用浏览器测试）。

---

## 11. 需求确认记录（已与客户确认）

- [x] 双端：Android（APK）+ iOS（PWA 添加到主屏幕）
- [x] 技术方案：Vue3 + Capacitor + PWA
- [x] 取消点单/下单、订单页
- [x] 底部三个 Tab：厨房、冰箱、管理
- [x] 菜品评论仅在添加/编辑时填写（星级 + 文字），详情页只读，**无追加评论功能**
- [x] 图片从相册选取，可为空，编辑时可更换/移除
- [x] 冰箱食材纯文本，无图片
- [x] 导出 zip（data.json + images/），导入后完全一致，导入前自动备份
- [x] 分类多选，必选至少一个
- [x] 分类多选，必选至少一个
- [x] 管理页与"我的"页合并
- [x] 菜品和分类无限额，可自由添加
- [x] PWA 使用手动实现（manifest + sw.js），不依赖 vite-plugin-pwa
- [x] 新增「百宝箱」工具集合页（管理页入口），首个功能为通勤费用计算（v1.2）
- [x] 通勤天数采用纯手动输入方案（已评估：iOS PWA 无法读取系统日历；联网节假日接口依赖第三方稳定性，均不采用）

---

## 12. 部署指南

### 12.1 iOS 部署（PWA 方式）

iOS 端通过 Safari "添加到主屏幕" 使用，无需开发者账号，有以下两种部署方式：

#### 方式一：Netlify 免费静态托管（推荐）

1. 将代码推送到 GitHub 仓库
2. 注册 Netlify 账号（https://netlify.com，用 GitHub 登录）
3. 导入 GitHub 仓库，配置：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 点击 Deploy，等待 1-2 分钟
5. 获得 `xxx.netlify.app` 的 HTTPS 网址
6. iPhone 用 Safari 打开网址 → 分享按钮 → "添加到主屏幕"

**优点**：随时可用，电脑不用开，完整 PWA 离线支持

#### 方式二：局域网开发服务器

1. 电脑和手机连同一个 Wi-Fi
2. 执行 `npm run dev` 启动开发服务器
3. 手机 Safari 访问局域网地址（如 `http://192.168.1.3:5173/`）
4. 分享按钮 → "添加到主屏幕"

**缺点**：电脑必须一直开着，只能在同一个 WiFi 下使用

---

### 12.2 Android 部署（APK 方式）

Android 端通过 Capacitor 打包成 APK 安装包，直接安装到手机。

#### 环境准备

**必需工具**：
| 工具 | 版本要求 | 说明 |
|---|---|---|
| JDK | 8+ | 您已有：E:\study\jdk8 |
| Node.js | 16+ | 您已有：E:\tools\nodejs |
| Android SDK | API 22+ | 需要安装（见下方） |

#### 第 1 步：安装 Android Studio（推荐）

Android Studio 自带 Android SDK 和 Gradle，是最简单的方式：

1. 下载 Android Studio：https://developer.android.com/studio
2. 运行安装程序，默认安装即可
3. 首次启动会自动下载 Android SDK，等待完成
4. 记录 SDK 安装路径（一般是 `C:\Users\你的用户名\AppData\Local\Android\Sdk`）

#### 第 2 步：配置环境变量

Windows 系统需要配置以下环境变量：

1. **ANDROID_HOME**：指向 Android SDK 路径
   - 例如：`C:\Users\Admin\AppData\Local\Android\Sdk`

2. **PATH 中添加**：
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`
   - `E:\study\jdk8\bin`（如果 Java 不在 PATH 中）

**配置方法**：
- 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
- 在"系统变量"里新建 `ANDROID_HOME`
- 编辑 `Path`，添加上面的路径

#### 第 3 步：安装必要的 SDK 组件

打开 Android Studio → Tools → SDK Manager → SDK Tools，确保勾选：
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android SDK Command-line Tools (latest)

然后在 SDK Platforms 中选一个最新的 SDK Platform 安装（如 Android 14.0）。

#### 第 4 步：验证环境

在项目目录下打开 PowerShell，执行：
```powershell
.\check-env.ps1
```
如果全部显示 OK，说明环境准备好了。

#### 第 5 步：构建 APK

在项目目录下执行：

**Debug 版**（直接安装调试用）：
```powershell
.\build-apk.ps1
```

**Release 版**（正式发布用，需要签名）：
```powershell
.\build-apk.ps1 release
```

构建成功后，APK 位置：
- Debug：`android\app\build\outputs\apk\debug\app-debug.apk`
- Release：`android\app\build\outputs\apk\release\app-release.apk`

#### 第 6 步：安装到手机

**方法一：数据线安装**
1. 手机开启"开发者选项"和"USB 调试"
   - 设置 → 关于手机 → 连续点"版本号" 7 次，开启开发者模式
   - 设置 → 开发者选项 → 开启 USB 调试
2. 数据线连接电脑和手机
3. 手机上选择"文件传输"模式，允许 USB 调试
4. 直接双击 APK 文件安装，或执行：
   ```
   adb install app-debug.apk
   ```

**方法二：无线传输**
- 把 APK 文件传到手机（微信、QQ、网盘等）
- 在手机文件管理器中找到 APK，点击安装
- 需要开启"允许安装未知来源应用"

---

### 12.3 日常开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 同步前端代码到 Android 项目
npm run cap:sync

# 一键打包 APK（Debug）
.\build-apk.ps1

# 一键打包 APK（Release）
.\build-apk.ps1 release

# 检查 Android 构建环境
.\check-env.ps1
```

---

### 12.4 项目结构

```
LJKitchen/
├── 个人菜单App技术开发文档.md    # 开发文档
├── capacitor.config.json         # Capacitor 配置
├── package.json
├── vite.config.js
├── index.html
├── build-apk.ps1                 # APK 一键打包脚本
├── check-env.ps1                 # 环境检查脚本
├── public/
│   ├── manifest.webmanifest      # PWA manifest
│   └── sw.js                     # Service Worker
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js
│   ├── db/index.js               # Dexie.js 数据库
│   ├── stores/                   # Pinia 状态管理
│   ├── utils/                    # 工具函数
│   ├── views/                    # 页面组件
│   └── components/               # 通用组件
└── android/                      # Android 原生项目（Capacitor 生成）
    ├── app/
    ├── gradle/
    ├── build.gradle
    └── gradlew.bat
```