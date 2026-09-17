document.getElementById('year').textContent = new Date().getFullYear();

const CATEGORY_LABELS = {
  'graphic-design': 'Graphic Design',
  'photography': 'Photography',
  'videography': 'Videography',
  'coding': 'Coding'
};

let allProjects = [];
let activeCategory = 'all';

async function loadProjects() {
  const grid = document.getElementById('projectsGrid');
  try {
    const res = await fetch('/api/projects');
    allProjects = await res.json();
    renderProjects();
  } catch (err) {
    grid.innerHTML = '<div class="empty-state">Could not load projects right now.</div>';
  }
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const list = activeCategory === 'all'
    ? allProjects
    : allProjects.filter(p => p.category === activeCategory);

  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">No projects in this category yet.</div>';
    return;
  }

  grid.innerHTML = list.map(renderCard).join('');
}

function renderCard(p) {
  let thumb;
  if (p.videoUrl) {
    const poster = p.imageUrl ? ` poster="${p.imageUrl}"` : '';
    thumb = `<video src="${p.videoUrl}" controls playsinline${poster}></video>`;
  } else if (p.imageUrl) {
    thumb = `<img src="${p.imageUrl}" alt="${escapeHtml(p.title)}">`;
  } else {
    thumb = `<span class="placeholder">${p.category === 'coding' ? '💻' : '🖼️'}</span>`;
  }

  const tech = (p.techStack && p.techStack.length)
    ? `<div class="tech-tags">${p.techStack.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const links = [];
  if (p.repoUrl) links.push(`<a href="${p.repoUrl}" target="_blank" rel="noopener">Code</a>`);
  if (p.liveUrl) links.push(`<a href="${p.liveUrl}" target="_blank" rel="noopener">Live</a>`);

  return `
    <div class="project-card">
      <div class="project-thumb">${thumb}</div>
      <div class="project-body">
        <span class="cat-tag">${CATEGORY_LABELS[p.category] || p.category}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description || '')}</p>
        ${tech}
        ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Filter chip clicks
document.getElementById('filterBar').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = btn.dataset.cat;
  renderProjects();
});

// Category cards scroll + filter
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    const cat = card.dataset.cat;
    document.querySelectorAll('.filter-chip').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
    activeCategory = cat;
    renderProjects();
    document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
  });
});

loadProjects();

// ---------- Lightbox: click a project image to see it bigger, click again to close ----------
const lightboxOverlay = document.getElementById('lightboxOverlay');
const lightboxImg = document.getElementById('lightboxImg');

document.getElementById('projectsGrid').addEventListener('click', (e) => {
  const img = e.target.closest('.project-thumb img');
  if (!img) return;
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxOverlay.classList.add('show');
});

lightboxOverlay.addEventListener('click', () => {
  lightboxOverlay.classList.remove('show');
  lightboxImg.src = '';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    lightboxOverlay.classList.remove('show');
    lightboxImg.src = '';
  }
});

// Register service worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
