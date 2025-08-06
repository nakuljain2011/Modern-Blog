import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { 
  User, Edit3, Trash2, Plus, Moon, Sun, LogOut,
  MessageCircle, Tag, Calendar, Search, Eye, Edit, Save, X, 
  AlertCircle, CheckCircle, Home, PenTool
} from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('blogToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('blogToken');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Contexts
const ThemeContext = createContext();
const AuthContext = createContext();
const NotificationContext = createContext();

// Custom Hooks
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

// Notification Provider
const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

// Notification Container Component
const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// Individual Notification Component
const Notification = ({ notification, onRemove }) => {
  const { type, message, id } = notification;
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      case 'error': return <AlertCircle size={20} className="text-red-500" />;
      default: return <AlertCircle size={20} className="text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200';
      case 'error': return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200';
      default: return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200';
    }
  };

  return (
    <div className={`flex items-center p-4 rounded-lg border shadow-lg fade-in ${getStyles()}`}>
      {getIcon()}
      <span className="ml-3 flex-1">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('blogTheme');
    return saved ? saved === 'dark' : false;
  });

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('blogTheme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      accent: isDark ? 'bg-gray-700' : 'bg-gray-100',
      text: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      button: isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800',
      buttonSecondary: isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-black hover:bg-gray-300',
      success: 'bg-green-500 hover:bg-green-600 text-white',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div className={`min-h-screen transition-colors duration-300 ${theme.colors.primary} ${theme.colors.text}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('blogToken');
    if (token) {
      api.get('/auth/me')
        .then(response => {
          if (response.data.success) {
            setUser(response.data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('blogToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('blogToken', response.data.token);
        showNotification('Login successful!', 'success');
        return response.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      showNotification(message, 'error');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('blogToken', response.data.token);
        showNotification('Registration successful!', 'success');
        return response.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      showNotification(message, 'error');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('blogToken');
    showNotification('Logged out successfully', 'success');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Loading Component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`loading-spinner ${sizes[size]} mx-auto`}></div>
  );
};

// Header Component
const Header = ({ activeView, setActiveView }) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className={`${colors.secondary} ${colors.border} border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-90`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold cursor-pointer" onClick={() => setActiveView('posts')}>
              ModernBlog
            </h1>
            
            {user && (
              <nav className="hidden md:flex space-x-4">
                <button
                  onClick={() => setActiveView('posts')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'posts' ? colors.button : colors.buttonSecondary
                  }`}
                >
                  <Home size={16} />
                  <span>Posts</span>
                </button>
                
                {(user.role === 'Admin' || user.role === 'Editor') && (
                  <button
                    onClick={() => setActiveView('create')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      activeView === 'create' ? colors.button : colors.buttonSecondary
                    }`}
                  >
                    <PenTool size={16} />
                    <span>Write</span>
                  </button>
                )}
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${colors.buttonSecondary} transition-all duration-200 hover:scale-105`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className={`text-xs ${colors.textSecondary}`}>{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className={`p-2 rounded-full ${colors.buttonSecondary} hover:bg-red-500 hover:text-white transition-colors`}
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveView('auth')}
                className={`${colors.button} px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105`}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Auth Component
const AuthForm = ({ onSuccess }) => {
  const { colors } = useTheme();
  const { login, register, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'User'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login({
          email: formData.email,
          password: formData.password
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className={`max-w-md w-full ${colors.secondary} rounded-lg shadow-lg p-6`}>
        <h2 className="text-3xl font-bold mb-6 text-center">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              required
            />
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className={`w-full p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
            required
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
            required
          />
          
          {isRegister && (
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="User">User</option>
              <option value="Editor">Editor</option>
              <option value="Admin">Admin</option>
            </select>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg ${colors.button} font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center justify-center space-x-2`}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setFormData({ username: '', email: '', password: '', role: 'User' });
            }}
            className={`${colors.textSecondary} hover:underline`}
          >
            {isRegister 
              ? 'Already have an account? Sign in' 
              : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({ post, onEdit, onDelete, onView }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const canEdit = user && (user.role === 'Admin' || user.role === 'Editor');
  const canDelete = user && (user.role === 'Admin' || post.author.username === user.username);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        onDelete(post._id);
        showNotification('Post deleted successfully', 'success');
      } catch (error) {
        showNotification('Failed to delete post', 'error');
      }
    }
  };

  return (
    <article className={`${colors.secondary} rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 border ${colors.border} fade-in`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h2 
            className="text-2xl font-bold mb-2 hover:underline cursor-pointer line-clamp-2" 
            onClick={() => onView(post)}
          >
            {post.title}
          </h2>
          <div className="flex items-center space-x-4 text-sm mb-3">
            <span className={`${colors.textSecondary} flex items-center`}>
              <User size={16} className="mr-1" />
              {post.author.username}
            </span>
            <span className={`${colors.textSecondary} flex items-center`}>
              <Calendar size={16} className="mr-1" />
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            {post.category && (
              <span className={`px-2 py-1 text-xs rounded-full ${colors.accent}`}>
                {post.category}
              </span>
            )}
            {post.views > 0 && (
              <span className={`${colors.textSecondary} flex items-center text-xs`}>
                <Eye size={12} className="mr-1" />
                {post.views}
              </span>
            )}
          </div>
        </div>
        
        {(canEdit || canDelete) && (
          <div className="flex space-x-2 ml-4">
            {canEdit && (
              <button
                onClick={() => onEdit(post)}
                className={`p-2 rounded-full ${colors.buttonSecondary} hover:bg-blue-500 hover:text-white transition-colors`}
                title="Edit Post"
              >
                <Edit size={16} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className={`p-2 rounded-full ${colors.buttonSecondary} hover:bg-red-500 hover:text-white transition-colors`}
                title="Delete Post"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`${colors.textSecondary} mb-4 line-clamp-3`}>
        {post.body.length > 150 ? `${post.body.substring(0, 150)}...` : post.body}
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${colors.accent} ${colors.textSecondary}`}
            >
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className={`text-xs ${colors.textSecondary}`}>
              +{post.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-sm">
          <span className={`${colors.textSecondary} flex items-center`}>
            <MessageCircle size={16} className="mr-1" />
            Comments
          </span>
        </div>
        
        <button
          onClick={() => onView(post)}
          className={`flex items-center space-x-2 ${colors.button} px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105`}
        >
          <Eye size={16} />
          <span>Read More</span>
        </button>
      </div>
    </article>
  );
};

// Post Editor Component
const PostEditor = ({ post, onSave, onCancel }) => {
  const { colors } = useTheme();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    title: post?.title || '',
    body: post?.body || '',
    category: post?.category || 'General',
    tags: post?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      let savedPost;
      if (post) {
        const response = await api.put(`/posts/${post._id}`, postData);
        savedPost = response.data.post;
        showNotification('Post updated successfully!', 'success');
      } else {
        const response = await api.post('/posts', postData);
        savedPost = response.data.post;
        showNotification('Post created successfully!', 'success');
      }
      
      onSave(savedPost);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save post';
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-[80vh] py-8">
      <div className={`max-w-4xl mx-auto ${colors.secondary} rounded-lg shadow-lg p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">
            {post ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onCancel}
            className={`p-2 rounded-full ${colors.buttonSecondary} hover:bg-red-500 hover:text-white transition-colors`}
            title="Cancel"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="title"
            placeholder="Post Title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full p-4 text-lg rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="General">General</option>
              <option value="Technology">Technology</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>

            <input
              type="text"
              name="tags"
              placeholder="Tags (comma separated)"
              value={formData.tags}
              onChange={handleChange}
              className={`p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          <textarea
            name="body"
            placeholder="Write your post content here..."
            value={formData.body}
            onChange={handleChange}
            rows={15}
            className={`w-full p-4 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            required
          />

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center space-x-2 ${colors.success} px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{post ? 'Update Post' : 'Publish Post'}</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className={`px-6 py-3 rounded-lg ${colors.buttonSecondary} font-medium transition-all duration-200 hover:scale-105`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Post View Modal Component
const PostView = ({ post, onClose }) => {
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadComments();
  }, [post._id]);

  const loadComments = async () => {
    try {
      const response = await api.get(`/comments/post/${post._id}`);
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const response = await api.post('/comments', {
        postID: post._id,
        comment: newComment.trim()
      });
      
      if (response.data.success) {
        setComments(prev => [response.data.comment, ...prev]);
        setNewComment('');
        showNotification('Comment added successfully!', 'success');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add comment';
      showNotification(message, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      showNotification('Comment deleted successfully', 'success');
    } catch (error) {
      showNotification('Failed to delete comment', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${colors.secondary} rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden w-full`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${colors.border}`}>
          <h1 className="text-3xl font-bold line-clamp-2 flex-1 mr-4">{post.title}</h1>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${colors.buttonSecondary} hover:bg-red-500 hover:text-white transition-colors flex-shrink-0`}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Post Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
              <span className={`${colors.textSecondary} flex items-center`}>
                <User size={16} className="mr-1" />
                {post.author.username}
              </span>
              <span className={`${colors.textSecondary} flex items-center`}>
                <Calendar size={16} className="mr-1" />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              {post.category && (
                <span className={`px-3 py-1 text-sm rounded-full ${colors.accent}`}>
                  {post.category}
                </span>
              )}
              {post.views > 0 && (
                <span className={`${colors.textSecondary} flex items-center`}>
                  <Eye size={16} className="mr-1" />
                  {post.views} views
                </span>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${colors.accent} ${colors.textSecondary}`}
                  >
                    <Tag size={14} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Post Content */}
            <div className={`${colors.textSecondary} mb-8 leading-relaxed whitespace-pre-wrap`}>
              {post.body}
            </div>

            {/* Comments Section */}
            <div className={`border-t ${colors.border} pt-6`}>
              <h3 className="text-xl font-bold mb-4">Comments ({comments.length})</h3>
              
              {/* Add Comment Form */}
              {user && (
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      className={`w-full p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className={`${colors.button} px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center space-x-2`}
                    >
                      {submittingComment ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <span>Add Comment</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {/* Comments List */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className={`${colors.accent} rounded-lg p-4`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-medium">{comment.userID.username}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`${colors.textSecondary} text-sm`}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {user && (user.role === 'Admin' || comment.userID.username === user.username) && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete Comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`${colors.textSecondary}`}>{comment.comment}</p>
                    </div>
                  ))}
                  
                  {comments.length === 0 && (
                    <p className={`${colors.textSecondary} text-center py-8`}>
                      No comments yet. {user ? 'Be the first to share your thoughts!' : 'Sign in to add a comment.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search and Filter Component
const SearchAndFilter = ({ onSearch, onFilter, loading }) => {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    onFilter(category);
  };

  return (
    <div className={`${colors.secondary} rounded-lg shadow-lg p-6 mb-6`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="md:col-span-2">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts by title, content, or tags..."
              className={`flex-1 p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg ${colors.button} font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center space-x-2`}
            >
              {loading ? <LoadingSpinner size="sm" /> : <Search size={16} />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </form>
        
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className={`p-3 rounded-lg ${colors.accent} ${colors.border} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">All Categories</option>
          <option value="Technology">Technology</option>
          <option value="Development">Development</option>
          <option value="Design">Design</option>
          <option value="Business">Business</option>
          <option value="General">General</option>
          <option value="Lifestyle">Lifestyle</option>
        </select>
      </div>
    </div>
  );
};

// Posts List Component
const PostsList = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showNotification } = useNotification();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/posts', { params });
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      showNotification('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchTerm) => {
    setSearchLoading(true);
    try {
      await loadPosts(searchTerm ? { search: searchTerm } : {});
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilter = async (category) => {
    setSearchLoading(true);
    try {
      await loadPosts(category ? { category } : {});
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSavePost = (savedPost) => {
    if (editingPost) {
      setPosts(prev => prev.map(p => p._id === savedPost._id ? savedPost : p));
    } else {
      setPosts(prev => [savedPost, ...prev]);
    }
    setEditingPost(null);
  };

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const canCreatePost = user && (user.role === 'Admin' || user.role === 'Editor');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Latest Posts</h1>
          <p className={`${colors.textSecondary} text-lg`}>
            Discover amazing content from our community
          </p>
        </div>
        
        {canCreatePost && (
          <button
            onClick={() => setEditingPost({})}
            className={`flex items-center space-x-2 ${colors.success} px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap`}
          >
            <Plus size={16} />
            <span>New Post</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        loading={searchLoading}
      />

      {/* Posts Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className={`${colors.textSecondary} mt-4`}>Loading posts...</p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className={`${colors.textSecondary} text-xl mb-4`}>
            No posts found.
          </p>
          {canCreatePost && (
            <button
              onClick={() => setEditingPost({})}
              className={`${colors.button} px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105`}
            >
              Create Your First Post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={setEditingPost}
              onDelete={handleDeletePost}
              onView={setViewingPost}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editingPost && (
        <PostEditor
          post={editingPost._id ? editingPost : null}
          onSave={handleSavePost}
          onCancel={() => setEditingPost(null)}
        />
      )}

      {viewingPost && (
        <PostView
          post={viewingPost}
          onClose={() => setViewingPost(null)}
        />
      )}
    </div>
  );
};

// Create Post Component
const CreatePost = () => {
  const [post, setPost] = useState(null);
  const { colors } = useTheme();
  const { showNotification } = useNotification();

  const handleSave = (savedPost) => {
    setPost(null);
    showNotification('Post created successfully!', 'success');
  };

  const handleCancel = () => {
    setPost(null);
  };

  return (
    <div className="container mx-auto px-4">
      <PostEditor
        post={post}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

// Main App Component
const BlogApp = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('posts');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Header activeView={activeView} setActiveView={setActiveView} />
        <AuthForm onSuccess={() => setActiveView('posts')} />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'create':
        return <CreatePost />;
      case 'posts':
      default:
        return <PostsList />;
    }
  };

  return (
    <div>
      <Header activeView={activeView} setActiveView={setActiveView} />
      {renderContent()}
    </div>
  );
};

// Main App with Providers
export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BlogApp />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
