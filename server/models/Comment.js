const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Comment', commentSchema);
