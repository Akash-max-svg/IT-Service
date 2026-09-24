const User = require('../models/User');

// @desc    Get all users (with filters)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, search, department } = req.query;
    const query = {};

    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (department && department !== 'ALL') {
      query.departmentName = department;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of agents for ticket assignment
// @route   GET /api/users/agents
// @access  Private (Agent, Admin)
const getAgents = async (req, res) => {
  try {
    const agents = await User.find({
      role: { $in: ['Agent', 'Admin'] },
      isActive: true,
    })
      .select('name email role specialization departmentName avatar')
      .sort({ name: 1 });

    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user details & role
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, role, departmentName, specialization, phone, isActive } = req.body;

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (departmentName) user.departmentName = departmentName;
    if (specialization !== undefined) user.specialization = specialization;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      departmentName: updatedUser.departmentName,
      specialization: updatedUser.specialization,
      phone: updatedUser.phone,
      isActive: updatedUser.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete / deactivate user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    // Soft delete / deactivate
    user.isActive = false;
    await user.save();

    res.json({ message: `User ${user.name} has been deactivated` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAgents,
  updateUser,
  deleteUser,
};
