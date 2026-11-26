# Chrome Web Store 发布指南

状态：**1.1.0 上架材料已准备，尚未提交。** 提交动作需要发布者本人的 Google 开发者账号、$5 一次性注册费和 2FA，无法由代码代劳。

时间基准：2026-11-26。Chrome Web Store 的界面和字段可能变化，以开发者后台实际显示为准。

## 需要准备的东西

1. 一个长期使用的 Google 账号（注册后开发者邮箱不可更改）。
2. Chrome Web Store 开发者注册（一次性 **US$5**，支持地区包括中国大陆）。
3. 为这个 Google 账号开启 **2-Step Verification**；未开启不能发布或更新扩展。
4. 发布者名称（会显示为 “Offered by:”）和已验证的联系邮箱。
5. 本目录中的 ZIP 和图片。

官方文档：

- [注册开发者账号](https://developer.chrome.com/docs/webstore/register)
- [账号设置与 2FA](https://developer.chrome.com/docs/webstore/set-up-account)
- [发布流程](https://developer.chrome.com/docs/webstore/publish)
- [商店信息字段](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [图片要求](https://developer.chrome.com/docs/webstore/images)
- [审核流程](https://developer.chrome.com/docs/webstore/review-process)
- [2FA 政策](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification)

## 本次提交使用的文件

| 用途 | 文件 | 规格 |
| --- | --- | --- |
| 上传包 | `dist/passforge-1.1.0.zip` | 仅运行时文件，manifest 在 ZIP 根目录 |
| 商店图标 | `store-listing/icon-128.png` | 128×128 PNG，96×96 图形 + 透明留白 |
| 截图 1 | `store-listing/screenshot-1.png` | 1280×800 PNG |
| 截图 2 | `store-listing/screenshot-2.png` | 1280×800 PNG |
| 小宣传图 | `store-listing/small-promo-440x280.png` | 440×280 PNG |
| 大宣传图（可选） | `store-listing/marquee-1400x560.png` | 1400×560 PNG |

重新生成上传包：

```bash
npm run package
```

## 提交步骤

### 1. 注册并设置开发者账号

访问 <https://chrome.google.com/webstore/devconsole>，使用长期持有的 Google 账号登录。首次进入会要求：

- 同意开发者协议和计划政策
- 支付一次性 **US$5** 注册费
- 填写发布者名称和联系邮箱
- 验证联系邮箱
- 开启 Google 账号的两步验证

> 开发者邮箱注册后不能修改。$5 费用和审核时长以页面实际显示为准。

### 2. 上传 ZIP

在开发者后台点击 **Add new item**（添加新项），选择：

```text
passforge-extension/dist/passforge-1.1.0.zip
```

确认 manifest 和 ZIP 有效后，进入条目编辑页。不要上传包含 `README.md`、测试或商店截图的开发目录 ZIP；本项目的 `npm run package` 已经只打包运行时文件。

### 3. 填写 Store listing

直接使用 [`listing-zh-CN.md`](listing-zh-CN.md) 中的文案和图片说明：

- 名称：**PassForge 密码工坊**
- 简短说明（manifest 描述）：批量生成高强度随机密码，只在本地运行。一键复制、填入网页，或在密码框上右键直接生成。
- 详细说明：复制 `listing-zh-CN.md` 的「详细说明」段落
- 类别：工具（Tools）
- 语言：中文（简体）
- 官网：<https://brathonbai.github.io/passforge/>
- 支持：<https://github.com/BrathonBai/passforge/issues>
- 隐私政策：<https://brathonbai.github.io/passforge/privacy.html>
- 商店图标：`store-listing/icon-128.png`
- 截图：先上传 `screenshot-1.png`，再上传 `screenshot-2.png`
- 小宣传图：`store-listing/small-promo-440x280.png`
- 大宣传图（可选）：`store-listing/marquee-1400x560.png`
- 成熟内容：否
- YouTube 视频：留空

### 4. 填写 Privacy practices

使用 [`privacy-answers.md`](privacy-answers.md) 中的建议文本。核心要点：

- **单一用途**：在本地生成强随机密码，并根据用户操作复制或填入密码框。
- **权限理由**：`activeTab`、`scripting`、`contextMenus`、`storage`、`clipboardWrite` 逐项说明。
- **远程代码**：选择 **No, I am not using remote code**。
- **数据使用**：本扩展在本地处理密码（authentication information），但不收集、不上传、不保存、不出售、不共享。由于 Chrome 的用户数据 FAQ 明确要求披露本地处理，建议在数据类别中选择 **Authentication information**，并用说明文本框解释“仅本地、用户主动触发、无传输、无保留”。请以后台实际字段和说明为准，务必与隐私政策一致。
- **隐私政策 URL**：<https://brathonbai.github.io/passforge/privacy.html>
- **Limited Use**：勾选遵守 Chrome Web Store User Data Policy 的相关声明。

### 5. Distribution

- 免费
- Public
- 所有地区（或按需排除）
- 如后台出现 EU DSA 的 trader / non-trader 声明，根据你的实际身份选择；这是一个免费、无内购的工具。不要为了省事随意填写，必要时咨询专业人士。

### 6. Test instructions（可选但有帮助）

可以直接填：

```text
No account, login, or payment is required.

1. Install PassForge 1.1.0.
2. Click the toolbar icon. Ten candidate passwords are generated immediately.
3. Click any password row to copy it. Click "填入" to fill the password field on the current page.
4. To test the context-menu flow, open https://brathonbai.github.io/passforge/test-form.html
   and right-click the 密码 input. Choose "自动生成密码". The password and confirmation
   field should both be filled, with a confirmation toast at the bottom.
5. No test credentials are needed. The test form does not submit or store data.
```

公开测试页已放在仓库 `docs/test-form.html`，不会提交或保存输入。

### 7. 提交审核

点击 **Submit for review**（提交审核）。可以选择审核通过后自动发布，或使用 deferred publishing 手动发布。

- 官方说明：多数扩展在几天内完成审核，也可能需要几周。
- 审核期间不要上传新版本；如需修改，可使用 cancel review 后重新提交。
- 审核通过后如果要手动发布，需在 30 天内完成。

## 审核前检查清单

- [ ] `manifest.json` 版本号大于已发布版本（当前 1.1.0）
- [ ] `npm test` 通过（11 项）
- [ ] `npm run package` 生成 ZIP，manifest 在根目录
- [ ] ZIP 不含 `README.md`、`docs/`、`tests/`、`store-listing/` 或 `.git`
- [ ] 在干净的 Chrome 配置中加载 ZIP 解压目录，弹窗和右键菜单正常
- [ ] 商店截图 1280×800，图标 128×128，宣传图尺寸正确
- [ ] 联系邮箱已验证，账号已开启 2FA
- [ ] 隐私政策 URL 可以从无痕窗口打开
- [ ] Privacy practices 与 `PRIVACY.md` / 在线隐私政策一致
- [ ] 权限理由覆盖全部 5 个权限
- [ ] 未声明/未使用远程代码
- [ ] 测试页可访问，审核员可按 Test instructions 复现
- [ ] 详细说明未堆砌关键词、未声称与 Google 有关联

## 审核通过后

1. 把 Chrome Web Store 链接加到：
   - `README.md` 顶部和「安装」部分
   - `docs/index.html` 的主按钮
   - GitHub 仓库的 About / Website
2. 在 GitHub 创建 release（如果尚未创建），附上 `dist/passforge-1.1.0.zip`。
3. 观察评分和崩溃反馈；后续版本必须递增 manifest 版本号并重新走审核。

## 为什么这个扩展的权限面比较小

- 无 `host_permissions`，无 `<all_urls>`，无持久内容脚本。
- `activeTab` 只在用户点击「填入」或右键菜单项时生效。
- 右键菜单只生成并填入当前聚焦的密码框；普通文本框会提示，不会被写入。
- 密码不写入任何存储，扩展没有网络请求。

这些点可以直接用于回复审核员对权限或隐私的询问。
