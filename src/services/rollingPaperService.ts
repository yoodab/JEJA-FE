import api from './api';
import type { RollingPaper, RollingPaperCreateRequest, MessageCreateRequest, StickerCreateRequest } from '../types/rollingPaper';

// Service for handling rolling paper operations
export const rollingPaperService = {
  createRollingPaper: async (data: RollingPaperCreateRequest): Promise<number> => {
    const response = await api.post('/api/rolling-papers', data);
    return response.data;
  },

  getAllRollingPapers: async (): Promise<RollingPaper[]> => {
    const response = await api.get('/api/rolling-papers');
    return response.data;
  },

  getRollingPaper: async (id: number): Promise<RollingPaper> => {
    const response = await api.get(`/api/rolling-papers/${id}`);
    return response.data;
  },

  addMessage: async (rollingPaperId: number, data: MessageCreateRequest): Promise<number> => {
    const response = await api.post(`/api/rolling-papers/${rollingPaperId}/messages`, data);
    return response.data;
  },

  addSticker: async (rollingPaperId: number, data: StickerCreateRequest): Promise<number> => {
    const response = await api.post(`/api/rolling-papers/${rollingPaperId}/stickers`, data);
    return response.data;
  },

  updateRollingPaper: async (id: number, data: { title?: string, theme?: string, backgroundConfig?: Record<string, unknown> }): Promise<void> => {
    await api.put(`/api/rolling-papers/${id}`, data);
  },

  deleteRollingPaper: async (id: number): Promise<void> => {
    await api.delete(`/api/rolling-papers/${id}`);
  }
};
