const User = require('../models/User');
const Department = require('../models/Department');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail } = require('../services/emailService');

// Helper to generate 6-digit code
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user & dispatch email verification
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentName, phone, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
    }

    // Resolve department if provided
    let department = null;
    if (departmentName) {
      const deptDoc = await Department.findOne({ name: departmentName });
      if (deptDoc) department = deptDoc._id;
    }

    // Role support: Admin, Agent, Employee
    const userRole = ['Employee', 'Agent', 'Admin'].includes(role) ? role : 'Employee';
    const verificationCode = generateOTP();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    let user;
    if (existingUser && !existingUser.isVerified) {
      // Update unverified user with new credentials
      existingUser.name = name;
      existingUser.password = password;
      existingUser.role = userRole;
      existingUser.department = department;
      existingUser.departmentName = departmentName || 'General';
      existingUser.phone = phone || '';
      existingUser.specialization = specialization || (userRole === 'Agent' ? 'General IT Support' : '');
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email: cleanEmail,
        password,
        role: userRole,
        department,
        departmentName: departmentName || 'General',
        phone: phone || '',
        specialization: specialization || (userRole === 'Agent' ? 'General IT Support' : ''),
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
      });
    }

    // Dispatch verification email to the user's email address
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      role: user.role,
      message: `Verification code sent to ${user.email}. Please verify your email to activate your account.`,
      devCode: verificationCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email address using 6-digit code
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.isVerified) {
      const token = generateToken(user._id, user.role);
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentName: user.departmentName,
        specialization: user.specialization,
        phone: user.phone,
        avatar: user.avatar,
        token,
        message: 'Account is already verified.',
      });
    }

    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      return res.status(400).json({ message: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

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
      message: 'Email verified successfully! Welcome to IT Service Desk.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-code
// @access  Public
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please sign in.' });
    }

    const verificationCode = generateOTP();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      role: user.role,
    });

    res.json({
      success: true,
      message: `A new verification code has been dispatched to ${user.email}`,
      devCode: verificationCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check email verification status
    if (user.isVerified === false) {
      const verificationCode = generateOTP();
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        code: verificationCode,
        role: user.role,
      });

      return res.status(403).json({
        requiresVerification: true,
        email: user.email,
        role: user.role,
        message: 'Your email address is not yet verified. A fresh verification code has been sent to your email.',
        devCode: verificationCode,
      });
    }

    const token = generateToken(user._id, user.role);

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
    res.status(500).json({ message: error.message });
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
  verifyEmail,
  resendVerificationCode,
  loginUser,
  getMe,
  updateProfile,
};

