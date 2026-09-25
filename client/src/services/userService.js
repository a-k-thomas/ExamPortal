import API from './api';

/**
 * User Service — Phase 6 / Requirement 1 & 8C
 * Handles profile management and admin/teacher user management.
 */

// Get current user's profile or all users (admin/teacher)
export const getUsers = async (params = {}) => {
  const response = await API.get('/users', { params });
  return response.data;
};

// Update authenticated user's own profile
export const updateProfile = async (profileData) => {
  const response = await API.put('/users/profile', profileData);
  return response.data;
};

// Admin only: update user role
export const updateUserRole = async (userId, role) => {
  const response = await API.put(`/users/${userId}/role`, { role });
  return response.data;
};

// Admin & Teacher: get single user by ID (teachers are scoped to students only)
export const getUserById = async (userId) => {
  const response = await API.get(`/users/${userId}`);
  return response.data;
};

// Admin only: delete user
export const deleteUser = async (userId) => {
  const response = await API.delete(`/users/${userId}`);
  return response.data;
};

export default {
  getUsers,
  getUserById,
  updateProfile,
  updateUserRole,
  deleteUser,
};
