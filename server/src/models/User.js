import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: null,
    },
    // Academic Information (Student)
    studentId: {
      type: String,
      trim: true,
      maxlength: [50, 'Student ID cannot exceed 50 characters'],
      default: null,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
      default: null,
    },
    section: {
      type: String,
      trim: true,
      maxlength: [20, 'Section cannot exceed 20 characters'],
      default: null,
    },
    yearOfStudy: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', null, ''],
      default: null,
    },
    // Faculty Information (Teacher)
    employeeId: {
      type: String,
      trim: true,
      maxlength: [50, 'Employee ID cannot exceed 50 characters'],
      default: null,
    },
    designation: {
      type: String,
      enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Faculty', null, ''],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (Mongoose 9: async pre-hooks use promise, not next callback)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});


// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: return safe public object (no password)
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    profilePicture: this.profilePicture,
    phone: this.phone,
    bio: this.bio,
    studentId: this.studentId || null,
    rollNumber: this.studentId || null,
    department: this.department || null,
    section: this.section || null,
    yearOfStudy: this.yearOfStudy || null,
    employeeId: this.employeeId || null,
    facultyId: this.employeeId || null,
    designation: this.designation || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Index for performance (email unique index is already created by unique:true in schema)
userSchema.index({ role: 1 });


const User = mongoose.model('User', userSchema);

export default User;
