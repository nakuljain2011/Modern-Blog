const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    const comments = await Comment.find({ postID: postId })
      .populate('userID', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Comment.countDocuments({ postID: postId });

    res.json({
      success: true,
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error fetching comments' 
    });
  }
});

// Create comment
router.post('/', auth, async (req, res) => {
  try {
    const { postID, comment } = req.body;

    // Validate input
    if (!postID || !comment) {
      return res.status(400).json({ 
        success: false,
        message: 'Post ID and comment content are required' 
      });
    }

    // Check if post exists
    const post = await Post.findById(postID);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }
    
    const newComment = new Comment({
      postID,
      userID: req.user._id,
      comment: comment.trim()
    });

    await newComment.save();
    await newComment.populate('userID', 'username');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error adding comment' 
    });
  }
});

// Update comment
router.put('/:id', auth, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Comment content is required' 
      });
    }

    const existingComment = await Comment.findById(req.params.id);
    if (!existingComment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    // Check if user is comment author or admin
    if (existingComment.userID.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this comment' 
      });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { comment: comment.trim() },
      { new: true, runValidators: true }
    ).populate('userID', 'username');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating comment' 
    });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    // Check if user is comment author or admin
    if (comment.userID.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this comment' 
      });
    }

    await Comment.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting comment' 
    });
  }
});

module.exports = router;
