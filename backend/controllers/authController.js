const User = require('../models/User');
const Department = require('../models/Department');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentName, phone, specialization } = req.body;

    // 1. Validate required inputs
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Check if email already exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // 3. Resolve department reference if provided
    let department = null;
    if (departmentName) {
      const deptDoc = await Department.findOne({ name: departmentName });
      if (deptDoc) department = deptDoc._id;
    }

    // 4. Validate Role (Employee, Agent, Admin)
    const userRole = ['Employee', 'Agent', 'Admin'].includes(role) ? role : 'Employee';

    // 5. Create user in MongoDB
    // Password is automatically hashed using bcrypt in the User model pre-save hook
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: userRole,
      department,
      departmentName: departmentName || 'Information Technology',
      phone: phone || '',
      specialization: specialization || (userRole === 'Agent' ? 'General IT Support' : ''),
      isActive: true,
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentName: user.departmentName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Search MongoDB for user with the entered email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    // 4. Compare entered plain-text password with hashed password stored in MongoDB using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 5. Credentials verified: Generate JWT token
    const token = generateToken(user._id, user.role);

    // 6. Return token and user profile (excluding password)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentName: user.departmentName,
      specialization: user.specialization,
      phone: user.phone,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('department');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.specialization = req.body.specialization || user.specialization;
    if (req.body.departmentName) {
      user.departmentName = req.body.departmentName;
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      departmentName: updatedUser.departmentName,
      specialization: updatedUser.specialization,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id, updatedUser.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
