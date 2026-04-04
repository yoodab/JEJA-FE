import api from './api';
import type { RollingPaper, RollingPaperCreateRequest, MessageCreateRequest, StickerCreateRequest } from '../types/rollingPaper';
import type { Page } from '../types/api';

// Service for handling rolling paper operations
export const rollingPaperService = {
  createRollingPaper: async (data: RollingPaperCreateRequest): Promise<number> => {
    const response = await api.post('/api/rolling-papers', data);
    return response.data;
  },

  getAllRollingPapers: async (title?: string, page: number = 0, size: number = 12): Promise<Page<RollingPaper>> => {
    const response = await api.get('/api/rolling-papers', {
      params: { title, page, size }
    });
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

  updateRollingPaper: async (id: number, data: { title?: string, theme?: string, backgroundConfig?: string | Record<string, unknown> }): Promise<void> => {
    const payload = { ...data };
    if (payload.backgroundConfig && typeof payload.backgroundConfig !== 'string') {
        payload.backgroundConfig = JSON.stringify(payload.backgroundConfig);
    }
    await api.put(`/api/rolling-papers/${id}`, payload);
  },

  deleteRollingPaper: async (id: number): Promise<void> => {
    await api.delete(`/api/rolling-papers/${id}`);
  }
};
