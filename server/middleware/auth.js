const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  next();
};

const editorAuth = (req, res, next) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Editor') {
    return res.status(403).json({ 
      success: false,
      message: 'Editor or Admin access required' 
    });
  }
  next();
};

module.exports = { auth, adminAuth, editorAuth };
