/**
 * The function in this module is injected into the active tab with
 * chrome.scripting.executeScript(). It must stay completely self-contained:
 * no imports, no references to outer variables, no extension APIs.
 */

export function fillPasswordInPage(password, options = {}) {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, reason: 'invalid-password' };
  }

  const requireActivePassword = options?.requireActivePassword === true;

  const TOAST_ATTR = 'data-passforge-toast';
  const HIGHLIGHT = '#b6e445';
  const confirmPattern =
    /(confirm|repeat|retype|again|verify|verification|confirmation|确认|重复|再次|核对|二次)/i;

  function collectPasswordFields() {
    return [...document.querySelectorAll('input[type="password"]')];
  }

  function isVisible(field) {
    if (!(field instanceof HTMLInputElement)) return false;
    if (field.disabled || field.readOnly) return false;
    const style = window.getComputedStyle(field);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = field.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  }

  function descriptor(field) {
    return [
      field.name,
      field.id,
      field.placeholder,
      field.getAttribute('aria-label'),
      field.getAttribute('autocomplete'),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function isOldPassword(field) {
    return (
      field.getAttribute('autocomplete') === 'current-password' ||
      /(current|old|existing|previous|当前密码|原密码|旧密码|现有密码)/i.test(descriptor(field))
    );
  }

  function isConfirmPassword(field) {
    return confirmPattern.test(descriptor(field));
  }

  function isNewPassword(field) {
    return (
      field.getAttribute('autocomplete') === 'new-password' ||
      /(new|新密码)/i.test(descriptor(field))
    );
  }

  function chooseTarget(active, fields) {
    if (active && fields.includes(active)) {
      if (isOldPassword(active) || isConfirmPassword(active)) {
        const better = fields.find(
          (field) =>
            field !== active && isNewPassword(field) && !isConfirmPassword(field),
        );
        if (better) return better;

        const activeIndex = fields.indexOf(active);
        if (isConfirmPassword(active) && activeIndex > 0) {
          return fields[activeIndex - 1];
        }
      }
      return active;
    }

    if (fields.length === 1) return fields[0];
    if (fields.length === 2) {
      const newField = fields.find((field) => isNewPassword(field));
      if (newField) return newField;
      const plainField = fields.find((field) => !isConfirmPassword(field));
      if (plainField) return plainField;
    }

    const newField = fields.find(
      (field) => isNewPassword(field) && !isConfirmPassword(field),
    );
    return newField || null;
  }

  function findConfirmationFields(target, fields) {
    const scope = target.form;
    const related = fields.filter(
      (field) => field !== target && (scope ? field.form === scope : true),
    );

    const namedConfirm = related.filter(isConfirmPassword);
    if (namedConfirm.length > 0) return [namedConfirm[0]];

    // Registration forms often use two anonymous password inputs. Only pair a
    // second field when there is exactly one candidate, it follows the target,
    // and it is not an old-password field.
    if (related.length === 1) {
      const other = related[0];
      const targetIndex = fields.indexOf(target);
      const otherIndex = fields.indexOf(other);
      if (otherIndex > targetIndex && !isOldPassword(other)) return [other];
    }

    return [];
  }

  function setFieldValue(field, value) {
    // Use the native setter so React/Vue controlled inputs receive the update.
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    if (setter) setter.call(field, value);
    else field.value = value;

    if (field._valueTracker) {
      try {
        field._valueTracker.setValue('');
      } catch {
        /* Non-React pages simply do not have a value tracker. */
      }
    }

    field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function removeToasts() {
    document.querySelectorAll(`[${TOAST_ATTR}]`).forEach((node) => node.remove());
  }

  function showPageToast(message, isError = false, duration = 2400, isHint = false) {
    removeToasts();
    const host = document.createElement('div');
    host.setAttribute(TOAST_ATTR, '');
    host.style.cssText =
      'all:initial;position:fixed;z-index:2147483647;left:50%;bottom:28px;' +
      'display:block;width:max-content;transform:translateX(-50%);pointer-events:none;';
    const shadow = host.attachShadow({ mode: 'closed' });
    const bar = document.createElement('div');
    bar.style.cssText =
      'display:flex;align-items:center;gap:8px;background:#171b16;color:#f3f5ec;' +
      'border:1px solid rgba(205,245,100,.34);padding:10px 15px;border-radius:999px;' +
      'font:500 13px/1.45 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
      'box-shadow:0 10px 28px rgba(10,14,9,.3);white-space:nowrap;';
    const mark = document.createElement('span');
    mark.textContent = isHint ? '•' : isError ? '!' : '✓';
    mark.style.cssText = `color:${isError ? '#ffb19a' : isHint ? '#ffe08a' : HIGHLIGHT};font-weight:800;font-size:13px;`;
    const text = document.createElement('span');
    text.textContent = message;
    bar.append(mark, text);
    shadow.append(bar);
    (document.documentElement || document.body).append(host);
    if (duration > 0) window.setTimeout(() => host.remove(), duration);
  }

  function flashFields(fields) {
    for (const field of fields) {
      const previousOutline = field.style.outline;
      const previousOffset = field.style.outlineOffset;
      field.style.outline = `2px solid ${HIGHLIGHT}`;
      field.style.outlineOffset = '2px';
      window.setTimeout(() => {
        field.style.outline = previousOutline;
        field.style.outlineOffset = previousOffset;
      }, 1600);
    }
  }

  function applyPassword(target, fields, { fromPicker = false } = {}) {
    const confirms = findConfirmationFields(target, fields);
    const targets = [target, ...confirms];

    for (const field of targets) {
      setFieldValue(field, password);
    }

    if (fromPicker) {
      try {
        target.focus({ preventScroll: true });
      } catch {
        /* Ignore focus restrictions on exotic pages. */
      }
    }

    flashFields(targets);
    showPageToast(
      confirms.length > 0 ? '密码已填入，确认密码框也已同步' : '密码已填入',
    );
    return {
      ok: true,
      mode: fromPicker ? 'picked' : 'filled',
      filled: targets.length,
      confirmation: confirms.length > 0,
    };
  }

  /**
   * When no password field can be identified, let the user click the field they
   * want. The popup closes, so this listener lives in the page until it is used,
   * cancelled with Escape, or times out.
   */
  function startPicker(fields) {
    if (fields.length === 0) return false;

    let finished = false;
    let timer = 0;
    const originalStyles = new Map();
    const readyMessage = '点击要填入的密码框 · Esc 取消';

    function cleanup() {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.clearTimeout(timer);
      for (const [field, style] of originalStyles) {
        field.style.outline = style.outline;
        field.style.outlineOffset = style.offset;
      }
      removeToasts();
    }

    function finish(field) {
      if (finished) return;
      finished = true;
      cleanup();
      const fieldsNow = collectPasswordFields().filter(isVisible);
      let target = field;
      if (isConfirmPassword(field)) {
        const earlier = fieldsNow
          .slice(0, fieldsNow.indexOf(field))
          .reverse()
          .find((candidate) => !isConfirmPassword(candidate));
        if (earlier) target = earlier;
      }
      applyPassword(target, fieldsNow, { fromPicker: true });
    }

    function onClick(event) {
      const field = event.target?.closest?.('input[type="password"]');
      if (!field || !isVisible(field)) return;
      event.preventDefault();
      event.stopPropagation();
      finish(field);
    }

    function onKeyDown(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      finished = true;
      cleanup();
      showPageToast('已取消填入', true);
    }

    for (const field of fields) {
      originalStyles.set(field, {
        outline: field.style.outline,
        offset: field.style.outlineOffset,
      });
      field.style.outline = `2px dashed ${HIGHLIGHT}`;
      field.style.outlineOffset = '3px';
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    showPageToast(readyMessage, false, 0, true);
    timer = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      showPageToast('等待超时，请再试一次', true);
    }, 20000);

    return true;
  }

  try {
    const fields = collectPasswordFields().filter(isVisible);
    const active =
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.type === 'password' &&
      fields.includes(document.activeElement)
        ? document.activeElement
        : null;

    // Context-menu invocations must only touch the password field the user
    // actually right-clicked. Never wander off and fill an unrelated field.
    if (requireActivePassword) {
      if (!active) {
        showPageToast('请在密码框中右键使用', true);
        return { ok: false, reason: 'not-password-field' };
      }
      const focusedTarget = chooseTarget(active, fields);
      if (!focusedTarget) {
        showPageToast('未能识别密码框，请重试', true);
        return { ok: false, reason: 'not-password-field' };
      }
      return applyPassword(focusedTarget, fields);
    }

    if (fields.length === 0) return { ok: false, reason: 'no-fields' };

    const target = chooseTarget(active, fields);
    if (target) {
      return applyPassword(target, fields);
    }

    if (startPicker(fields)) return { ok: true, mode: 'pick' };
    return { ok: false, reason: 'no-fields' };
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      message: String(error?.message || error).slice(0, 160),
    };
  }
}
