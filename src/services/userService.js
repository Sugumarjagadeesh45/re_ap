import getApiUrl from '../utiliti/config';

const API_URL = getApiUrl;

class UserService {
  // Get user profile
  static async getUserProfile(token) {
    try {
      console.log('Making request to:', `${API_URL}/api/user/profile`);
      
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(profileData, token) {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(profilePicture, token) {
    try {
      const response = await fetch(`${API_URL}/api/user/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePicture }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  }

  // Get user stats
  static async getUserStats(token) {
    try {
      const response = await fetch(`${API_URL}/api/user/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Search users
  static async searchUsers(query, token) {
    try {
      const response = await fetch(`${API_URL}/api/user/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }
}

export default UserService;