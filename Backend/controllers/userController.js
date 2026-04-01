import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import cloudinaryService from '../utils/cloudinaryService.js';

const { cloudinary, uploader } = cloudinaryService;

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;
    const query = {};

    if (role && role !== 'All') query.role = role;
    if (status === 'Active') query.isActive = true;
    if (status === 'Inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('appointments', 'date time status type')
      .populate('prescriptions', 'date status medicines');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get provider directory
// @route   GET /api/users/providers
// @access  Private
const getProviders = async (req, res) => {
  try {
    const { role, search, specialty } = req.query;
    const query = {
      role: role ? role : { $in: ['doctor', 'counselor'] },
      isActive: true
    };

    if (role && !['doctor', 'counselor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid provider role' });
    }

    if (specialty && specialty !== 'All') {
      query.specialty = specialty;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const providers = await User.find(query)
      .select('name email role specialty experience bio education profileImage isVerified')
      .sort({ name: 1 });

    res.json({ providers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get provider by ID
// @route   GET /api/users/providers/:id
// @access  Private
const getProviderById = async (req, res) => {
  try {
    const provider = await User.findById(req.params.id)
      .select('name email role specialty experience bio education profileImage isVerified');

    if (!provider || !['doctor', 'counselor'].includes(provider.role)) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      name,
      address,
      bloodType,
      allergies,
      dateOfBirth,
      gender,
      phone,
      specialty,
      bio,
      experience,
      education
    } = req.body;

    user.name = name || user.name;
    user.address = address || user.address;
    user.bloodType = bloodType || user.bloodType;
    user.allergies = allergies || user.allergies;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.gender = gender || user.gender;
    user.phone = phone || user.phone;

    if (['doctor', 'counselor'].includes(user.role)) {
      user.specialty = specialty || user.specialty;
      user.bio = bio || user.bio;
      user.experience = experience ?? user.experience;
      user.education = Array.isArray(education) ? education : user.education;
    }

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user by admin
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, role, isActive, isVerified } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    user.isVerified = isVerified !== undefined ? isVerified : user.isVerified;

    await user.save();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'User Updated',
      module: 'Users',
      details: `Updated user: ${user.name} (${user.email})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info'
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'User Deleted',
      module: 'Users',
      details: `Deleted user: ${user.name} (${user.email})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'warning'
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/upload-image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.file) {
      try {
        const result = await uploader.upload(req.file.path, {
          folder: 'profile-images',
          width: 500,
          height: 500,
          crop: 'fill'
        });
        user.profileImage = result.secure_url;
      } catch (cloudinaryError) {
        console.log('Cloudinary error, saving locally:', cloudinaryError.message);
        user.profileImage = `/uploads/${req.file.filename}`;
      }

      await user.save();
      res.json({ imageUrl: user.profileImage });
    } else {
      res.status(400).json({ message: 'No file uploaded' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getUsers,
  getUserById,
  getUserProfile,
  getProviders,
  getProviderById,
  updateProfile,
  updateUser,
  deleteUser,
  uploadProfileImage
};
