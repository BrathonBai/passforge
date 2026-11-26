# Changelog

All notable changes to PassForge are documented here.

## 1.1.0 — 2026-11-26

- Add a **自动生成密码** context-menu item for editable fields.
- The menu option generates one password using the saved settings and fills it only into the focused password field, synchronizing the confirmation field when present.
- Non-password editable fields are never overwritten; the page shows a short hint instead.
- Add a background service worker for context-menu registration and handling.
- Add open-source project files, privacy policy, Chrome Web Store assets and packaging script.

## 1.0.0 — 2026-11-23

- Initial release.
- Generate 1–20 independent passwords, 8–64 characters each, with selectable uppercase, lowercase, numbers and symbols.
- Guarantee at least one character from every enabled class.
- Exclude visually ambiguous characters `0 O 1 l I`.
- Copy one password, copy the whole batch, or fill a selected password into the current page with confirmation-field synchronization.
- Save generation settings locally; never store generated passwords.
- Support `R` to regenerate and `Alt+Shift+P` to open the popup.
