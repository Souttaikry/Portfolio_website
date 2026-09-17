const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['graphic-design', 'photography', 'videography', 'coding'],
  },
  description: { type: String, default: '' },

  // Used by graphic-design / photography / and as a coding thumbnail
  imageUrl: { type: String, default: '' },

  // Used by videography (an actual playable video file); imageUrl can still
  // be set alongside it to act as a poster/cover frame
  videoUrl: { type: String, default: '' },

  // Coding-specific fields
  techStack: [{ type: String, trim: true }],
  repoUrl: { type: String, default: '' },
  liveUrl: { type: String, default: '' },

  tags: [{ type: String, trim: true }],
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
