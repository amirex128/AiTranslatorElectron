import { ipcMain, net, IpcMainInvokeEvent } from 'electron';
import { handleIPC } from '../utils';

interface TTSAudioData {
  data: string;
  mimeType: string;
}

/**
 * Registers TTS (Text-to-Speech) IPC handlers
 */
export function registerTTSHandlers(): void {
  ipcMain.handle('tts:fetch-audio', handleIPC(async (_event: IpcMainInvokeEvent, url: string): Promise<TTSAudioData> => {
    return await new Promise<TTSAudioData>((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Origin': 'https://translate.google.com',
        },
      });

      const chunks: Buffer[] = [];

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP error! status: ${response.statusCode}`));
          return;
        }

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const contentType = response.headers['content-type'];
          const mimeType = Array.isArray(contentType) ? contentType[0] : (contentType || 'audio/mpeg');
          resolve({ 
            data: base64, 
            mimeType
          });
        });

        response.on('error', reject);
      });

      request.on('error', reject);
      request.end();
    });
  }));
}

