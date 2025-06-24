// Quick Links logic for links.html
const linkForm = document.getElementById('linkForm');
const linkLabel = document.getElementById('linkLabel');
const linkUrl = document.getElementById('linkUrl');
const linksList = document.getElementById('linksList');

function loadLinks() {
  chrome.storage.local.get(['quickLinks'], (data) => {
    const links = data.quickLinks || [];
    renderLinks(links);
  });
}

function renderLinks(links) {
  if (links.length === 0) {
    linksList.innerHTML = '<div style="color: #71717a; text-align: center;">No links saved yet.</div>';
    return;
  }
  linksList.innerHTML = links.map(link => `
    <div class="link-item">
      <span class="link-label">${link.label ? escapeHtml(link.label) : ''}</span>
      <a class="link-url" href="${escapeHtml(link.url)}" target="_blank">${escapeHtml(link.url)}</a>
      <div class="link-actions">
        <button class="copy" data-id="${link.id}">Copy</button>
        <button class="delete" data-id="${link.id}">Delete</button>
        <span class="copied-msg" id="copied-${link.id}">Copied!</span>
      </div>
    </div>
  `).join('');

  // Add event listeners for copy and delete
  linksList.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const link = links.find(l => l.id === id);
      if (link) {
        navigator.clipboard.writeText(link.url).then(() => {
          const msg = document.getElementById(`copied-${id}`);
          if (msg) {
            msg.style.display = 'inline';
            setTimeout(() => { msg.style.display = 'none'; }, 1200);
          }
        });
      }
    });
  });
  linksList.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      deleteLink(id);
    });
  });
}

function addLink(label, url) {
  chrome.storage.local.get(['quickLinks'], (data) => {
    const links = data.quickLinks || [];
    links.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      label: label.trim(),
      url: url.trim()
    });
    chrome.storage.local.set({ quickLinks: links }, loadLinks);
  });
}

function deleteLink(id) {
  chrome.storage.local.get(['quickLinks'], (data) => {
    let links = data.quickLinks || [];
    links = links.filter(link => link.id !== id);
    chrome.storage.local.set({ quickLinks: links }, loadLinks);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const label = linkLabel.value;
  const url = linkUrl.value;
  if (!url.trim()) return;
  addLink(label, url);
  linkLabel.value = '';
  linkUrl.value = '';
  linkUrl.focus();
});

loadLinks(); 