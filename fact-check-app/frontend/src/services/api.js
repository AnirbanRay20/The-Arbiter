import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const detectAIText = async (text) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/detect-ai`, { text });
    return response.data.data;
  } catch (error) {
    console.error("AI Detection Error:", error);
    throw error;
  }
};

export const getFactCheckStreamUrl = () => `${API_BASE_URL}/api/factcheck`;

export const saveChat = async (chatData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/chats`, chatData);
    return response.data;
  } catch (error) {
    console.error("Save Chat Error:", error);
    throw error;
  }
};

export const getChat = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/chats/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get Chat Error:", error);
    throw error;
  }
};
