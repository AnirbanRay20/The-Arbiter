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

// ── Image Analysis (file upload) ── NEW
export const analyzeImageFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(`${API_BASE_URL}/api/analyze-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error("Image Analysis Error:", error);
    throw error;
  }
};

// ── Image Analysis (URL) ── NEW
export const analyzeImageUrl = async (url) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/analyze-image-url`, { url });
    return response.data;
  } catch (error) {
    console.error("Image URL Analysis Error:", error);
    throw error;
  }
};
