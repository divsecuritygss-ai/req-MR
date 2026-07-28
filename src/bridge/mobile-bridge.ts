import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { KeepAwake } from '@capacitor-community/keep-awake';

export interface ScanResult {
  success: boolean;
  code: string | null;
  error?: string;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export class MobileBridge {
  private static instance: MobileBridge;

  private constructor() {
    this.initNetworkListener();
  }

  public static getInstance(): MobileBridge {
    if (!MobileBridge.instance) {
      MobileBridge.instance = new MobileBridge();
    }
    return MobileBridge.instance;
  }

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public getPlatform(): string {
    return Capacitor.getPlatform();
  }

  public async triggerHaptic(type: 'success' | 'warning' | 'error' | 'light'): Promise<void> {
    if (!this.isNative()) {
      console.log(`[Web Fallback] Haptic triggered: ${type}`);
      return;
    }

    try {
      if (type === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        const notificationType = 
          type === 'success' ? NotificationType.Success :
          type === 'warning' ? NotificationType.Warning : NotificationType.Error;
        await Haptics.notification({ type: notificationType });
      }
    } catch (err) {
      console.warn('Haptics failed:', err);
    }
  }

  public async scanQRCode(): Promise<ScanResult> {
    if (!this.isNative()) {
      console.warn('Native Barcode Scanner only works on Android/iOS native runtime.');
      return { success: false, code: null, error: 'Web Fallback active. Use Web Cam simulator.' };
    }

    try {
      // Minta Izin Kamera
      const status = await BarcodeScanner.requestPermissions();
      if (!status.camera) {
        return { success: false, code: null, error: 'Izin kamera ditolak oleh pengguna.' };
      }

      // Mulai Scan
      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        await this.triggerHaptic('success');
        return { success: true, code: barcodes[0].rawValue };
      }

      return { success: false, code: null, error: 'Tidak ada QR Code terdeteksi.' };
    } catch (err: any) {
      await this.triggerHaptic('error');
      return { success: false, code: null, error: err?.message || 'Gagal memindai QR code.' };
    }
  }

  public async setTabletKeepAwake(enable: boolean): Promise<void> {
    if (!this.isNative()) {
      console.log(`[Web Fallback] KeepAwake status: ${enable}`);
      return;
    }

    try {
      if (enable) {
        await KeepAwake.keepAwake();
        console.log('Screen KeepAwake ENABLED for Kiosk Tablet Mode.');
      } else {
        await KeepAwake.allowSleep();
        console.log('Screen KeepAwake DISABLED.');
      }
    } catch (err) {
      console.error('Failed to set KeepAwake:', err);
    }
  }

  public async scheduleCheckInReminder(roomName: string, minutesLeft: number): Promise<void> {
    if (!this.isNative()) return;

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: `⏰ Pengingat Check-In ${roomName}`,
              body: `Meeting Anda akan dimulai dalam ${minutesLeft} menit. Silakan scan QR code di pintu untuk check-in.`,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 1000 * 5) }, // Trigger 5 detik untuk pengujian
              sound: 'beep.wav',
              actionTypeId: 'CHECK_IN_ACTION',
            }
          ]
        });
      }
    } catch (err) {
      console.error('Failed to schedule notification:', err);
    }
  }

  private async initNetworkListener(): Promise<void> {
    if (!this.isNative()) return;

    Network.addListener('networkStatusChange', (status) => {
      console.log(`Network status changed: ${status.connected ? 'ONLINE' : 'OFFLINE'}`);
      if (!status.connected) {
        this.triggerHaptic('warning');
      }
    });
  }

  public async getNetworkStatus(): Promise<NetworkStatus> {
    if (!this.isNative()) {
      return { connected: navigator.onLine, connectionType: 'wifi' };
    }
    const status = await Network.getStatus();
    return { connected: status.connected, connectionType: status.connectionType };
  }
}

export const mobileBridge = MobileBridge.getInstance();
