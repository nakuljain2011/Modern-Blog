const express = require('express');
const Post = require('../models/Post');
const { auth, editorAuth } = require('../middleware/auth');

const router = express.Router();

// Get all posts with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      tag, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get total count
    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching posts' 
    });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username email role');
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Increment view count
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error fetching post' 
    });
  }
});

// Create new post
router.post('/', auth, editorAuth, async (req, res) => {
  try {
    const { title, body, tags, category } = req.body;
    
    const post = new Post({
      title,
      body,
      author: req.user._id,
      tags: tags || [],
      category: category || 'General'
    });

    await post.save();
    await post.populate('author', 'username');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    
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
      message: 'Error creating post' 
    });
  }
});

// Update post
router.put('/:id', auth, editorAuth, async (req, res) => {
  try {
    const { title, body, tags, category } = req.body;
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this post' 
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, body, tags, category },
      { new: true, runValidators: true }
    ).populate('author', 'username');

    res.json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    
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
      message: 'Error updating post' 
    });
  }
});

// Delete post
router.delete('/:id', auth, editorAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this post' 
      });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting post' 
    });
  }
});

module.exports = router;
