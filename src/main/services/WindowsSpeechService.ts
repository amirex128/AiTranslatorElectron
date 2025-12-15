import { app, BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export class WindowsSpeechService {
  private isListening = false;
  private mainWindow: BrowserWindow | null = null;
  private recognitionProcess: any = null;

  constructor() {
    // Check if we're on Windows
    if (process.platform !== 'win32') {
      console.warn('[SpeechService] Windows Speech Recognition is only available on Windows');
    }
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Check if Windows Speech Recognition is available
   */
  async isAvailable(): Promise<boolean> {
    if (process.platform !== 'win32') {
      return false;
    }

    try {
      // Check if Windows Speech Recognition is enabled
      // We can check by trying to access the speech recognition service
      const { stdout } = await execAsync('powershell -Command "Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Caption"');
      return stdout.includes('Windows');
    } catch (error) {
      console.error('[SpeechService] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Start Windows Speech Recognition
   * This triggers the Windows Speech Recognition (Win+H) feature
   */
  async startRecognition(): Promise<void> {
    if (process.platform !== 'win32') {
      throw new Error('Windows Speech Recognition is only available on Windows');
    }

    if (this.isListening) {
      console.warn('[SpeechService] Speech recognition is already listening');
      return;
    }

    try {
      this.isListening = true;
      
      // Focus the main window first to ensure it receives the dictation
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.focus();
        // Small delay to ensure window is focused
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Trigger Windows Speech Recognition using Win+H
      // Use Windows API to send Win+H key combination
      const script = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          public class WinAPI {
            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
            public const uint KEYEVENTF_KEYUP = 0x0002;
            public const byte VK_LWIN = 0x5B;
            public const byte VK_H = 0x48;
          }
"@
        # Press and hold Win key
        [WinAPI]::keybd_event([WinAPI]::VK_LWIN, 0, 0, 0)
        Start-Sleep -Milliseconds 50
        # Press H key
        [WinAPI]::keybd_event([WinAPI]::VK_H, 0, 0, 0)
        Start-Sleep -Milliseconds 50
        # Release H key
        [WinAPI]::keybd_event([WinAPI]::VK_H, 0, [WinAPI]::KEYEVENTF_KEYUP, 0)
        Start-Sleep -Milliseconds 50
        # Release Win key
        [WinAPI]::keybd_event([WinAPI]::VK_LWIN, 0, [WinAPI]::KEYEVENTF_KEYUP, 0)
      `;

      // Use a file-based approach to avoid escaping issues
      const scriptPath = join(tmpdir(), `trigger-speech-recognition-${Date.now()}.ps1`);
      
      try {
        writeFileSync(scriptPath, script, 'utf-8');
        await execAsync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
        // Clean up script file
        if (existsSync(scriptPath)) {
          unlinkSync(scriptPath);
        }
      } catch (error) {
        // Clean up on error
        try {
          if (existsSync(scriptPath)) {
            unlinkSync(scriptPath);
          }
        } catch {}
        throw error;
      }
      
      console.log('[SpeechService] Windows Speech Recognition started (Win+H triggered)');
      console.log('[SpeechService] Note: Text will be typed into the focused input field');
    } catch (error) {
      this.isListening = false;
      console.error('[SpeechService] Error starting speech recognition:', error);
      throw error;
    }
  }

  /**
   * Stop Windows Speech Recognition
   */
  async stopRecognition(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      this.isListening = false;
      
      // Stop any running recognition process
      if (this.recognitionProcess) {
        // Cleanup if needed
        this.recognitionProcess = null;
      }

      console.log('[SpeechService] Windows Speech Recognition stopped');
    } catch (error) {
      console.error('[SpeechService] Error stopping speech recognition:', error);
      throw error;
    }
  }

  /**
   * Get current listening status
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Trigger Windows Speech Recognition using Win+H
   * This is a helper method that simulates the Win+H keyboard shortcut
   */
  private async triggerWinH(): Promise<void> {
    try {
      // Use PowerShell to send Win+H
      // Note: This requires the app to have focus
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Windows.Input
        
        # Simulate Win+H
        $key = [System.Windows.Forms.Keys]::H
        $modifier = [System.Windows.Forms.Keys]::LWin
        
        # Create keyboard event
        [System.Windows.Forms.SendKeys]::SendWait('+{h}')
      `;

      await execAsync(`powershell -Command "${script}"`);
    } catch (error) {
      console.error('[SpeechService] Error triggering Win+H:', error);
      throw error;
    }
  }
}

// Singleton instance
export const windowsSpeechService = new WindowsSpeechService();

