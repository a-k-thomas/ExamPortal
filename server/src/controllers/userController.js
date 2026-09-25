import User from '../models/User.js';

// ─── GET /api/users ───────────────────────────────────── Admin & Teacher
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Teachers can only access student user accounts
    if (req.user.role === 'teacher') {
      query.role = 'student';
    } else if (role) {
      query.role = role;
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      users: users.map((u) => u.toPublicJSON()),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ─── GET /api/users/:id ──────────────────────────────────────────── Admin & Teacher
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Teachers can only access student profiles
    if (req.user.role === 'teacher' && user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Teachers can only access student profiles.',
      });
    }

    return res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

// ─── PUT /api/users/profile ──────────────────────────────────── Authenticated user
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      profilePicture,
      // Student-specific fields
      studentId,
      rollNumber,
      department,
      section,
      yearOfStudy,
      // Teacher-specific fields
      employeeId,
      facultyId,
      designation,
    } = req.body;

    const updates = {};

    // Common permitted fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
      }
      updates.name = name.trim();
    }

    if (phone !== undefined) {
      updates.phone = typeof phone === 'string' ? phone.trim() : phone;
    }

    if (bio !== undefined) {
      updates.bio = typeof bio === 'string' ? bio.trim() : bio;
    }

    if (profilePicture !== undefined) {
      updates.profilePicture = typeof profilePicture === 'string' ? profilePicture.trim() : profilePicture;
    }

    // Role-specific field whitelisting & validation
    if (req.user.role === 'student') {
      const sId = studentId !== undefined ? studentId : rollNumber;
      if (sId !== undefined) {
        updates.studentId = typeof sId === 'string' ? sId.trim() : sId;
      }

      if (department !== undefined) {
        updates.department = typeof department === 'string' ? department.trim() : department;
      }

      if (section !== undefined) {
        updates.section = typeof section === 'string' ? section.trim() : section;
      }

      if (yearOfStudy !== undefined) {
        const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', ''];
        if (yearOfStudy && !validYears.includes(yearOfStudy)) {
          return res.status(400).json({
            success: false,
            message: 'Year of Study must be one of: 1st Year, 2nd Year, 3rd Year, 4th Year',
          });
        }
        updates.yearOfStudy = yearOfStudy || null;
      }
    } else if (req.user.role === 'teacher') {
      const eId = employeeId !== undefined ? employeeId : facultyId;
      if (eId !== undefined) {
        updates.employeeId = typeof eId === 'string' ? eId.trim() : eId;
      }

      if (department !== undefined) {
        updates.department = typeof department === 'string' ? department.trim() : department;
      }

      if (designation !== undefined) {
        const validDesignations = [
          'Professor',
          'Associate Professor',
          'Assistant Professor',
          'Lecturer',
          'Faculty',
          '',
        ];
        if (designation && !validDesignations.includes(designation)) {
          return res.status(400).json({
            success: false,
            message: 'Designation must be one of: Professor, Associate Professor, Assistant Professor, Lecturer, Faculty',
          });
        }
        updates.designation = designation || null;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, message: 'Profile updated.', user: user.toPublicJSON() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ─── PUT /api/users/:id/role ─────────────────────────────────────── Admin only
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Prevent self-role modification
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot modify your own role.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, message: 'User role updated.', user: user.toPublicJSON() });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
};

// ─── DELETE /api/users/:id ───────────────────────────────────────── Admin only
export const deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};
