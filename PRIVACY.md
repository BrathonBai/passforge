# PassForge 隐私政策

**最后更新：2026-11-26** · 适用版本：1.1.0 及以后

公开版本：<https://github.com/BrathonBai/passforge/blob/main/PRIVACY.md>

PassForge 密码工坊（以下简称“PassForge”）是一个完全在浏览器本地运行的开源密码生成器。本政策说明扩展会处理哪些数据、为什么处理，以及不会做什么。

## 摘要

- PassForge 没有服务器，**不会将任何数据传输到设备之外，也不出售或共享数据**。为提供核心功能，它会在本机临时处理生成的密码和密码框的最小字段信息；这些数据不上传、不保存。
- 生成的密码只存在于浏览器内存、系统剪贴板和/或你主动填入的网页密码框中；**扩展不保存密码**。
- 唯一的持久化数据是生成偏好设置，保存在本机 `chrome.storage.local`，其中不含密码。
- 没有分析、追踪、广告、账户系统或远程代码。
- 没有全站主机权限，也没有常驻内容脚本。

## 1. 本地处理的数据

为提供“生成强密码并复制或填入”的唯一功能，扩展会在你的设备上临时处理：

- **生成的密码**：由 `crypto.getRandomValues()` 在本地生成。只有在你点击“复制”时写入系统剪贴板，或在你点击“填入”／右键菜单项时写入当前页面的密码框。密码不会写入扩展存储、浏览器历史、日志或远程服务。
- **当前页面的最小字段信息**：仅在你主动触发填入时，临时读取密码输入框的类型、可见性，以及 `name`、`id`、`placeholder`、`aria-label`、`autocomplete` 等属性，用来定位密码框和确认密码框。该信息只在当次操作中使用，不保留、不传输，也不用于广告或分析。
- **生成设置**：长度、数量、字符类型和易混淆过滤设置保存在本机 `chrome.storage.local`，不包含密码。

剪贴板中的内容之后可能由操作系统或你安装的剪贴板管理器处理，这不属于 PassForge 的控制范围。

## 2. 权限及用途

| 权限 | 用途 |
| --- | --- |
| `activeTab` | 仅在你点击“填入”或右键菜单项后临时访问当前标签页，用于填入密码 |
| `scripting` | 在用户主动触发时注入用于识别并填写密码框的自包含脚本 |
| `contextMenus` | 注册“自动生成密码”右键菜单项 |
| `storage` | 在本机保存生成偏好设置，不保存密码 |
| `clipboardWrite` | 在你点击复制按钮时写入剪贴板 |

PassForge 未申请 `<all_urls>` 或任何全站主机权限，不加载远程代码，没有统计或广告 SDK。

## 3. 数据出售、共享与转让

不。PassForge 不会出售、出租、交易或共享你的密码、浏览内容或任何个人信息。扩展没有后端，开发者无法访问你在本机生成或填写的密码。

## 4. 数据保留与删除

密码从不被 PassForge 保留。生成设置保留在本机，直到你修改设置或卸载扩展；卸载扩展通常会使 Chrome 清除其本地存储。

## 5. 安全

密码使用浏览器加密随机数生成，并通过拒绝采样避免取模偏差；代码中没有 `Math.random()` 降级路径。扩展权限最小化，源码公开可审计。任何本机软件都无法消除设备被恶意软件控制或剪贴板被其他程序读取的风险；重要账户建议使用 16 位以上密码，并保存在可信的密码管理器中。

## 6. Limited Use

PassForge 对通过 Chrome API 获得的信息的使用，仅限于提供本扩展明确披露的单一用途：在本机生成密码，并在用户主动操作时复制或填入密码。该使用遵守 Chrome Web Store User Data Policy，包括其 Limited Use 要求。我们不会将数据用于个性化广告，不会出售数据，不会允许人工读取你的密码，也不会在不符合政策的情况下转让数据。

## 7. 联系

请通过 GitHub Issues 联系：<https://github.com/BrathonBai/passforge/issues>。请勿在公开 Issue 中粘贴真实密码或账户凭据。

## 8. 政策变更

如果数据处理方式发生实质变化，我们会更新本文件、在线隐私政策和对应版本的发布说明。

---

**English summary.** PassForge is a local-first, open-source Chrome password generator. It has no backend and does not transmit, sell, or share personal data; password generation and filling happen entirely on the device. Passwords are generated locally with `crypto.getRandomValues()`, are never stored by the extension, and are copied or filled only at the user's explicit request. When filling, the extension temporarily reads minimal password-field metadata to locate the target and confirmation fields; this information is used only for that action and is not retained or transmitted. The only persistent data is generation preferences stored in `chrome.storage.local`, which contain no passwords. No remote code, analytics, or advertising is used. Its use of Chrome API data is limited to the extension's single purpose, in accordance with the Chrome Web Store User Data Policy, including the Limited Use requirements.
