const express = require('express');
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const requireAuth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

// Removes any locally-uploaded file (image or video) tied to a project
function cleanupOldFiles(project) {
  ['imageUrl', 'videoUrl'].forEach((field) => {
    if (project[field] && project[field].startsWith('/uploads/')) {
      fs.unlink(path.join(__dirname, '..', project[field]), () => {});
    }
  });
}

// ---------- PUBLIC ROUTES ----------

// GET /api/projects?category=coding
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- ADMIN (PROTECTED) ROUTES ----------

// POST /api/projects  (create, optional media upload field "media" — image or video)
router.post('/', requireAuth, upload.single('media'), async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.techStack && typeof body.techStack === 'string') {
      body.techStack = body.techStack.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (body.tags && typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (req.file) {
      const url = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('video/')) body.videoUrl = url;
      else body.imageUrl = url;
    }

    const project = await Project.create(body);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: 'Could not create project', error: err.message });
  }
});

// PUT /api/projects/:id  (update, optional new media replaces the old file)
router.put('/:id', requireAuth, upload.single('media'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const body = { ...req.body };
    if (body.techStack && typeof body.techStack === 'string') {
      body.techStack = body.techStack.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (body.tags && typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (req.file) {
      cleanupOldFiles(project); // remove whichever old file (image or video) this replaces
      const url = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('video/')) {
        body.videoUrl = url;
        body.imageUrl = ''; // a project has one or the other, not a stale leftover of both
      } else {
        body.imageUrl = url;
        body.videoUrl = '';
      }
    }

    Object.assign(project, body);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: 'Could not update project', error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    cleanupOldFiles(project);

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
