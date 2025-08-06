const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Body content is required'],
    minlength: [10, 'Body must be at least 10 characters long']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  category: {
    type: String,
    default: 'General',
    enum: ['General', 'Technology', 'Development', 'Design', 'Business', 'Lifestyle']
  },
  views: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Add text index for search functionality
postSchema.index({ title: 'text', body: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);
