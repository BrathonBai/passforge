import { generatePassword, normalizeSettings } from './generator.js';
import { fillPasswordInPage } from './fill-page.js';

const MENU_ID = 'passforge-generate-password';
const STORAGE_KEY = 'passforge.settings.v1';

function ensureContextMenu() {
  try {
    chrome.contextMenus.create(
      {
        id: MENU_ID,
        title: '自动生成密码',
        contexts: ['editable'],
      },
      () => {
        // A duplicate-id error is expected when the worker restarts; the menu
        // itself is managed by Chrome and only needs to be created once.
        void chrome.runtime.lastError;
      },
    );
  } catch (error) {
    console.warn('PassForge: unable to create context menu', error);
  }
}

function resetContextMenu() {
  chrome.contextMenus.removeAll(() => ensureContextMenu());
}

chrome.runtime.onInstalled.addListener(resetContextMenu);
chrome.runtime.onStartup.addListener(resetContextMenu);
ensureContextMenu();

async function readSettings() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    return normalizeSettings(stored?.[STORAGE_KEY]);
  } catch (error) {
    console.warn('PassForge: unable to read settings for context menu', error);
    return normalizeSettings();
  }
}

async function generateAndFillPassword(info, tab) {
  if (!tab?.id) return;

  try {
    const password = generatePassword(await readSettings());
    const target = { tabId: tab.id };
    if (Number.isInteger(info.frameId) && info.frameId >= 0) {
      target.frameIds = [info.frameId];
    }

    const results = await chrome.scripting.executeScript({
      target,
      func: fillPasswordInPage,
      args: [password, { requireActivePassword: true }],
    });

    const result = results?.[0]?.result;
    if (result?.ok) {
      // The in-page toast confirms the fill. Nothing else to do here.
      return;
    }

    if (result?.reason === 'not-password-field') {
      // fillPasswordInPage already displayed the guidance toast in the page.
      return;
    }

    console.warn('PassForge: context-menu fill could not run', result);
  } catch (error) {
    console.warn('PassForge: context-menu fill failed', error);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  void generateAndFillPassword(info, tab);
});
