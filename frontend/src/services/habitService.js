import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const habitService = {
  // Get all habits
  async getHabits() {
    try {
      const response = await axios.get(`${API}/habits`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch habits:', error);
      throw error;
    }
  },

  // Create a new habit
  async createHabit(habitData) {
    try {
      const response = await axios.post(`${API}/habits`, habitData);
      return response.data;
    } catch (error) {
      console.error('Failed to create habit:', error);
      throw error;
    }
  },

  // Update a habit
  async updateHabit(habitId, updateData) {
    try {
      const response = await axios.put(`${API}/habits/${habitId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update habit:', error);
      throw error;
    }
  },

  // Delete a habit
  async deleteHabit(habitId) {
    try {
      await axios.delete(`${API}/habits/${habitId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete habit:', error);
      throw error;
    }
  },

  // Toggle habit completion
  async toggleCompletion(habitId, date) {
    try {
      const response = await axios.post(`${API}/habits/${habitId}/completions`, {
        date: date
      });
      return response.data;
    } catch (error) {
      console.error('Failed to toggle completion:', error);
      throw error;
    }
  },

  // Get habit completions
  async getCompletions(habitId, days = 30) {
    try {
      const response = await axios.get(`${API}/habits/${habitId}/completions?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch completions:', error);
      throw error;
    }
  },

  // Get overall stats
  async getStats() {
    try {
      const response = await axios.get(`${API}/habits/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  }
};