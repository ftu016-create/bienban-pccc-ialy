import { UserRole } from '../types';

const PIN_STORAGE_KEY = 'pccc_ialy_admin_pin_v1';
const ROLE_STORAGE_KEY = 'pccc_ialy_user_role_v1';
const PIN_UPDATED_AT_KEY = 'pccc_ialy_pin_updated_at_v1';

// Default PIN matching atvsld-ialy
export const DEFAULT_PIN = 'ialy2026';

function getApiUrl(endpoint: string): string {
  if (typeof window !== 'undefined') {
    return endpoint;
  }
  return `http://localhost:3000${endpoint}`;
}

// Cloud backup endpoints (Cross-device synchronization fallback)
const CLOUD_ENDPOINTS = [
  'https://api.restful-api.dev/objects/ff808181a067127101a09a4df5a50866',
  'https://api.restful-api.dev/objects/ff808181a067127101a09a4e6f830869',
];

type PinChangeCallback = (newPin: string) => void;
type RoleChangeCallback = (newRole: UserRole) => void;

class AdminAuthService {
  private pinCallbacks: Set<PinChangeCallback> = new Set();
  private roleCallbacks: Set<RoleChangeCallback> = new Set();
  private isSyncing = false;
  private cachedPin: string = DEFAULT_PIN;

  constructor() {
    if (typeof window !== 'undefined') {
      // Sync immediately on focus or when tab becomes visible
      window.addEventListener('focus', () => {
        this.fetchRemotePin(true);
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.fetchRemotePin(true);
        }
      });

      // Periodic check every 5 seconds so any other machine's change is detected instantly
      setInterval(() => {
        this.fetchRemotePin();
      }, 5000);

      // Run immediately at startup
      this.fetchRemotePin(true);
    }
  }

  getUserRole(): UserRole {
    if (typeof window === 'undefined') return 'viewer';
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return saved === 'admin' ? 'admin' : 'viewer';
  }

  getRole(): UserRole {
    return this.getUserRole();
  }

  setUserRole(role: UserRole): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    this.roleCallbacks.forEach((cb) => cb(role));
  }

  getPin(): string {
    if (typeof window !== 'undefined') {
      const pin = localStorage.getItem(PIN_STORAGE_KEY);
      if (pin && pin.trim().length >= 4) {
        return pin.trim();
      }
    }
    return this.cachedPin || DEFAULT_PIN;
  }

  verifyPin(inputPin: string): boolean {
    const current = this.getPin();
    return inputPin.trim() === current;
  }

  async updatePin(oldPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
    const cleanedOld = oldPin.trim();
    const cleanedNew = newPin.trim();

    if (cleanedNew.length < 4) {
      return { success: false, message: 'Mã PIN mới phải từ 4 ký tự trở lên.' };
    }

    if (cleanedNew === cleanedOld) {
      return { success: false, message: 'Mã PIN mới không được trùng với mã PIN hiện tại.' };
    }

    // Try server API first (same-origin, 100% reliable across devices)
    try {
      const res = await fetch(getApiUrl('/api/admin/pin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin: cleanedOld, newPin: cleanedNew }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.cachedPin = cleanedNew;
        const nowIso = new Date().toISOString();
        if (typeof window !== 'undefined') {
          localStorage.setItem(PIN_STORAGE_KEY, cleanedNew);
          localStorage.setItem(PIN_UPDATED_AT_KEY, nowIso);
        }
        this.pinCallbacks.forEach((cb) => cb(cleanedNew));
        return {
          success: true,
          message: 'Đã đổi mã PIN Admin thành công và đồng bộ tới tất cả máy tính!',
        };
      } else if (data && data.message) {
        return { success: false, message: data.message };
      }
    } catch (apiErr) {
      console.warn('Server /api/admin/pin unavailable, using cloud endpoints fallback', apiErr);
    }

    // Fallback if /api/admin/pin failed (e.g. running purely static)
    await this.fetchRemotePin(true);
    const current = this.getPin();
    if (cleanedOld !== current) {
      return { success: false, message: 'Mã PIN cũ không chính xác. Bạn không có quyền đổi mã PIN.' };
    }

    const nowIso = new Date().toISOString();
    this.cachedPin = cleanedNew;
    if (typeof window !== 'undefined') {
      localStorage.setItem(PIN_STORAGE_KEY, cleanedNew);
      localStorage.setItem(PIN_UPDATED_AT_KEY, nowIso);
    }
    this.pinCallbacks.forEach((cb) => cb(cleanedNew));

    const isSynced = await this.broadcastPinToCloud(cleanedNew, nowIso);

    return {
      success: true,
      message: isSynced
        ? 'Đã đổi mã PIN Admin thành công và đồng bộ tới tất cả máy tính!'
        : 'Đã đổi mã PIN Admin thành công trên máy (đang đồng bộ đám mây)!',
    };
  }

  async broadcastPinToCloud(pin: string, updatedAt: string): Promise<boolean> {
    let successCount = 0;
    const promises = CLOUD_ENDPOINTS.map(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'pccc_ialy_pin_config',
            data: { pin, updated_at: updatedAt },
          }),
        });
        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.warn('Failed to sync PIN to endpoint:', url, err);
      }
    });

    try {
      await Promise.allSettled(promises);
    } catch (e) {
      // Ignored
    }

    return successCount > 0;
  }

  async fetchRemotePin(force = false): Promise<string | null> {
    if (this.isSyncing && !force) return null;
    this.isSyncing = true;

    try {
      // 1. First priority: App Server API (/api/admin/pin)
      try {
        const serverRes = await fetch(getApiUrl(`/api/admin/pin?_t=${Date.now()}`), {
          cache: 'no-store',
        });
        if (serverRes.ok) {
          const json = await serverRes.json();
          if (json && json.success && json.pin && typeof json.pin === 'string' && json.pin.trim().length >= 4) {
            const remotePin = json.pin.trim();
            const currentLocal = this.getPin();
            this.cachedPin = remotePin;

            if (remotePin !== currentLocal) {
              if (typeof window !== 'undefined') {
                localStorage.setItem(PIN_STORAGE_KEY, remotePin);
                if (json.updated_at) {
                  localStorage.setItem(PIN_UPDATED_AT_KEY, json.updated_at);
                }
              }
              this.pinCallbacks.forEach((cb) => cb(remotePin));
            }
            return remotePin;
          }
        }
      } catch (err) {
        // App server API might be offline, fallback to cloud
      }

      // 2. Second priority: Cloud endpoints (api.restful-api.dev)
      for (const url of CLOUD_ENDPOINTS) {
        try {
          const cacheBuster = `${url}?_t=${Date.now()}`;
          const res = await fetch(cacheBuster, {
            cache: 'no-store',
          });
          if (res.ok) {
            const json = await res.json();
            const remotePin = json?.data?.pin;
            const remoteUpdatedAt = json?.data?.updated_at;

            if (remotePin && typeof remotePin === 'string' && remotePin.trim().length >= 4) {
              const currentLocal = this.getPin();
              this.cachedPin = remotePin.trim();

              if (remotePin.trim() !== currentLocal) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(PIN_STORAGE_KEY, remotePin.trim());
                  if (remoteUpdatedAt) {
                    localStorage.setItem(PIN_UPDATED_AT_KEY, remoteUpdatedAt);
                  }
                }
                this.pinCallbacks.forEach((cb) => cb(remotePin.trim()));
              }
              return remotePin.trim();
            }
          }
        } catch (e) {
          // try next endpoint
        }
      }
    } finally {
      this.isSyncing = false;
    }
    return null;
  }

  async verifyPinAsync(inputPin: string): Promise<boolean> {
    const trimmed = inputPin.trim();
    if (!trimmed) return false;

    // Check fast local cache first
    if (trimmed === this.getPin()) {
      return true;
    }

    // 1. Try server verify endpoint first
    try {
      const res = await fetch(getApiUrl('/api/admin/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid === true) {
          this.cachedPin = trimmed;
          if (typeof window !== 'undefined') {
            localStorage.setItem(PIN_STORAGE_KEY, trimmed);
          }
          return true;
        }
      }
    } catch (e) {
      // Server not reachable
    }

    // 2. Fallback: fetch remote PIN and compare
    const remotePin = await this.fetchRemotePin(true);
    if (remotePin && trimmed === remotePin) {
      return true;
    }

    return trimmed === this.getPin();
  }

  onPinChange(callback: PinChangeCallback): () => void {
    this.pinCallbacks.add(callback);
    return () => this.pinCallbacks.delete(callback);
  }

  onRoleChange(callback: RoleChangeCallback): () => void {
    this.roleCallbacks.add(callback);
    return () => this.roleCallbacks.delete(callback);
  }

  subscribe(callback: RoleChangeCallback): () => void {
    return this.onRoleChange(callback);
  }

  logout(): void {
    this.setUserRole('viewer');
  }

  login(): void {
    this.setUserRole('admin');
  }
}

export const adminAuthService = new AdminAuthService();
