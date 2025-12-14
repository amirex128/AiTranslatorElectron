import { IPCResponse } from '../types/errors';

export const readClipboard = async (): Promise<string> => {
  // Prefer IPC method (Electron's clipboard API) over browser API
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const response: IPCResponse<string> = await window.electronAPI.readClipboard();
      // Check if response is successful
      if (response && 'success' in response) {
        if (response.success) {
          return response.data || '';
        } else if ('error' in response) {
          console.error('Error reading clipboard via IPC:', response.error);
        }
      }
    } catch (error) {
      console.error('Error reading clipboard via IPC:', error);
    }
    
    // Fallback to browser API if IPC fails
    if (navigator.clipboard) {
      try {
        return await navigator.clipboard.readText();
      } catch (browserError) {
        console.error('Error reading clipboard via browser API:', browserError);
      }
    }
  }
  return '';
};

export const writeClipboard = async (text: string): Promise<boolean> => {
  // Prefer IPC method (Electron's clipboard API) over browser API
  // Electron's clipboard API doesn't require permissions
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const response: IPCResponse<boolean> = await window.electronAPI.writeClipboard(text);
      // Check if response is successful
      if (response && 'success' in response) {
        if (response.success) {
          return response.data === true;
        } else if ('error' in response) {
          console.error('Error writing clipboard via IPC:', response.error);
        }
      }
    } catch (error) {
      console.error('Error writing clipboard via IPC:', error);
    }
    
    // Fallback to browser API if IPC fails
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (browserError) {
        console.error('Error writing clipboard via browser API:', browserError);
        return false;
      }
    }
  }
  return false;
};

