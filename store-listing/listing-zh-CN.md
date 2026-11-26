# Chrome Web Store 文案（中文，简体）

以下内容可直接复制到 Chrome Web Store Developer Dashboard。字段名称以后台实际显示为准。

## 商品名称

```text
PassForge 密码工坊
```

## 简短说明（manifest description）

```text
批量生成高强度随机密码，只在本地运行。一键复制、填入网页，或在密码框上右键直接生成。
```

## 详细说明

```text
注册密码，不再问 AI。

PassForge 是一个本地优先的密码生成器。打开插件就得到 10 个 12 位候选密码，大小写字母、数字和符号齐全；长度、数量和字符类型都可以按网站要求调整。

主要功能
• 批量候选：默认一次 10 个 × 12 位；数量可调 1–20，长度可调 8–64
• 字符类型：大写、小写、数字、符号分别开关，至少保留一种
• 兼容性保证：每个密码都包含每种已选类型至少一个；可排除 0 O 1 l I
• 一键复制：点击任意候选复制，或使用「全部复制」按行导出
• 填入网页：把所选密码写入当前页密码框，并同步确认密码框
• 右键生成：在密码框上右键 →「自动生成密码」，按当前设置生成并填入
• 快捷键：Alt+Shift+P 打开弹窗；弹窗内按 R 重新生成

隐私与安全
• 使用浏览器加密随机源 crypto.getRandomValues() 在本地生成，无网络请求、无远程代码、无分析或广告
• 不保存密码；只在本机 chrome.storage.local 保存生成设置
• 没有全站访问权限或常驻内容脚本；只有你点击「填入」或右键菜单项时，才临时访问当前标签页
• 密码只在你主动点击复制时写入系统剪贴板
• 源码公开：https://github.com/BrathonBai/passforge

说明：Chrome 原生右键菜单只能按“可编辑区域”过滤，因此普通文本框上也会出现「自动生成密码」；PassForge 只会填入当前聚焦的密码框，不会误填普通输入框。

PassForge 与 Google 无关联。
```

## 类别

```text
工具（Tools）
```

## 语言

```text
中文（简体）
```

## 链接

| 字段 | 内容 |
| --- | --- |
| 官网 / Homepage URL | `https://github.com/BrathonBai/passforge` |
| 支持 / Support URL | `https://github.com/BrathonBai/passforge/issues` |
| 隐私政策 / Privacy policy URL | `https://github.com/BrathonBai/passforge/blob/main/PRIVACY.md` |
| 测试表单（本地文件） | `docs/test-form.html`；审核时使用任意含密码框的页面即可 |
| 源代码 | `https://github.com/BrathonBai/passforge` |

## 图片

| 字段 | 文件 | 说明 |
| --- | --- | --- |
| 商店图标（128×128） | `store-listing/icon-128.png` | 96×96 图形 + 透明留白 |
| 截图 1（1280×800） | `store-listing/screenshot-1.png` | 批量生成弹窗 |
| 截图 2（1280×800） | `store-listing/screenshot-2.png` | 右键生成后的填入效果 |
| 小宣传图（440×280） | `store-listing/small-promo-440x280.png` | 品牌图 |
| 大宣传图（1400×560，可选） | `store-listing/marquee-1400x560.png` | 品牌图 |

截图顺序：先上传 screenshot-1，再上传 screenshot-2。图片应为全出血、方角；本目录中的文件已经按此规格生成。

## 其他字段

- 成熟内容：否
- 官方 URL：不填写（除非用 Search Console 验证了站点）
- YouTube 视频：不填写
- 付费：否，免费提供
- 地区：所有地区（或按需调整）
- 可见性：Public

## 审核沟通补充（如被询问）

```text
PassForge generates passwords locally with crypto.getRandomValues(). It has no network
code, no analytics, no remote code, no host permissions and no persistent content scripts.

The activeTab permission is used only after an explicit user click on "填入" or on the
"自动生成密码" context-menu item, to inject a self-contained helper into that tab and write
the generated password into the focused password field. The storage permission stores only
generation preferences (length, count, character classes, ambiguity filter) in
chrome.storage.local; it never stores passwords. clipboardWrite is used only when the user
clicks Copy or Copy All. contextMenus registers exactly one menu item.

Passwords are never transmitted or retained. The privacy policy is available at
https://github.com/BrathonBai/passforge/blob/main/PRIVACY.md and the source code is at
https://github.com/BrathonBai/passforge.
```
