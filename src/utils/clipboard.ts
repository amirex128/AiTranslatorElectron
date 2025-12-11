export const readClipboard = async (): Promise<string> => {
  if (typeof window !== 'undefined' && navigator.clipboard) {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error('Error reading clipboard:', error);
      return '';
    }
  }
  return '';
};

export const writeClipboard = async (text: string): Promise<boolean> => {
  if (typeof window !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error writing clipboard:', error);
      return false;
    }
  }
  return false;
};

