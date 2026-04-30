import { showToast } from './utils.js';

const STORAGE_KEY = 'donbong.aiControl.settings';

function qs(id) {
  return document.getElementById(id);
}

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function appendLog(message, type = 'info') {
  const log = qs('aiLog');
  if (!log) return;

  const line = document.createElement('div');
  line.className = `ai-log-line ai-log-${type}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  log.prepend(line);
}

function formatJson(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

async function postJson(url, payload, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.details = json;
    throw error;
  }

  return json;
}

function bindSettings() {
  const settings = readSettings();

  qs('wixEndpoint').value = settings.wixEndpoint || '';
  qs('flaskEndpoint').value = settings.flaskEndpoint || '';
  qs('apiToken').value = settings.apiToken || '';

  qs('saveAiSettings').addEventListener('click', () => {
    const next = {
      wixEndpoint: qs('wixEndpoint').value.trim(),
      flaskEndpoint: qs('flaskEndpoint').value.trim(),
      apiToken: qs('apiToken').value.trim()
    };
    writeSettings(next);
    showToast('Settings saved');
    appendLog('Configuration saved locally in browser', 'ok');
  });
}

function bindCommandRunner() {
  qs('runUpdateHeadline').addEventListener('click', async () => {
    const { wixEndpoint, apiToken } = readSettings();
    const productId = qs('cmdProductId').value.trim();
    const newText = qs('cmdHeadline').value.trim();

    if (!wixEndpoint) return showToast('Fill Wix endpoint first');
    if (!productId || !newText) return showToast('Fill product and headline');

    const payload = { command: 'updateHeadline', productId, newText };

    try {
      appendLog(`POST ${wixEndpoint} ${formatJson(payload)}`);
      const data = await postJson(wixEndpoint, payload, apiToken);
      qs('commandResponse').textContent = formatJson(data);
      appendLog('Command updateHeadline completed', 'ok');
    } catch (err) {
      qs('commandResponse').textContent = formatJson(err.details || { error: err.message });
      appendLog(`Command failed: ${err.message}`, 'error');
    }
  });
}

function bindAiAsk() {
  qs('sendAiPrompt').addEventListener('click', async () => {
    const { flaskEndpoint, apiToken } = readSettings();
    const prompt = qs('aiPrompt').value.trim();

    if (!flaskEndpoint) return showToast('Fill Flask endpoint first');
    if (!prompt) return showToast('Enter prompt');

    const payload = { message: prompt };

    try {
      appendLog(`POST ${flaskEndpoint} ${formatJson(payload)}`);
      const data = await postJson(flaskEndpoint, payload, apiToken);
      qs('aiResponse').textContent = formatJson(data);
      appendLog('AI response received', 'ok');
    } catch (err) {
      qs('aiResponse').textContent = formatJson(err.details || { error: err.message });
      appendLog(`AI call failed: ${err.message}`, 'error');
    }
  });
}

export function initAIControlPanel() {
  if (!qs('aiControlPanel')) return;

  bindSettings();
  bindCommandRunner();
  bindAiAsk();

  appendLog('AI control panel initialized');
}
