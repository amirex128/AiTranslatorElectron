import { create } from 'zustand';
import { Bookmark } from '../main/database/BookmarkService';

interface BookmarkFilters {
  searchQuery?: string;
  sortBy?: 'date' | 'alphabet' | 'readCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface BookmarkState {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: BookmarkFilters;
  isLoading: boolean;
  loadBookmarks: (filters?: BookmarkFilters) => Promise<void>;
  addBookmark: (englishText: string) => Promise<Bookmark | null>;
  removeBookmark: (id: string) => Promise<boolean>;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<Bookmark | null>;
  checkBookmark: (englishText: string) => Promise<Bookmark | null>;
  incrementReadCount: (id: string) => Promise<Bookmark | null>;
  resetReadCount: (id: string) => Promise<Bookmark | null>;
  generateMainExamples: (id: string) => Promise<Bookmark | null>;
  generateFallbackExamples: (id: string) => Promise<Bookmark | null>;
  updateBookmarkInList: (updatedBookmark: Bookmark) => void;
  setFilters: (filters: Partial<BookmarkFilters>) => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  total: 0,
  page: 1,
  pageSize: 50,
  totalPages: 0,
  filters: {
    page: 1,
    pageSize: 50,
  },
  isLoading: false,

  loadBookmarks: async (filters?: BookmarkFilters) => {
    set({ isLoading: true });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const response = await window.electronAPI.getAllBookmarks(currentFilters);
      
      if (response.success && response.data) {
        set({
          bookmarks: response.data.bookmarks,
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages,
          filters: currentFilters,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[BookmarkStore] Error loading bookmarks:', error);
      set({ isLoading: false });
    }
  },

  addBookmark: async (englishText: string) => {
    try {
      const response = await window.electronAPI.addBookmark(englishText);
      if (response.success && response.data) {
        // Reload bookmarks to get updated list
        await get().loadBookmarks(get().filters);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[BookmarkStore] Error adding bookmark:', error);
      return null;
    }
  },

  removeBookmark: async (id: string) => {
    try {
      const response = await window.electronAPI.removeBookmark(id);
      if (response.success && response.data) {
        // Reload bookmarks to get updated list
        await get().loadBookmarks(get().filters);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[BookmarkStore] Error removing bookmark:', error);
      return false;
    }
  },

  updateBookmark: async (id: string, updates: Partial<Bookmark>) => {
    try {
      const response = await window.electronAPI.updateBookmark(id, updates);
      if (response.success && response.data) {
        // Reload bookmarks to get updated list
        await get().loadBookmarks(get().filters);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[BookmarkStore] Error updating bookmark:', error);
      return null;
    }
  },

  checkBookmark: async (englishText: string) => {
    try {
      const response = await window.electronAPI.checkBookmark(englishText);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[BookmarkStore] Error checking bookmark:', error);
      return null;
    }
  },

  incrementReadCount: async (id: string) => {
    try {
      const response = await window.electronAPI.incrementBookmarkReadCount(id);
      if (response.success && response.data) {
        // Reload bookmarks to get updated list
        await get().loadBookmarks(get().filters);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[BookmarkStore] Error incrementing read count:', error);
      return null;
    }
  },

  resetReadCount: async (id: string) => {
    try {
      const response = await window.electronAPI.resetBookmarkReadCount(id);
      if (response.success && response.data) {
        // Reload bookmarks to get updated list
        await get().loadBookmarks(get().filters);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[BookmarkStore] Error resetting read count:', error);
      return null;
    }
  },

  generateMainExamples: async (id: string) => {
    try {
      const response = await window.electronAPI.generateBookmarkMainExamples(id);
      if (response.success && response.data) {
        console.log('[BookmarkStore] Main examples generated, updating bookmark in list:', response.data);
        // Update bookmark directly in list
        get().updateBookmarkInList(response.data);
        // Optional: reload for sync
        await get().loadBookmarks(get().filters);
        return response.data;
      }
      console.warn('[BookmarkStore] Failed to generate main examples:', response);
      return null;
    } catch (error) {
      console.error('[BookmarkStore] Error generating main examples:', error);
      return null;
    }
  },

  generateFallbackExamples: async (id: string) => {
    try {
      const response = await window.electronAPI.generateBookmarkFallbackExamples(id);
      if (response.success && response.data) {
        console.log('[BookmarkStore] Fallback examples generated, updating bookmark in list:', response.data);
        // Update bookmark directly in list
        get().updateBookmarkInList(response.data);
        // Optional: reload for sync
        await get().loadBookmarks(get().filters);
        return response.data;
      }
      console.warn('[BookmarkStore] Failed to generate fallback examples:', response);
      return null;
    } catch (error) {
      console.error('[BookmarkStore] Error generating fallback examples:', error);
      return null;
    }
  },

  updateBookmarkInList: (updatedBookmark: Bookmark) => {
    set((state) => {
      const updatedBookmarks = state.bookmarks.map(b => 
        b.id === updatedBookmark.id ? updatedBookmark : b
      );
      console.log('[BookmarkStore] Updated bookmark in list:', {
        id: updatedBookmark.id,
        hasMainTranslation: !!updatedBookmark.mainTranslation,
        hasFallbackTranslation: !!updatedBookmark.fallbackTranslation,
        hasMainExamples: !!updatedBookmark.mainExamples && updatedBookmark.mainExamples.length > 0,
        hasFallbackExamples: !!updatedBookmark.fallbackExamples && updatedBookmark.fallbackExamples.length > 0,
      });
      return {
        bookmarks: updatedBookmarks,
      };
    });
  },

  setFilters: (filters: Partial<BookmarkFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },
}));

