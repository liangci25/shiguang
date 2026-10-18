# 拾光 · 模拟小手机对话网站 —— 命名清单与开发规范（NAMING.md）

> 本文件是本项目的**唯一命名权威**：所有代码里的名字，都以本清单为准。
> 它既是给你（人类用户）看的"代码地图"，也是给**任何后续接手工作的 AI** 的**工作规则**。
> 修改代码前，请先在本文件中用编号定位到目标；新增代码前，请先在本文件中登记命名。

- 项目版本：v0.4（聊天设置 · 扩展功能版）
- 最后更新：2026-10-18
- 代码载体：**多页面结构** —— 9 个页面，每页一套 HTML/JS/CSS + 公共文件（见第 3 节页面地图）
- 配套文档：`TESTING.md`（测试清单）、`check_structure.py`（自动化检查脚本）

---

## 1. AI 协作规则（其它 AI 必须遵守，硬性规定）

以下规则适用于**所有**后续参与本项目开发、修改、排查 bug 的 AI：

| 编号 | 规则 | 说明 |
|---|---|---|
| R1 | 命名以本清单为准 | 代码中出现的任何 id / class / 函数名 / 字段名，必须能在本清单中找到对应条目。清单没有的名字 = 不允许出现在代码里 |
| R2 | 先登记，再写代码 | 新增任何元素 / 组件 / 函数前，先在本清单对应层级追加条目并更新变更记录，然后才写代码 |
| R3 | 修改必须用编号引用 | 修改或排查 bug 时，在回复中用编号（如「修改 03.2.1 msgInput」）引用目标，方便人类用户核对 |
| R4 | 不私自改名 | 现有命名如需更改，必须：改代码 → 同步更新本清单 → 在变更记录注明「旧名 → 新名」，并保留旧名一行标为「已废弃（deprecated）」 |
| R5 | id 全局唯一 | DOM 的 id 在同一页面内不允许重复；新增 id 前先搜索是否已存在（跨页面可同名，如每个页面都有 `modalRoot`、`toast`） |
| R6 | 职责单一 | 每个元素 / 函数只做一件事：id 用于定位逻辑，class 只管样式，函数名以动词开头 |
| R7 | 每轮改动记变更 | 每一轮开发 / 修改结束，在文末「变更记录」追加一行：日期、改了哪些编号、内容摘要 |
| R8 | 新 AI 先读本文件 | 任何 AI 开始在本项目工作前，必须先完整阅读本文件第 1、2、3 节（规则、命名总则、页面地图） |
| R9 | 页面跳转用链接 | 页面之间用 HTML `<a>` 链接或 `location.href` 跳转；**不要**在同一页面里用 JS 切换"假视图" |
| R10 | 数据变更走事件 | 任何数据修改后派发 `sg:data` 事件；页面监听事件刷新自己，**禁止**跨页面直接调用其它页面的函数 |
| R11 | 公共代码放 common | 多页面共享的函数放 `js/common.js`，页面专属逻辑放该页自己的 js；共享样式放 `css/common.css` |
| R12 | 动态前缀 id 规范 | 弹窗内动态生成的 id 用前缀登记：`cf-`（角色弹窗）、`gf-`（群弹窗）、`nc-`（新建角色页）、`ng-`（新建群聊页）、`ci-`（角色设置页）、`cs-`（聊天设置页）、`cbg-`（背景弹窗）、`csearch-`（查找弹窗）、`rp-`（红包弹窗）、`sh-`（分享弹窗）、`svq-`（问卷弹窗）、`dup-`/`imgUrl-`/`newEntry-`/`editEntry-`/`group*`（词库弹窗）。清单中按「前缀 + 用途」登记 |
| R13 | 手势操作有等价发现 | 左滑 / 长按等手势，必须有可被发现的等价操作（长按露出删除按钮，删除按钮可点击），且触摸与鼠标均支持 |

---

## 2. 命名总则（风格表）

| 项目 | 强制风格 | 示例 | 说明 |
|---|---|---|---|
| 组件/模块名 | 大驼峰 PascalCase | `ChatWindow` | 一个组件就是一个"盒子"，职责明确 |
| DOM 元素 id | 小驼峰 camelCase | `msgInput` | 页面中每个需要 JS 操作的关键元素都有唯一 id |
| CSS 样式类 | 小写连字符 kebab-case | `list-item` | 只负责样式；**JS 不允许用 class 做逻辑判断** |
| 函数/方法 | 动词开头小驼峰 | `sendMessage` | 看一眼名字就知道"做什么" |
| 数据模型字段 | 小驼峰 | `memberIds` | 存储数据的字段名 |
| 常量 | 全大写 + 下划线 | `FALLBACK_REPLIES` | 固定不变的值 |
| 存储键名 | 小写 + 下划线 | `shiguang_chat_v1` | localStorage 键 |
| 自定义事件 | 前缀 `sg:` + 名称 | `sg:data` | 页面间通信的事件名 |
| 页面 JS 文件名 | 与 HTML 同名 | `index.js` ↔ `index.html` | 一个页面一套 js/css |
| 编号体系 | 数字点分 | `03.2.1` | 见第 4 节「分级编号规则」 |

---

## 3. 页面地图（先看这个）

### 3.1 文件清单（9 页面 + 公共文件）

| 页面 | HTML | JS | CSS | 职责 |
|---|---|---|---|---|
| 消息首页 | `HTML/index.html` | `js/index.js` | `css/index.css` | 会话列表（置顶排前）、右上角＋菜单、左滑/长按删除、未读红点 |
| 新建选择 | `HTML/new.html` | `js/new.js` | `css/new.css` | 两个入口（v3.1 起无 UI 入口，保留备用） |
| 加好友 | `HTML/new-char.html` | `js/new-char.js` | `css/new-char.css` | 左右分栏资料填写：左头像（拍照/上传）、右昵称必填 + URL 实时预览、底部「添加梦角」 |
| 新建群聊 | `HTML/new-group.html` | `js/new-group.js` | `css/new-group.css` | 群名 + 群头像 + 勾选角色成员（**总人数含你**） |
| 聊天窗口 | `HTML/conversation.html` | `js/conversation.js` | `css/conversation.css` | 统一样式气泡、扩展按钮菜单（相册/拍照/视频通话/红包/分享/问卷）、背景、通话模拟 |
| 角色设置 | `HTML/chat-info.html` | `js/chat-info.js` | `css/chat-info.css` | 私聊右上角进入：聊天设置 / 置顶 / 背景 / 查找记录 / 清空 |
| 聊天设置 | `HTML/chat-settings.html` | `js/chat-settings.js` | `css/chat-settings.css` | 回复频率滑块 / 主动发消息 / 气泡 CSS 实时预览 |
| 词库管理 | `HTML/library.html` | `js/library.js` | `css/library.css` | 通用/专属词库 × 字卡/Emoji/表情包 × 分组管理 |
| 设置 | `HTML/settings.html` | `js/settings.js` | `css/settings.css` | 导出备份 / 导入备份 / 清空全部 |
| 公共 | — | `js/common.js` | `css/common.css` | 数据层、词库系统、弹窗、头像、回复调度、主动消息调度、手机框架 |

> 已移除：`contacts.html/js/css`（通讯录模块，v0.4 整体删除，见变更记录）。

### 3.2 页面跳转关系

```
index.html ──点会话──▶ conversation.html?sid=xxx
index.html ──右上角＋菜单──▶ 加好友 new-char.html / 创建群聊 new-group.html
conversation.html（私聊）──右上角⋯──▶ chat-info.html?sid=xxx ──聊天设置──▶ chat-settings.html?sid=xxx
chat-info.html ──查找结果──▶ conversation.html?sid=xxx&focus=消息id（自动定位并高亮）
index / library / settings ──底部导航互相跳转（3 tab：聊天/词库/设置）
conversation.html ──删除会话/返回──▶ index.html
```

### 3.3 页面间通信（事件约定，R10）

| 事件 | 触发时机 | 页面反应 |
|---|---|---|
| `sg:data` | 任何数据被修改（Actions 派发） | 各页刷新自己视图；聊天页还会检查当前会话是否被删，被删则跳回列表 |
| `sg:reply` | 一条角色回复已写入 | 聊天页重绘消息；列表页刷新预览和未读数 |
| `sg:typing` | 正在输入指示 开/关 | 聊天页显示/隐藏三点动画 |
| `window.__sgSid` | 全局变量 | 当前页面正在查看的会话 id；回复到达时若与此相同则**不**计未读 |

> 重要机制：回复调度任务写入 localStorage（`pendingReplies`），聊天页关闭后，任何页面加载时 `ReplyQueue.restore()` 都会接管队列继续完成回复——**发消息后立刻离开聊天页，回复也一定到达**。群聊回复由 `ReplyQueue.pickSpeaker` 随机选择发言者（成员≥2 时避免与上次发言者连续重复）。

---

## 4. 代码地图（分级编号）

### 4.0 分级编号规则

```
一级（模块）       03                  一个独立大区域 / 大组件 / 一个页面
二级（区块）       03.2                模块内的一个区块
三级（元素）       03.2.1              区块内的一个元素（id 或 class）
四级（子元素/状态） 03.2.1.a            元素内部的子件或状态
```

- 每个条目给出：**编号 | 命名 | 中文名 | 代码位置（精确选择器）| 职责说明**
- 「代码位置」里的 `#xxx` 表示 id，`.xxx` 表示 class，可以在对应文件中直接搜索。
- 标注「模板」的 class 会被渲染多次，代码中通过 JS 批量生成。

---

### 模块 00 —— 手机界面框架（全站）

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 00.1 | `phone` | 手机屏幕容器 | `.phone` | 所有页面的最外层；宽屏居中显示手机外框，窄屏占满 |
| 00.2 | `page-head` | 页面头部 | `.page-head` | 标题栏（带底部导航的页面） |
| 00.2.1 | `head-title` | 页面标题 | `.head-title` | 居中标题文字 |
| 00.2.2 | `head-back` | 返回按钮 | `.head-back` | 左上角 ‹ 链接，返回上一页 |
| 00.2.3 | `head-add` | 右上角加号 | `.head-add` | 首页专属：绿色圆形 ＋，点击**弹出下拉菜单**（不再直接跳转） |
| 00.2.4 | `head-close` | 红色叉号关闭 | `.head-close` | 资料填写页右上角红色 × ，点击关闭页面回首页 |
| 00.2.5 | `head-menu` | 加号下拉菜单 | `#headMenu` / `.head-menu` | 白色圆角悬浮菜单；点击弹窗外空白区域关闭 |
| 00.2.5.1 | `head-menu-item` | 菜单选项（模板） | `.head-menu-item` | `data-go="group"` 创建群聊 / `data-go="char"` 加好友；点击关闭并跳转 |
| 00.2.5.1.a | `menu-icon` | 菜单图标 | `.menu-icon` | 绿色 SVG 图标（群/好友） |
| 00.3 | `page-body` | 页面内容区 | `.page-body` | 可滚动内容容器 |
| 00.4 | `tab-bar` | 底部导航条 | `.tab-bar` | 3 个 tab：聊天/词库/设置（v0.4 移除通讯录） |
| 00.4.1 | `tab-item` | 导航项（模板） | `.tab-item` | 链接跳转，含 SVG 图标 + 文字 |
| 00.4.1.a | `.active` | 选中态 | `.tab-item.active` | 当前页高亮绿色 |
| 00.4.2 | `tab-badge` | 导航未读角标 | `#navChatBadge` / `.tab-badge` | 汇总所有会话未读数；带导航的 4 页都显示 |

---

### 模块 01 —— 首页 会话列表（index.html）

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 01.1 | `addBtn` | 新建按钮 | `#addBtn` | 右上角 ＋，跳 `new.html` |
| 01.2 | `sessionList` | 会话列表容器 | `#sessionList` | JS 渲染所有会话卡片 |
| 01.3 | `session` | 会话卡片（模板） | `.session` | 整卡：删除层 + 主体，`overflow:hidden` |
| 01.3.a | `.open` | 删除层露出态 | `.session.open` | 左滑或长按后露出删除按钮 |
| 01.3.1 | `session-del` | 删除按钮层 | `.session-del` | 右侧红色「删除」，点击弹确认 |
| 01.3.2 | `session-main` | 会话主体（模板） | `.session-main` | 头像 + 信息 + 时间/未读；点击进聊天 |
| 01.3.2.1 | `session-info` | 会话信息区 | `.session-info` | 名字行 + 预览行 |
| 01.3.2.2 | `session-line` | 名字行 | `.session-line` | 群标签 + 名字 |
| 01.3.2.2.1 | `session-name` | 会话名字 | `.session-name` | 角色名或群名 |
| 01.3.2.2.2 | `session-tag` | 群聊标签 | `.session-tag.group` | 橙色「群」小标签 |
| 01.3.2.2.2.a | `session-tag.pin` | 置顶标签 | `.session-tag.pin` | 绿色「置顶」小标签（会话设置 pinned 时显示） |
| 01.3.2.3 | `session-preview` | 最新消息预览 | `.session-preview` | 单行省略；表情包 [表情包] / 红包 [红包] / 问卷 [问卷] / 分享 [分享链接] |
| 01.3.3 | `session-meta` | 右侧元信息 | `.session-meta` | 时间 + 未读红点 |
| 01.3.3.1 | `session-time` | 消息时间 | `.session-time` | 今天 HH:MM / 昨天 / M月D日 |
| 01.3.3.2 | `session-unread` | 未读红点 | `.session-unread.show` | 红色数字圆点 |

---

### 模块 02 —— 新建流程（new / new-char / new-group）

#### 02.1 新建选择页 new.html

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 02.1.1 | `new-picker` | 选择区 | `.new-picker` | 两个大按钮纵向排列 |
| 02.1.2 | `new-opt` | 选项按钮（模板） | `.new-opt` | 大卡片按钮 |
| 02.1.2.1 | `new-opt-icon` | 图标 | `.new-opt-icon` | emoji 图标 |
| 02.1.2.2 | `new-opt-title` | 主标题 | `.new-opt-title` | 「新建角色 / 新建群聊」 |
| 02.1.2.3 | `new-opt-desc` | 说明 | `.new-opt-desc` | 副标题灰色小字 |
| 02.1.3 | `newCharBtn` | 新建角色按钮 | `#newCharBtn` | 跳 `new-char.html` |
| 02.1.4 | `newGroupBtn` | 新建群聊按钮 | `#newGroupBtn` | 跳 `new-group.html` |

#### 02.2 加好友页（角色资料填写页）new-char.html

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 02.2.1 | `char-form` | 表单区 | `.char-form` | 页面主体表单 |
| 02.2.1.1 | `char-form-row` | 左右分栏行 | `.char-form-row` | 左侧头像 + 右侧表单 |
| 02.2.2 | `char-left` | 左侧头像栏 | `.char-left` | 圆形头像预览框 + 提示文字 |
| 02.2.3 | `avatar-hint` | 头像提示 | `.avatar-hint` | 「点击头像：拍照 / 本地图片上传」 |
| 02.2.4 | `nc-avatar` | 头像框 | `#nc-avatar` | 大圆形头像；点击唤起底部菜单（仅拍照/上传） |
| 02.2.5 | `char-right` | 右侧表单栏 | `.char-right` | 昵称 + URL 输入 |
| 02.2.6 | `nc-name` | 昵称输入 | `#nc-name` | **必填**，最长 12 字 |
| 02.2.7 | `nc-url` | 图片 URL 输入 | `#nc-url` | 粘贴链接**防抖实时解析**，有效→左侧预览更新；无效→弹错误提示且不更新 |
| 02.2.8 | `nc-close` | 红色叉号 | `#nc-close` | 右上角 × ，关闭页面回 index.html |
| 02.2.9 | `nc-save` | 添加梦角按钮 | `#nc-save` | 校验昵称 → 创建角色 → 进聊天页 |

#### 02.3 新建群聊页 new-group.html

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 02.3.1 | `group-form` | 表单区 | `.group-form` | 页面主体表单 |
| 02.3.2 | `ng-name` | 群名输入 | `#ng-name` | 必填，最长 12 字 |
| 02.3.3 | `ng-avatar` | 群头像框 | `#ng-avatar` | 点击唤起底部菜单 |
| 02.3.4 | `ng-count` | 已选角色数 | `#ng-count` | 标签里的数字，实时更新 |
| 02.3.4.a | `ng-total` | 群总人数 | `#ng-total` | **= 已选角色数 + 1（含你本人）** |
| 02.3.5 | `ng-members` | 成员勾选列表 | `#ng-members` | 所有角色，点击勾选/取消 |
| 02.3.6 | `ng-save` | 保存按钮 | `#ng-save` | 校验群名与成员≥1 → 创建 → 进聊天页 |

---

### 模块 02A —— 角色设置页 chat-info.html（私聊右上角 ⋯ 进入）

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 02A.1 | `ci-profile` | 顶部资料卡 | `.ci-profile` | 大头像 + 名字 + 简介居中 |
| 02A.1.1 | `ci-avatar` | 角色头像 | `#ci-avatar` | 圆形大头像 |
| 02A.1.2 | `ci-name` | 角色名字 | `#ci-name` | 页面顶部展示 |
| 02A.1.3 | `ci-bio` | 角色简介 | `#ci-bio` | 一句话介绍 |
| 02A.2 | `ci-list` | 功能列表 | `.ci-list` | 5 行功能选项 |
| 02A.2.1 | `ci-row` | 功能行（模板） | `.ci-row` | `data-act="settings/pin/bg/search/clear"` |
| 02A.2.1.a | `ci-row.danger` | 危险行 | `.ci-row.danger` | 清空聊天记录（红色） |
| 02A.2.1.1 | `ci-label` | 功能名 | `.ci-label` | 左侧文字 |
| 02A.2.1.2 | `ci-bgval` | 背景状态值 | `#ci-bgval` / `.ci-value` | 背景：默认/已设置 |
| 02A.2.1.3 | `ci-arrow` | 右箭头 | `.ci-arrow` | › |
| 02A.2.2 | `ci-pin` | 置顶开关 | `#ci-pin` / `.ci-switch` | 点击切换 `settings.pinned`，开启后首页置顶 |
| 02A.3 | `cbg-*` | 背景弹窗 | `#cbg-preview` / `#cbg-url` / `#cbg-upload` / `#cbg-save` | 上传 / URL 设置聊天背景，URL 防抖实时预览 |
| 02A.4 | `csearch-*` | 查找弹窗 | `#csearch-input` / `#csearch-list` / `.csearch-hit` | 关键词过滤当前会话消息，点击带 focus 跳聊天页定位 |

---

### 模块 02B —— 聊天设置页 chat-settings.html

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 02B.1 | `cs-section` | 设置分组 | `.cs-section` | 白底卡片（回复频率 / 主动消息 / 气泡） |
| 02B.1.1 | `cs-section-title` | 分组标题 | `.cs-section-title` | 灰色小标题 |
| 02B.2 | `cs-row` | 设置行 | `.cs-row` | 行内布局 |
| 02B.2.1 | `cs-row-head` | 行头 | `.cs-row-head` | 标签 + 当前值 |
| 02B.3 | `cs-min` | 最短回复滑块 | `#cs-min` | range 0~2 分钟；与最长联动 |
| 02B.3.a | `cs-min-val` | 最短当前值 | `#cs-min-val` | 显示分钟数 |
| 02B.4 | `cs-max` | 最长回复滑块 | `#cs-max` | range 2~20 分钟 |
| 02B.4.a | `cs-max-val` | 最长当前值 | `#cs-max-val` | 显示分钟数 |
| 02B.5 | `cs-proactive` | 主动发消息开关 | `#cs-proactive` / `.cs-switch` | 开启后角色按间隔主动发消息 |
| 02B.5.1 | `cs-proactive-row` | 间隔输入行 | `#cs-proactive-row` | 关闭时半透明 |
| 02B.5.2 | `cs-proactive-min` | 间隔分钟 | `#cs-proactive-min` | number 1~120 分钟 |
| 02B.6 | `cs-bubble` | 气泡 CSS 输入 | `#cs-bubble` | 粘贴 CSS 链接，防抖 500ms 实时预览 |
| 02B.6.1 | `cs-preview` | 预览区 | `.cs-preview` | 我的/对方两个示例气泡 |
| 02B.6.1.a | `role-b` / `mine-b` | 预览气泡 | `.cs-preview .role-b` / `.mine-b` | 左侧白 / 右侧绿 |
| 02B.6.2 | `bubbleCssPreview` | 预览样式链接 | `#bubbleCssPreview` | 动态注入的 `<link>`（预览用） |
| 02B.7 | `cs-save` | 保存按钮 | `#cs-save` | 保存全部设置到 `session.settings` |

---

### 模块 03 —— 聊天窗口 conversation.html

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 03.0 | `chat` | 聊天窗口容器 | `.chat` | 全屏布局（该页无底部导航） |
| 03.1 | `chat-head` | 聊天头部 | `.chat-head` | 返回 + 头像 + 名字 + 更多 |
| 03.1.1 | `chatAvatar` | 会话头像容器 | `#chatAvatar` | 圆形头像 |
| 03.1.2 | `chat-title` | 标题区 | `.chat-title` | 名字 + 副标题 |
| 03.1.2.1 | `chatName` | 会话名字 | `#chatName` | 角色名或群名 |
| 03.1.2.2 | `chatSub` | 副标题 | `#chatSub` | 角色简介或群人数 |
| 03.1.3 | `chat-more` | 更多按钮 | `.chat-more` | 右上角 ⋯；**私聊点击直接进 chat-info**，群聊弹菜单 |
| 03.1.3.1 | `moreBtn` | 更多按钮元素 | `#moreBtn` | 会话不存在时隐藏 |
| 03.1.4 | `dropdown` | 下拉菜单（通用） | `.dropdown` | 见 G2 |
| 03.1.4.1 | `moreMenu` | 更多菜单容器 | `#moreMenu` | 群聊菜单：编辑群聊、清空、删除 |
| 03.2 | `chat-body` | 消息区 | `.chat-body` | 消息滚动区 |
| 03.2.1 | `chatBody` | 消息区容器 | `#chatBody` | 渲染全部消息 |
| 03.2.2 | `day-divider` | 日期分隔条 | `.day-divider` | 跨天时显示「今天/昨天/M月D日」 |
| 03.2.3 | `msg` | 消息行（模板） | `.msg` | 统一样式气泡，左右区分 |
| 03.2.3.a | `.me` | 我的消息态 | `.msg.me` | 气泡靠右、绿色，头像在右 |
| 03.2.3.b | `.role` | 角色消息态 | `.msg.role` | 气泡靠左、白色，头像在左 |
| 03.2.3.1 | `msg-main` | 消息主体 | `.msg-main` | 发言者名 + 气泡 + 时间 |
| 03.2.3.1.1 | `sender` | 发言者名 | `.sender` | 仅群聊显示角色名 |
| 03.2.3.1.2 | `bubble` | 气泡 | `.bubble` | 文字消息容器；emoji 同文本渲染 |
| 03.2.3.1.2.a | `rp-bubble` | 红包气泡 | `.bubble.rp-bubble` | 红色渐变卡片：金额+祝福语+「开/已领取」；点击看详情 |
| 03.2.3.1.2.b | `sv-bubble` | 问卷气泡 | `.bubble.sv-bubble` | 蓝色渐变卡片：标题+题数+「查看回答/填写问卷」；点击看角色回答 |
| 03.2.3.1.2.c | `sh-bubble` | 分享卡片气泡 | `.bubble.sh-bubble` | 域名+标题+描述；点击打开链接 |
| 03.2.3.1.3 | `msg-img` | 表情包图片 | `.msg-img` | 图片消息，最大宽 150px 防止撑破气泡 |
| 03.2.3.1.4 | `msg-time` | 消息时间 | `.msg-time` | **每条消息下方**显示发送时间 |
| 03.2.3.2 | `call-line` | 通话记录行 | `.call-line` | type=call 居中灰条（视频通话时长） |
| 03.2.3.a2 | `.sys` | 系统消息态 | `.msg.sys` | 通话记录居中、无头像 |
| 03.2.3.b2 | `msg-focus` | 定位高亮态 | `.msg-focus` | 查找记录跳转后闪烁 2.4s |
| 03.2.3.c2 | `has-bg` | 背景态 | `.chat-body.has-bg` | 会话设置 bgImage 时铺背景图 |
| 03.2.4 | `typing-line` | 正在输入行（模板） | `.typing-line` | 角色回复前的三点动画 |
| 03.2.4.1 | `dot` | 动画圆点 | `.dot` | 三个灰点轮流闪烁 |
| 03.3 | `chat-foot` | 输入区 | `.chat-foot` | 扩展按钮 + 输入框 + 发送 |
| 03.3.1 | `chatFoot` | 输入区容器 | `#chatFoot` | 会话不存在时隐藏 |
| 03.3.1.a | `extBtn` | 扩展按钮 | `#extBtn` | 输入框左侧 ＋，点击弹六宫格菜单 |
| 03.3.1.a.1 | `ext-grid` | 扩展菜单网格 | `.ext-grid` | 相册/拍照/视频通话/红包/分享/问卷 2×3 |
| 03.3.1.a.2 | `ext-item` | 扩展项（模板） | `.ext-item` | `data-ext` 标记动作 |
| 03.3.1.a.2.1 | `ext-ico` | 扩展图标 | `.ext-ico` | emoji 图标 |
| 03.3.2 | `msgInput` | 消息输入框 | `#msgInput` | 多行文本框，Enter 发送 / Shift+Enter 换行 |
| 03.3.3 | `sendBtn` | 发送按钮 | `#sendBtn` | 内容为空时禁用 |
| 03.4 | `vcall` | 视频通话层 | `#vcall` / `.vcall` | 全屏模拟通话 overlay |
| 03.4.1 | `vcallPeer` | 对方画面区 | `#vcallPeer` | 背景 + 大头像 + 名字 |
| 03.4.2 | `vcallState` | 通话状态 | `#vcallState` | 正在呼叫… / 已接通 |
| 03.4.3 | `vcallTime` | 通话计时 | `#vcallTime` | 00:00 递增 |
| 03.4.4 | `vcallHangup` | 挂断按钮 | `#vcallHangup` | 红色圆钮；挂断后写入 call 消息 |
| 03.5 | `rp-*` | 红包弹窗 | `#rp-amounts` / `#rp-custom` / `#rp-note` / `#rp-ok` / `.rp-amt-opt` / `.rp-amounts` | 档位金额+自定义+祝福语；发送后角色自动领并回感谢 |
| 03.6 | `sh-*` | 分享弹窗 | `#sh-link` / `#sh-ok` | 粘贴链接/文字；能解析发标题卡片，受限发域名卡片 |
| 03.7 | `svq-*` | 问卷弹窗 | `#svq-title` / `#svq-list` / `#svq-add` / `#svq-ok` / `.svq-item` / `.svq-kind` / `.svq-del` / `.svq-q` / `.svq-opts` | 标题+动态题目（单选/多选/文本）；发送后角色自动填写 |

---

### 模块 04 —— 词库管理页 library.html（本版核心）

#### 04.1 页面骨架

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 04.1.1 | `main-tabs` | 一级 Tab 容器 | `#mainTabs` / `.main-tabs` | 通用词库 / 专属词库 |
| 04.1.1.1 | `main-tab` | 一级 Tab（模板） | `.main-tab` | `data-scope="common"/"per"` |
| 04.1.1.a | `.active` | 选中态 | `.main-tab.active` | 绿色下划线高亮 |
| 04.1.2 | `per-pick` | 专属角色下拉区 | `#perPick` / `.per-pick` | 专属词库时显示 |
| 04.1.2.1 | `perSelect` | 角色下拉 | `#perSelect` | 切换要编辑专属词库的角色 |
| 04.1.3 | `sub-tabs` | 二级 Tab 容器 | `#subTabs` / `.sub-tabs` | 字卡 / Emoji / 表情包 |
| 04.1.3.1 | `sub-tab` | 二级 Tab（模板） | `.sub-tab` | `data-type="text"/"emoji"/"image"` |
| 04.1.3.a | `.active` | 选中态 | `.sub-tab.active` | 绿色胶囊高亮 |
| 04.1.4 | `libBody` | 词库内容区 | `#libBody` | 渲染批量条 + 分组列表 |

#### 04.2 批量操作条

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 04.2.1 | `lib-batch` | 批量操作条 | `.lib-batch` | 全选 + 4 个按钮 |
| 04.2.2 | `checkAll` | 全选复选框 | `#checkAll` | 勾选/取消所有条目 |
| 04.2.3 | `batchAddBtn` | 批量新增按钮 | `#batchAddBtn` | 打开批量新增弹窗 |
| 04.2.3.a | `addGroupBtn` | 新增分组按钮 | `#addGroupBtn` | 打开新增分组弹窗（分组仅用于管理，抽取不受限制） |
| 04.2.4 | `importBtn` | 导入 JSON 按钮 | `#importBtn` | 选文件导入（追加模式） |
| 04.2.5 | `exportBtn` | 导出 JSON 按钮 | `#exportBtn` | 导出带分组结构 JSON |
| 04.2.6 | `delSelBtn` | 删除选中按钮 | `#delSelBtn` | 红色；删除勾选条目 |
| 04.2.7 | `selCount` | 已选数量 | `#selCount` | 删除按钮里的数字 |

#### 04.3 分组与条目

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 04.3.1 | `lib-group` | 分组区块（模板） | `.lib-group` | 一个分组 = 头 + 内容列表 |
| 04.3.1.1 | `lib-group-head` | 分组头 | `.lib-group-head` | 组名 + 工具按钮 |
| 04.3.1.1.1 | `lib-group-name` | 分组名 | `.lib-group-name` | 名字 + 条数 |
| 04.3.1.1.2 | `lib-group-tools` | 分组工具 | `.lib-group-tools` | ＋新增 / 重命名 / 删除分组 |
| 04.3.2 | `lib-item` | 内容条目（模板） | `.lib-item` | 勾选框 + 内容 + 编辑/删除 |
| 04.3.2.a | `.on` | 已勾选态 | `.lib-item.on` | 勾选后高亮 |
| 04.3.2.1 | `item-check` | 条目勾选框 | `.item-check` | 方形勾选框 |
| 04.3.2.2 | `item-content` | 条目内容 | `.item-content` | 字卡文本；`.emoji` 时放大字号 |
| 04.3.2.3 | `item-img` | 表情包缩略图 | `.item-img` | image 类型的图片 |
| 04.3.2.4 | `item-tools` | 条目工具 | `.item-tools` | 编辑 / 删除 |

#### 04.4 词库弹窗元素（动态前缀 id）

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 04.4.1 | `newEntry-*` | 新增输入弹窗 | `#newEntryInput` / `#newEntryOk` | 字卡文本框（多行）或 Emoji 输入框 + 添加 |
| 04.4.2 | `editEntry-*` | 编辑输入弹窗 | `#editEntryInput` / `#editEntryOk` | 修改单条内容 |
| 04.4.3 | `imgUrl-*` | 表情包链接弹窗 | `#imgUrlInput` / `#imgUrlOk` | 粘贴图片链接添加表情包 |
| 04.4.4 | `batch-*` | 批量新增弹窗 | `#batchText` / `#batchJsonBtn` / `#batchOk` | 大文本框或 JSON 文件 |
| 04.4.5 | `groupName-*` | 新增分组弹窗 | `#groupNameInput` / `#groupOk` | 创建分组 |
| 04.4.6 | `groupRename-*` | 重命名弹窗 | `#groupRenameInput` / `#groupRenameOk` | 重命名分组 |
| 04.4.7 | `dup-*` | 重复处理弹窗 | `#dupIgnore` / `#dupOverwrite` | 导入遇重复时选忽略/覆盖 |
| 04.4.8 | `sheet` | 底部动作单 | `.sheet` / `.sheet-item` | 拍照/上传/链接/取消 选项列表 |

---

### 模块 05 —— 设置 settings.html

> v0.4 说明：原「05.1 通讯录 contacts.html」模块已整体移除（文件删除、导航入口删除）；编号 05.1 起改为设置页。

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 05.1 | `set-group` | 设置分组 | `.set-group` | 白底卡片 |
| 05.2 | `set-item` | 设置项 | `.set-item` | `data-act` 标记动作 |
| 05.2.1 | `set-label` | 设置项标题 | `.set-label` | 主文字 |
| 05.2.2 | `set-desc` | 设置项说明 | `.set-desc` | 灰色小字 |
| 05.3 | `exportBtn` | 导出按钮 | `#exportBtn` | 导出备份 JSON |
| 05.4 | `importBtn` | 导入按钮 | `#importBtn` | 触发隐藏文件框 |
| 05.5 | `resetBtn` | 清空按钮 | `#resetBtn` | 危险红色，二次确认 |
| 05.6 | `importFile` | 备份导入选择器 | `#importFile` | 隐藏 JSON 文件选择框 |

---

### 模块 06 —— 弹窗 / Toast / 通用组件（全站）

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 06.1 | `modalRoot` | 弹窗容器 | `#modalRoot` | 所有弹窗挂载点（每页都有） |
| 06.1.1 | `modal-mask` | 遮罩 | `.modal-mask` | 半透明背景 |
| 06.1.2 | `modal` | 弹窗主体 | `.modal` | 白色圆角卡片 |
| 06.1.2.1 | `modal-head` | 弹窗头 | `.modal-head` | 标题 + 关闭 |
| 06.1.2.1.1 | `modal-close` | 关闭按钮 | `.modal-close` | × |
| 06.1.2.2 | `modal-body` | 弹窗内容 | `.modal-body` | 滚动内容 |
| 06.1.2.3 | `modal-foot` | 弹窗底 | `.modal-foot` | 操作按钮 |
| 06.2 | `toast` | 轻提示 | `#toast` | 顶部短暂提示，2 秒消失 |
| 06.3 | `avatar` | 圆形头像组件 | `.avatar` | **统一圆形**；无图显示首字彩色底 |
| 06.3.a | `.online` | 在线点 | `.avatar.online` | 绿色小点 |
| 06.3.b | `avatar-big` | 大头像 | `.avatar-big` | 新建页/编辑页头像框，可点击 |
| 06.4 | `btn` | 普通按钮 | `.btn` | 白底灰边 |
| 06.4.1 | `btn-primary` | 主按钮 | `.btn-primary` | 绿色 |
| 06.4.2 | `btn-danger` | 危险按钮 | `.btn-danger` | 红色描边 |
| 06.4.3 | `btn-block` | 通栏按钮 | `.btn-block` | width:100% |
| 06.5 | `field` | 表单字段 | `.field` | 标签 + 输入 |
| 06.5.1 | `required` | 必填星号 | `.field .required` | 红色 * |
| 06.6 | `member-pick` | 成员勾选区 | `.member-pick` | 角色列表（滚动） |
| 06.6.1 | `member-opt` | 成员选项（模板） | `.member-opt` | 可勾选角色行 |
| 06.6.1.a | `.on` | 已勾选态 | `.member-opt.on` | 高亮 + 打勾 |
| 06.6.1.1 | `mname` | 成员名 | `.mname` | 角色名 |
| 06.6.1.2 | `member-check` | 勾选圆点 | `.member-check` | 圆形勾选框 |
| 06.6.1.2.a | `checkmark` | 对勾 | `.checkmark` | 勾选时显示 ✓ |
| 06.7 | `empty` | 空状态 | `.empty` | 居中灰字引导 |
| 06.8 | `drop-item` | 菜单项 | `.drop-item` | 下拉菜单动作 |
| 06.8.a | `.danger` | 危险菜单项 | `.drop-item.danger` | 红色文字 |

#### 06.9 编辑弹窗动态 id（cf- 角色 / gf- 群）

| 编号 | 命名 | 中文名 | 代码位置 | 职责说明 |
|---|---|---|---|---|
| 06.9.1 | `cf-*` | 角色编辑弹窗 | `#cf-name` / `#cf-avatar` / `#cf-bio` / `#cf-delete` / `#cf-save` | 编辑角色（名字/头像/简介/删除） |
| 06.9.2 | `gf-*` | 群编辑弹窗 | `#gf-name` / `#gf-avatar` / `#gf-members` / `#gf-save` | 编辑群（名字/头像/成员） |

---

### 模块 07 —— 逻辑层（JavaScript，按文件分组）

#### 07.0 —— 公共逻辑 `js/common.js`

**工具函数 Utils**

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.0.1 | `$(sel)` | 选择器快捷 | querySelector 简写 |
| 07.0.2 | `$$(sel)` | 选择器列表 | querySelectorAll 简写 |
| 07.0.3 | `uid()` | 唯一编号 | 时间戳 + 随机数 |
| 07.0.4 | `esc(str)` | 文本转义 | 防 XSS |
| 07.0.5 | `sleep(ms)` | 延时 | Promise 化 setTimeout |
| 07.0.6 | `AVATAR_COLORS` | 头像色板 | 10 色（常量） |
| 07.0.7 | `avatarColor(name)` | 头像底色 | 按名字哈希取色 |
| 07.0.8 | `avatarHTML(...)` | 头像 HTML | 统一生成圆形头像 |
| 07.0.9 | `fmtTime(ts)` | 消息时间 | 今天 HH:MM / 昨天 / M月D日 |
| 07.0.10 | `fmtListTime(ts)` | 列表时间 | 今天 HH:MM / 昨天 / M月D日 |
| 07.0.11 | `fmtDay(ts)` | 日期分隔 | 今天 / 昨天 / M月D日 |
| 07.0.12 | `toast(msg)` | 轻提示 | 2 秒自动消失 |
| 07.0.13 | `compressImage(file, max)` | 压缩图片 | 保留兼容（头像用 readImageFile） |
| 07.0.14 | `readImageFile(file, max)` | 图片读取压缩 | File → 压缩 dataURL（头像 256 / 表情包 512） |
| 07.0.15 | `checkImageUrl(url)` | URL 图片校验 | 能加载才算有效，失败返回 false |
| 07.0.15.a | `fileInput(accept, onChange, capture)` | 统一文件选择框 | 挂载到 DOM 后触发，支持拍照 capture；图片/JSON 文件选择统一走这里 |
| 07.0.16 | `renderNavBadge()` | 导航未读角标 | 汇总未读数显示在 00.4.2 |

**存储与配置**

| 编号 | 命名 | 中文名 | 说明 |
|---|---|---|---|
| 07.0.17 | `STORAGE_KEY` | 存储键 | `shiguang_chat_v1` |
| 07.0.18 | `FALLBACK_REPLIES` | 兜底回复 | 词库为空时的默认回复（常量） |
| 07.0.19 | `LIB_TYPES` | 词库类型 | `["text","emoji","image"]`（常量） |
| 07.0.20 | `LIB_TYPE_NAMES` | 类型中文名 | `{text:"字卡",emoji:"Emoji",image:"表情包"}`（常量） |
| 07.0.21 | `DEFAULT_GROUP` | 默认分组 | `"默认分组"`（常量） |
| 07.0.22 | `defaultData()` | 默认数据 | v3 结构：角色 + 通用词库 + 示例角色专属词库 |
| 07.0.22.a | `defaultSettings()` | 默认会话设置 | `{pinned, bgImage, minReplyMin:0, maxReplyMin:2, proactive, proactiveMin:2, bubbleCss}` |
| 07.0.22.b | `REDPACKET_THANKS` | 红包感谢池 | 角色收红包后的随机感谢语（常量） |
| 07.0.22.c | `SURVEY_TEXT_ANSWERS` | 问卷文本回答池 | 问卷文本题的角色随机回答（常量） |

**数据层 Store**

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.0.23 | `Store.load()` | 读取数据 | 读 localStorage，损坏则回默认 |
| 07.0.24 | `Store.migrate(data)` | 旧数据迁移 | v1→v2（replies→专属词库）；v2→v3（会话补 settings + lastProactiveAt） |
| 07.0.25 | `Store.save()` | 保存数据 | 写回 localStorage，空间不足弹提示 |
| 07.0.26 | `Store.reset()` | 清空 | 回默认数据并清回复队列 |
| 07.0.27 | `Store.exportJson()` | 导出备份 | 下载 shiguang-backup.json |
| 07.0.28 | `Store.importJson(file, onDone)` | 导入备份 | 校验 + 迁移 + 恢复 |

**词库系统 Lib（07.5）**

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.0.29 | `Lib.perLib(charId)` | 专属词库容器 | 不存在则初始化空结构 |
| 07.0.30 | `Lib.groupNames(type, charId)` | 分组名列表 | common 或专属的该类型分组 |
| 07.0.31 | `Lib.entries(type, group, charId)` | 条目列表 | 指定分组内容数组 |
| 07.0.32 | `Lib.addEntry(...)` | 新增单条 | 去重后追加 |
| 07.0.33 | `Lib.updateEntry(...)` | 编辑单条 | 替换内容 |
| 07.0.34 | `Lib.removeEntry(...)` | 删除单条 | 按索引移除 |
| 07.0.35 | `Lib.removeEntries(type, group, indexes, charId)` | 批量删除 | 按索引集合移除 |
| 07.0.36 | `Lib.addGroup(type, name, charId)` | 新增分组 | 空分组 |
| 07.0.37 | `Lib.renameGroup(...)` | 重命名分组 | 保留内容 |
| 07.0.38 | `Lib.removeGroup(...)` | 删除分组 | 连同内容删除 |
| 07.0.39 | `Lib.draw(charId)` | **混合随机抽取** | 通用+专属合并，字卡/Emoji/表情包无优先级，随机一条 `{type, content}` |
| 07.0.40 | `Lib.importJson(charId, type, json)` | JSON 解析导入 | 返回 `{added, dup, groups}` 或 `{error}`；支持纯数组 / 分组对象 / 分组数组 |
| 07.0.41 | `Lib.applyImport(result, overwrite)` | 应用导入 | 追加新增；overwrite 覆盖重复 / false 忽略 |
| 07.0.42 | `Lib.exportJson(type, charId)` | 导出词库 | 带分组结构 JSON 下载 |

**回复调度 ReplyQueue**

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.0.43 | `ReplyQueue.schedule(sid, from, msgId, replyContent?)` | 安排回复 | 入队 + 持久化 + 立即处理；`replyContent` 传入时角色回复固定文本（红包感谢/通话收尾） |
| 07.0.44 | `ReplyQueue.pickSpeaker(session)` | 群聊选发言者 | 随机选 ≠ 上次发言者（成员≥2） |
| 07.0.45 | `ReplyQueue.pump(sid)` | 处理队列 | typing → **按会话设置的最短~最长回复时间随机延迟**（默认 0.9~1.8s）→ Lib.draw 或 replyContent → 写入消息（红包标记已领取）→ sg:reply |
| 07.0.46 | `ReplyQueue.restore()` | 恢复队列 | 页面加载时接管未完成任务 |
| 07.0.47 | `ReplyQueue.persist()` | 持久化 | 剩余任务写 pendingReplies |
| 07.0.48 | `ReplyQueue.cancel(sid)` | 取消 | 会话删除/清空时中止 |

**交互 Actions**

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.0.49 | `Actions.deleteSession(sid)` | 删除会话 | 移除 + 取消回复 |
| 07.0.50 | `Actions.clearMessages(sid)` | 清空聊天 | 清消息 + 取消回复 |
| 07.0.51 | `Actions.sendMessage(sid, text)` | 发送文本 | 上屏 + 私聊/群聊调度回复（复用 sendMessageEx） |
| 07.0.51.a | `Actions.sendMessageEx(sid, msg)` | 通用发送 | push 任意类型消息（text/image/share/survey…）并触发角色回复 |
| 07.0.51.b | `Actions.sendMedia(sid, dataURL)` | 发送图片 | 相册/拍照压缩后作为 image 消息发送，触发角色回复 |
| 07.0.52 | `Actions.createCharacter(data)` | 新建角色 | 初始化专属词库 |
| 07.0.53 | `Actions.updateCharacter(id, data)` | 编辑角色 | 名字/头像/简介 |
| 07.0.54 | `Actions.deleteCharacter(id)` | 删除角色 | 连带清理会话、群成员、专属词库 |
| 07.0.55 | `Actions.createGroup(data)` | 新建群 | 校验成员 ≥1 |
| 07.0.56 | `Actions.updateGroup(id, data)` | 编辑群 | 名字/头像/成员 |
| 07.0.57 | `Actions.deleteGroup(id)` | 删除群 | 连带清理群会话 |

**弹窗与头像**

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.0.58 | `Modal.open(html)` | 打开弹窗 | 挂载 + 遮罩关闭 |
| 07.0.59 | `Modal.close()` | 关闭弹窗 | 清空 |
| 07.0.60 | `Modal.confirm(title, text, onOk)` | 确认弹窗 | 危险操作二次确认 |
| 07.0.61 | `bindAvatarPicker(prefix, max, menuItems)` | 头像选择器 | **点击头像唤起底部菜单**；`menuItems` 控制菜单项子集（默认 拍照/上传/链接）；返回 getAvatar/setAvatar |
| 07.0.62 | `openCardModal(charId)` | 编辑角色弹窗 | 名字/头像/简介/删除 |
| 07.0.63 | `openGroupModal(groupId)` | 编辑群弹窗 | 名字/头像/成员 |

**辅助函数**

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.0.64 | `getChar(id)` | 查角色 | undefined 表示不存在 |
| 07.0.65 | `getGroup(id)` | 查群 | undefined 表示不存在 |
| 07.0.66 | `getSessionId(type, peerId)` | 会话 id | `dm-x` / `group-x` |
| 07.0.67 | `ensureSession(type, peerId)` | 确保会话 | 没有则创建（含 settings + lastProactiveAt） |
| 07.0.68 | `sessionDisplayName(s)` | 会话展示名 | 已删除显示「已删除角色/群」 |
| 07.0.69 | `sessionDisplayAvatar(s)` | 会话头像 | 同上取头像 |
| 07.0.70 | `ProactiveScheduler.start()` | 启动主动调度 | 每 15s 检查；开启 proactive 的私聊会话按间隔主动发消息（带 1.2s 输入动画） |
| 07.0.71 | `ProactiveScheduler.tick()` | 主动检查 | 距 lastProactiveAt ≥ proactiveMin 分钟 → Lib.draw 主动发一条 |

#### 07.1 —— 聊天主页 `js/index.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.1.1 | `Render.render()` | 刷新 | 会话列表 + 未读角标 |
| 07.1.2 | `Render.renderSessionList()` | 渲染会话列表 | **置顶会话排前**，其余按 updatedAt 倒序；预览支持全部消息类型；未读红点 |
| 07.1.2.a | `sessionPreviewText(s)` | 会话预览文本 | image→[表情包] / redpacket→[红包] / survey→[问卷] / share→[分享链接] / call→时长 |
| 07.1.3 | `bindSwipe()` | 左滑/长按手势 | touchstart/move/end + mouse；左滑或长按 500ms 露出删除层 |
| 07.1.4 | `closeOthers()` | 关闭其它删除层 | 同一时间只露出一个 |
| 07.1.5 | `bindClicks()` | 点击绑定 | ＋下拉菜单 / 删除确认 / 点卡进聊天 |
| 07.1.6 | `init()` | 初始化 | 加载、恢复队列、渲染、绑事件 |

#### 07.2 —— 新建选择 `js/new.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.2.1 | `init()` | 初始化 | 两个按钮跳转 |

#### 07.3 —— 新建角色 `js/new-char.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.3.1 | `init()` | 初始化 | 头像选择 + 保存创建并进聊天 |

#### 07.4 —— 新建群聊 `js/new-group.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.4.1 | `init()` | 初始化 | 头像 + 成员勾选计数 + 保存创建并进聊天 |

#### 07.5 —— 聊天窗口 `js/conversation.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.5.1 | `SID` / `FOCUS_ID` | 当前会话 / 定位消息 | URL `?sid=` / `?focus=` 解析 |
| 07.5.2 | `Render.render()` | 刷新 | 渲染聊天 + 未读角标 |
| 07.5.3 | `Render.buildMsgHTML(msg, session, isGroup)` | 生成消息 HTML | 统一气泡；**文本/emoji/image/红包/问卷/分享/通话** 全部类型；时间在消息下方；群聊显示发言者名；带 data-mid |
| 07.5.4 | `Render.renderChat()` | 渲染聊天 | 背景图（settings.bgImage）+ 全消息 + 日期分隔 + **focus 定位高亮** + 滚动到底 |
| 07.5.5 | `Render.renderTyping(on)` | 输入指示 | 显示/隐藏三点 |
| 07.5.6 | `updateSendBtn()` | 发送按钮状态 | 空内容禁用 |
| 07.5.7 | `onSendClick()` | 发送 | Enter 或点击 |
| 07.5.8 | `openExtMenu()` | 扩展菜单 | 六宫格：相册/拍照/视频通话/红包/分享/问卷 |
| 07.5.9 | `pickMedia(capture)` | 相册/拍照 | 压缩后 sendMedia 发送图片 |
| 07.5.10 | `startVideoCall()` | 视频通话 | 全屏模拟：呼叫→接通→计时；仅私聊 |
| 07.5.11 | `hangupVideoCall()` | 挂断 | 写 call 消息 + 角色补一句词库回复 |
| 07.5.12 | `openRedpacketModal()` | 发红包弹窗 | 档位/自定义金额 + 祝福语 → 发送并调度角色感谢 |
| 07.5.13 | `openRedpacketDetail(msg)` | 红包详情 | 金额 + 已领取状态 |
| 07.5.14 | `parseShareUrl(url)` | 链接解析 | fetch 标题/描述；受限返回 null |
| 07.5.15 | `openShareModal()` | 分享弹窗 | 链接→尽力解析发卡片；文字→直接发 |
| 07.5.16 | `randomSurveyAnswer(q)` | 问卷随机回答 | 单选选一项 / 多选 1~2 项 / 文本走回答池 |
| 07.5.17 | `openSurveyModal()` | 创建问卷弹窗 | 标题 + 动态题目增删（单选/多选/文本）→ 发送，角色自动填 |
| 07.5.18 | `openSurveyDetail(msg)` | 问卷详情 | 查看角色回答 |
| 07.5.19 | `openMoreMenu()` | 群聊更多菜单 | 编辑群聊、清空、删除（私聊不再走此菜单） |
| 07.5.20 | `onMoreMenuClick(e)` | 菜单点击 | 执行动作 |
| 07.5.21 | `init()` | 初始化 | 清未读、气泡 CSS 注入、背景、扩展按钮、右上角分支、事件绑定 |

#### 07.6 —— 词库管理 `js/library.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.6.1 | `LibView` | 视图状态 | `{scope, type, charId}` |
| 07.6.2 | `bindTabs()` | Tab 绑定 | 一级/二级切换 + 角色下拉 |
| 07.6.3 | `fillPerSelect()` | 填充角色下拉 | 专属词库可选角色 |
| 07.6.4 | `Render.renderLib()` | 渲染词库 | 批量条 + 分组 + 条目 |
| 07.6.5 | `openAddEntry(group)` | 新增单条 | 字卡文本/emoji 输入；表情包上传或 URL（校验失败提示） |
| 07.6.6 | `openEditEntry(group, idx)` | 编辑单条 | 修改内容 |
| 07.6.7 | `openBatchAdd()` | 批量新增 | 大文本框 或 JSON 文件 |
| 07.6.8 | `importConfirm(result)` | 重复处理弹窗 | 【忽略重复】【覆盖】二选一 |
| 07.6.9 | `delSelected()` | 批量删除 | 勾选条目一键删除 |
| 07.6.10 | `addGroup()` / `renameGroup(g)` / `deleteGroup(g)` | 分组管理 | 新增/重命名/删除分组 |
| 07.6.11 | `importJsonFile()` | 导入 JSON | 追加模式，格式错误提示且不改动原词库 |
| 07.6.12 | `bindLibBody()` | 列表交互绑定 | 勾选/全选/删除/编辑/分组工具 |
| 07.6.13 | `updateSelCount()` | 更新选中数 | 删除按钮计数 + 全选状态 |
| 07.6.14 | `init()` | 初始化 | 加载、填下拉、渲染、绑事件 |

#### 07.7 —— 通讯录 `js/contacts.js`（已移除）

> v0.4 已删除：`js/contacts.js`、`css/contacts.css`、`HTML/contacts.html` 随通讯录模块一并移除（原 07.7.1 Render.renderContacts / 07.7.2 init 不再存在）。

#### 07.8 —— 设置 `js/settings.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.8.1 | `init()` | 初始化 | 导出/导入/清空（清空二次确认后回首页） |

#### 07.9 —— 角色设置 `js/chat-info.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.9.1 | `init()` | 初始化 | 资料展示 + 5 行功能绑定 |
| 07.9.2 | `openBgModal(session, st)` | 背景弹窗 | 上传/URL 设置 bgImage，防抖实时预览 |
| 07.9.3 | `openSearchModal(session)` | 查找弹窗 | 关键词过滤 → 点击带 focus 跳聊天页定位 |

#### 07.10 —— 聊天设置 `js/chat-settings.js`

| 编号 | 函数 | 中文名 | 职责说明 |
|---|---|---|---|
| 07.10.1 | `init()` | 初始化 | 滑块/开关/气泡预览加载当前设置 |
| 07.10.2 | `applyBubbleCss(url)` | 气泡预览 | 动态注入 `#bubbleCssPreview` 样式链接 |

---

### 模块 08 —— 数据模型（v3，字段命名）

#### 08.1 角色 `character`

| 编号 | 字段 | 中文名 | 说明 |
|---|---|---|---|
| 08.1.1 | `id` | 唯一编号 | 自动生成 |
| 08.1.2 | `name` | 名字 | 显示在头像旁 |
| 08.1.3 | `avatar` | 头像 | 默认/本地 base64/URL 链接 |
| 08.1.4 | `bio` | 简介 | 一句话介绍 |

> 注：v1 的 `replies` 字段已废弃（deprecated），迁移到专属词库（见 Store.migrate）。

#### 08.2 群聊 `group`

| 编号 | 字段 | 中文名 | 说明 |
|---|---|---|---|
| 08.2.1 | `id` | 唯一编号 | 自动生成 |
| 08.2.2 | `name` | 群名 | |
| 08.2.3 | `avatar` | 群头像 | |
| 08.2.4 | `memberIds` | 群成员 | 角色 id 数组 |

#### 08.3 会话 `session`

| 编号 | 字段 | 中文名 | 说明 |
|---|---|---|---|
| 08.3.1 | `id` | 会话编号 | `dm-x` / `group-x` |
| 08.3.2 | `type` | 类型 | `dm` / `group` |
| 08.3.3 | `peerId` | 对方编号 | |
| 08.3.4 | `messages` | 消息列表 | |
| 08.3.5 | `updatedAt` | 最后活跃 | 毫秒时间戳 |
| 08.3.6 | `unread` | 未读数 | 打开会话清零 |
| 08.3.7 | `settings` | 会话设置 | v3 新增，见 08.6；缺失时用 defaultSettings() 补 |
| 08.3.8 | `lastProactiveAt` | 上次主动消息时间 | 主动发消息调度用；0=未开始 |

#### 08.4 消息 `message`（v3 扩展类型）

| 编号 | 字段 | 中文名 | 说明 |
|---|---|---|---|
| 08.4.1 | `id` | 消息编号 | |
| 08.4.2 | `from` | 发送方 | `me` 或角色 id |
| 08.4.3 | `type` | 消息类型 | `text` / `emoji` / `image` / `redpacket` / `survey` / `share` / `call` |
| 08.4.4 | `content` | 内容 | 文本/emoji；image=图片地址；redpacket=`{amount,note,opened}`；survey=`{title,questions,done}`；share=`{url,domain,title,desc}`；call=时长文本 |
| 08.4.5 | `image` | 图片地址 | 仅 type=image 冗余字段 |
| 08.4.6 | `ts` | 时间 | 毫秒时间戳 |

#### 08.4a 会话设置 `session.settings`（v3 新增）

| 编号 | 字段 | 中文名 | 说明 |
|---|---|---|---|
| 08.4a.1 | `pinned` | 置顶 | true 时首页会话排最前 |
| 08.4a.2 | `bgImage` | 聊天背景 | 空=默认；本地 dataURL 或 URL |
| 08.4a.3 | `minReplyMin` | 最短回复 | 0~2 分钟 |
| 08.4a.4 | `maxReplyMin` | 最长回复 | 2~20 分钟 |
| 08.4a.4.a | `replyConfigured` | 回复频率已配置 | 默认 false（回复保持秒级快速）；在聊天设置保存过一次后为 true（回复按滑块区间随机） |
| 08.4a.5 | `proactive` | 主动发消息 | 开启后角色按间隔主动发 |
| 08.4a.6 | `proactiveMin` | 主动间隔 | 1~120 分钟 |
| 08.4a.7 | `bubbleCss` | 气泡 CSS 链接 | 聊天页动态注入样式 |

#### 08.5 词库 `library`（v2 新增，核心）

| 编号 | 字段 | 中文名 | 说明 |
|---|---|---|---|
| 08.5.1 | `library.common` | 通用词库 | `{text:{分组:[...]}, emoji:{...}, image:{...}}` |
| 08.5.2 | `library.per` | 专属词库 | `{角色id: {text:{...}, emoji:{...}, image:{...}}}` |
| 08.5.3 | `pendingReplies` | 待回复任务 | 键=会话id，值=任务数组；页面加载 restore() 接管 |

---

### 模块 09 —— 存储与配置

| 编号 | 命名 | 中文名 | 说明 |
|---|---|---|---|
| 09.1 | `shiguang_chat_v1` | 存储键 | localStorage 唯一键 |
| 09.2 | `shiguang-backup.json` | 备份文件名 | 设置页导出 |
| 09.3 | `lyrics-*.json` | 词库导出文件名 | 词库页导出：`lyrics-common-text.json` 等 |
| 09.4 | 示例角色「拾光」 | 首次数据 | 含通用词库示例 + 专属词库示例 |

---

## 5. 变更记录

| 日期 | 变更内容 | 操作人 |
|---|---|---|
| 2026-10-17 | 建立命名清单 v0.1（基础版） | 豆包 |
| 2026-10-17 | 升级为分级代码地图 v1.0：AI 协作规则、分级编号、逐元素对照 | 豆包 |
| 2026-10-17 | 拆多文件结构；登记函数/元素/常量 | 豆包 |
| 2026-10-17 | 修复搜索失效 bug；新增删除字卡；补登弹窗 id | 豆包 |
| 2026-10-17 | **v2.0 多页面重构**：4 独立页面 + common；回复队列跨页持久化；R9-R11 | 豆包 |
| 2026-10-17 | **v3.0 模拟小手机 + 词库系统**：8 页面（新增 new/new-char/new-group/library）；手机框架（00）；词库管理模块（04）；数据模型 v2（消息 type、library 词库、replies 废弃）；头像改圆形 + 拍照；左滑/长按删除；新增 R12-R13 | 豆包 |
| 2026-10-17 | **v3.1 加号菜单 + 资料填写页**：首页 ＋ 改为右上角白色圆角下拉菜单（00.2.5 创建群聊/加好友，点外关闭）；new-char 改左右分栏（00.2.4 红叉、02.2 左侧头像+右侧昵称/URL 实时预览、底部「添加梦角」）；头像菜单支持子集参数（07.0.61 menuItems）；new-group 返回改回首页；new.html 不再有入口（保留备用） | 豆包 |
| 2026-10-18 | **v4.0 聊天设置 + 扩展功能**：① 私聊右上角 ⋯ 改为进入角色设置页（chat-info：聊天设置/置顶/背景/查找记录/清空）；② 聊天设置页（chat-settings：回复频率滑块 0~2/2~20 分钟联动、主动发消息开关+自定义间隔、气泡 CSS 链接实时预览）；③ 输入框扩展按钮六宫格（相册/拍照/视频通话模拟界面/红包/分享尽力解析/问卷角色自动填写）；④ 新增消息类型 redpacket/survey/share/call；⑤ 置顶排序（首页置顶标签）；⑥ 群人数含本人（ng-total）；⑦ **删除通讯录模块**（contacts 三件套删除、底部导航 3 tab）；⑧ 数据模型 v3（session.settings + lastProactiveAt）；⑨ 新增模块 02A/02B、07.9/07.10 | 豆包 |
