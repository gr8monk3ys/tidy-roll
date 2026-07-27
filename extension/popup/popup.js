/* Tidy Roll — popup logic */

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = value >= 100 || unit === 0 ? Math.round(value) : value.toFixed(1);
  return `${rounded} ${units[unit]}`;
}

async function boot() {
  document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version}`;

  const { lifetime } = await chrome.storage.local.get('lifetime');
  if (lifetime) {
    document.getElementById('stat-reviewed').textContent = String(lifetime.reviewed || 0);
    document.getElementById('stat-tossed').textContent = String(lifetime.tossed || 0);
    document.getElementById('stat-bytes').textContent = formatBytes(lifetime.bytes || 0);
  }

  document.getElementById('btn-start').addEventListener('click', async () => {
    await chrome.tabs.create({ url: chrome.runtime.getURL('app/app.html') });
    window.close();
  });
}

boot();
