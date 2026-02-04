import api from './api';

const API_URL = '/api/rolling-papers/themes';

export interface RollingPaperTheme {
  id: number;
  name: string;
  themeConfig: string; // JSON string
}

export const themeService = {
  getAllThemes: async () => {
    const response = await api.get<RollingPaperTheme[]>(API_URL);
    return response.data;
  },

  createTheme: async (name: string, config: Record<string, unknown>) => {
    const response = await api.post<RollingPaperTheme>(API_URL, {
      name,
      themeConfig: JSON.stringify(config)
    });
    return response.data;
  },

  updateTheme: async (id: number, name: string, config: Record<string, unknown>) => {
    const response = await api.put<RollingPaperTheme>(`${API_URL}/${id}`, {
      name,
      themeConfig: JSON.stringify(config)
    });
    return response.data;
  },

  deleteTheme: async (id: number) => {
    await api.delete(`${API_URL}/${id}`);
  }
};
