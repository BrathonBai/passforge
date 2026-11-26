# Chrome Web Store Privacy practices — 建议填写

以下内容供 Chrome Web Store Developer Dashboard 的 **Privacy practices** 页使用。字段名称可能随后台版本变化，以实际界面为准。

## Single purpose description

```text
PassForge generates strong random passwords locally in the browser and lets the user copy
them or fill them into password fields on demand. It does not provide any other function.
```

中文备选：

```text
PassForge 的唯一用途是在浏览器本地生成强随机密码，并根据用户操作复制到剪贴板或填入当前网页的密码框。
```

## Permission justifications

### activeTab

```text
Used only after an explicit user action (clicking "填入" or choosing the "自动生成密码"
context-menu item) to temporarily access the current tab and place the generated password
into the focused password field. No page is accessed in the background or on page load.
```

### scripting

```text
Injects a small, self-contained fill helper into the active tab only after the user asks
PassForge to fill a password. The script locates the focused password field and its
confirmation field, writes the value, and dispatches input/change events. There are no
persistent content scripts and no remote scripts.
```

### contextMenus

```text
Registers exactly one context-menu item, "自动生成密码", so the user can generate and fill
a password without opening the popup. The item appears in editable contexts; the injected
helper refuses to write into a non-password field.
```

### storage

```text
Stores only the user's generation preferences (length, count, uppercase/lowercase/digits/
symbols, ambiguity filter) in chrome.storage.local. Generated passwords and page content
are never stored.
```

### clipboardWrite

```text
Used only when the user explicitly clicks Copy or Copy All, to place the selected generated
password(s) on the system clipboard. The extension never reads the clipboard.
```

## Remote code

Select:

```text
No, I am not using remote code.
```

The extension has no network requests and loads no remote JavaScript, WebAssembly, CSS, or other executable resources.

## Data usage

Recommended:

- Check **Authentication information**.
  - Reason: the extension generates and handles passwords. Chrome's User Data FAQ requires disclosure of user data handled locally, even when it is not transmitted to a server.
  - Explanation to add where the dashboard allows it:

```text
Passwords are generated and handled locally with crypto.getRandomValues() and written only
into the password field the user explicitly chose (or copied to the clipboard when the user
clicks Copy). They are never transmitted, logged, retained, sold, or shared. The only persistent
data is generation settings in chrome.storage.local, which contain no passwords. When
filling, the extension temporarily reads minimal metadata about the focused password field
(type, visibility, name/id/placeholder/autocomplete) to find the target and confirmation
fields; this is used only for the current action and is not retained or transmitted.
```

- Do **not** select data categories such as location, financial information, health, personal communications, or web history; PassForge does not collect them.
- Website content: PassForge does not read, collect, or retain page content beyond the minimal password-field metadata needed for the user-triggered fill. It has no host permissions. If the dashboard requires a category for any page interaction, disclose this fact and link to the privacy policy; do not describe it as collected or retained.

## Certifications / Limited Use

Where the dashboard presents the standard statements, certify only what is true:

- Data is not sold to third parties.
- Data is not used or transferred for purposes unrelated to the extension's single purpose.
- Data is not used or transferred to determine creditworthiness or for lending purposes.
- Data is not transferred to third parties except as necessary to provide the single purpose, for security/legal compliance, or in a merger/acquisition as permitted by policy.
- The extension complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.
- No humans read user data; the developer has no access to generated passwords.

If a statement does not apply, follow the dashboard's instructions rather than checking it blindly. All answers must match [PRIVACY.md](../PRIVACY.md) and <https://github.com/BrathonBai/passforge/blob/main/PRIVACY.md>.

## Privacy policy URL

```text
https://github.com/BrathonBai/passforge/blob/main/PRIVACY.md
```

## Test instructions

```text
No account, login, or payment is required.

1. Install PassForge 1.1.0.
2. Click the toolbar icon. Ten candidate passwords are generated immediately.
3. Click any password row to copy it; click "填入" to fill the password field on the current page.
4. For the fill/right-click flow, open any page with a password field (no login required),
   right-click the field, and choose "自动生成密码". Both the password and confirmation field
   should be filled, with a confirmation toast. A static test form is included in the repository
   at docs/test-form.html if you prefer not to use a live site.
5. No credentials are needed.

Source: https://github.com/BrathonBai/passforge
```

## Notes for reviewers / possible questions

- **Why is `contextMenus` needed?** PassForge's primary flow includes generating directly from a password field's context menu. The menu item is the only context menu the extension creates.
- **Why can the menu appear on non-password fields?** Chrome's contextMenus API supports an `editable` context but not a `password`-only context. PassForge checks the focused field and refuses to overwrite non-password inputs, showing a short hint instead. Adding a persistent content script on all sites would require broad host permissions; this design deliberately avoids that.
- **How does filling work without host permissions?** The user's click on the extension action/fill button or context-menu item grants temporary `activeTab` access. `chrome.scripting.executeScript()` then injects a self-contained helper into that active tab.
- **Are passwords stored or synced?** No. They exist only in popup memory, the optional system clipboard action, and the chosen page input. The extension stores preferences only.
- **Any remote code or analytics?** No. The extension is plain local JavaScript with no dependencies and no network calls.
