const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = '/admin-login.html';
}

const CATEGORY_LABELS = {
  'graphic-design': 'Graphic Design',
  'photography': 'Photography',
  'videography': 'Videography',
  'coding': 'Coding'
};

let allProjects = [];
let activeCategory = 'all';
let editingId = null;

const grid = document.getElementById('adminGrid');
const modalOverlay = document.getElementById('modalOverlay');
const form = document.getElementById('projectForm');
const categorySelect = document.getElementById('category');
const codingFields = document.getElementById('codingFields');

// ---------- Auth helper ----------
async function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
    throw new Error('Unauthorized');
  }
  return res;
}

// ---------- Load & render ----------
async function loadProjects() {
  try {
    const res = await authFetch('/api/projects');
    allProjects = await res.json();
    renderGrid();
  } catch (err) {
    grid.innerHTML = '<div class="empty-note">Could not load projects.</div>';
  }
}

function renderGrid() {
  const list = activeCategory === 'all'
    ? allProjects
    : allProjects.filter(p => p.category === activeCategory);

  if (!list.length) {
    grid.innerHTML = '<div class="empty-note">Nothing here yet. Click "+ Add new" to create one.</div>';
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="admin-card">
      <div class="admin-thumb">
        ${p.videoUrl
          ? `<video src="${p.videoUrl}" muted controls style="width:100%;height:100%;object-fit:cover;"></video>`
          : p.imageUrl
            ? `<img src="${p.imageUrl}" alt="">`
            : `<span class="ph">${p.category === 'coding' ? '💻' : '🖼️'}</span>`}
      </div>
      <div class="admin-card-body">
        <div class="cat">${CATEGORY_LABELS[p.category] || p.category}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <div class="admin-card-actions">
          <button data-action="edit" data-id="${p._id}">Edit</button>
          <button data-action="delete" data-id="${p._id}" class="delete">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ---------- Filter tabs ----------
document.getElementById('filterTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#filterTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = btn.dataset.cat;
  renderGrid();
});

// ---------- Modal open/close ----------
function toggleCodingFields() {
  codingFields.style.display = categorySelect.value === 'coding' ? 'block' : 'none';

  const mediaLabel = document.getElementById('mediaLabel');
  const mediaHint = document.getElementById('mediaHint');
  const fileInput = document.getElementById('imageFile');

  if (categorySelect.value === 'videography') {
    mediaLabel.textContent = 'Video (or a poster image)';
    mediaHint.textContent = 'MP4, WEBM or MOV — max 100MB. You can also upload a still image as a cover.';
  } else {
    mediaLabel.textContent = 'Image';
    mediaHint.textContent = 'JPG, PNG, GIF or WEBP — max 8MB. Leave empty to keep the existing file when editing.';
  }
}
categorySelect.addEventListener('change', toggleCodingFields);

function openModal(project = null) {
  form.reset();
  document.getElementById('currentImageWrap').style.display = 'none';
  document.getElementById('currentVideoWrap').style.display = 'none';
  editingId = project ? project._id : null;
  document.getElementById('modalTitle').textContent = project ? 'Edit project' : 'Add new project';

  if (project) {
    document.getElementById('projectId').value = project._id;
    document.getElementById('title').value = project.title;
    categorySelect.value = project.category;
    document.getElementById('description').value = project.description || '';
    document.getElementById('techStack').value = (project.techStack || []).join(', ');
    document.getElementById('repoUrl').value = project.repoUrl || '';
    document.getElementById('liveUrl').value = project.liveUrl || '';

    if (project.videoUrl) {
      document.getElementById('currentVideo').src = project.videoUrl;
      document.getElementById('currentVideoWrap').style.display = 'block';
    } else if (project.imageUrl) {
      document.getElementById('currentImage').src = project.imageUrl;
      document.getElementById('currentImageWrap').style.display = 'block';
    }
  }

  toggleCodingFields();
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  editingId = null;
}

document.getElementById('addBtn').addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ---------- Edit / Delete actions ----------
grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const project = allProjects.find(p => p._id === id);

  if (btn.dataset.action === 'edit') {
    openModal(project);
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
      showToast('Project deleted');
      loadProjects();
    } catch (err) {
      showToast('Could not delete project');
    }
  }
});

// ---------- Save (create/update) ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const fd = new FormData();
  fd.append('title', document.getElementById('title').value.trim());
  fd.append('category', categorySelect.value);
  fd.append('description', document.getElementById('description').value.trim());
  fd.append('techStack', document.getElementById('techStack').value.trim());
  fd.append('repoUrl', document.getElementById('repoUrl').value.trim());
  fd.append('liveUrl', document.getElementById('liveUrl').value.trim());

  const fileInput = document.getElementById('imageFile');
  if (fileInput.files[0]) fd.append('media', fileInput.files[0]);

  try {
    const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
    const method = editingId ? 'PUT' : 'POST';
    const res = await authFetch(url, { method, body: fd });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Save failed');
    }

    showToast(editingId ? 'Project updated' : 'Project added');
    closeModal();
    loadProjects();
  } catch (err) {
    showToast(err.message || 'Something went wrong');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save project';
  }
});

// ---------- Logout ----------
document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUsername');
  window.location.href = '/admin-login.html';
});

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

loadProjects();
