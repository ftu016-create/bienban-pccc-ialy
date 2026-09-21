import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { ReportData } from '../types';

export const DEFAULT_ADMIN_PIN = 'ialy2026';

export const firebaseConfig = {
  projectId: "gen-lang-client-0778830071",
  appId: "1:234782235959:web:35ef8bf839ecc785faceb2",
  apiKey: "AIzaSyB635oHSqG6izNaCCVXnkOYyyivQuAkxok",
  authDomain: "gen-lang-client-0778830071.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-binbnkimtrapcccc-ff7e2d63-680f-46a0-a252-2cd6373b0f3d",
  storageBucket: "gen-lang-client-0778830071.firebasestorage.app",
  messagingSenderId: "234782235959",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate connection to Firestore on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'app_settings', 'system_config'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or checking connection.');
    }
  }
}
testConnection();

/**
 * Lấy mã PIN Admin được đồng bộ từ Firestore.
 */
export async function getSharedAdminPin(): Promise<string> {
  const docRef = doc(db, 'app_settings', 'system_config');

  // 1. Thử lấy trực tiếp từ server để không bị dính cache cũ trên máy khác
  try {
    const serverSnap = await getDocFromServer(docRef);
    if (serverSnap.exists() && serverSnap.data()?.adminPin) {
      const pin = String(serverSnap.data().adminPin).trim();
      try {
        localStorage.setItem('pccc_ialy_admin_pin_v1', pin);
      } catch (_) {}
      return pin;
    }
  } catch (serverErr) {
    console.warn('Không thể lấy trực tiếp từ server, thử cache Firestore:', serverErr);
  }

  // 2. Thử getDoc bình thường (bao gồm offline cache của SDK)
  try {
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.adminPin) {
      const pin = String(snap.data().adminPin).trim();
      try {
        localStorage.setItem('pccc_ialy_admin_pin_v1', pin);
      } catch (_) {}
      return pin;
    }
  } catch (err) {
    console.warn('Chưa lấy được PIN từ Firestore:', err);
  }

  // 3. Fallback bộ nhớ máy hoặc mã mặc định
  return (typeof localStorage !== 'undefined' ? localStorage.getItem('pccc_ialy_admin_pin_v1') : null) || DEFAULT_ADMIN_PIN;
}

/**
 * Cập nhật mã PIN Admin đồng bộ lên đám mây Firestore cho tất cả các máy.
 */
export async function setSharedAdminPin(newPin: string): Promise<void> {
  const cleanPin = newPin.trim();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pccc_ialy_admin_pin_v1', cleanPin);
    }
  } catch (_) {}

  try {
    const docRef = doc(db, 'app_settings', 'system_config');
    await setDoc(
      docRef,
      {
        adminPin: cleanPin,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Lỗi khi lưu mã PIN lên Firestore:', err);
    throw err;
  }
}

/**
 * Lắng nghe thay đổi mã PIN Admin theo thời gian thực (real-time) cho tất cả các máy
 */
export function subscribeToSharedAdminPin(onPinChange: (pin: string) => void): () => void {
  try {
    const docRef = doc(db, 'app_settings', 'system_config');
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: false },
      (snap) => {
        if (snap.exists() && snap.data()?.adminPin) {
          const pin = String(snap.data().adminPin).trim();
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('pccc_ialy_admin_pin_v1', pin);
            }
          } catch (_) {}
          onPinChange(pin);
        }
      },
      (err) => {
        console.warn('Lỗi kết nối theo dõi mã PIN real-time:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Không thể khởi tạo theo dõi mã PIN:', err);
    return () => {};
  }
}

/**
 * Tải toàn bộ danh sách biên bản từ đám mây dùng chung
 */
export async function fetchAllSharedReports(): Promise<ReportData[] | null> {
  try {
    const colRef = collection(db, 'reports');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const reports: ReportData[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.dataJson) {
          try {
            const r = JSON.parse(data.dataJson);
            reports.push(r);
          } catch (_) {}
        }
      });
      if (reports.length > 0) {
        return reports;
      }
    }
  } catch (err) {
    console.warn('Lỗi lấy danh sách báo cáo từ Firestore:', err);
  }
  return null;
}

/**
 * Lắng nghe thay đổi danh sách biên bản theo thời gian thực (real-time) cho tất cả các máy
 */
export function subscribeToSharedReports(onReportsChange: (reports: ReportData[]) => void): () => void {
  try {
    const colRef = collection(db, 'reports');
    const unsubscribe = onSnapshot(
      colRef,
      { includeMetadataChanges: false },
      (snap) => {
        if (!snap.empty) {
          const reports: ReportData[] = [];
          snap.forEach((d) => {
            const data = d.data();
            if (data.dataJson) {
              try {
                const r = JSON.parse(data.dataJson);
                reports.push(r);
              } catch (_) {}
            }
          });
          if (reports.length > 0) {
            onReportsChange(reports);
          }
        }
      },
      (err) => {
        console.warn('Lỗi theo dõi báo cáo real-time:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Không thể đăng ký theo dõi báo cáo:', err);
    return () => {};
  }
}

/**
 * Lưu hoặc cập nhật biên bản lên Firestore cho các máy khác cùng thấy
 */
export async function saveReportToFirestore(report: ReportData): Promise<void> {
  try {
    const docRef = doc(db, 'reports', report.id);
    await setDoc(
      docRef,
      {
        id: report.id,
        month: report.report_month || '',
        reportDate: report.header_day ? `${report.header_day}/${report.header_month}/${report.header_year}` : '',
        dataJson: JSON.stringify(report),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Lỗi đồng bộ báo cáo lên Firestore:', err);
  }
}

/**
 * Xóa biên bản trên Firestore
 */
export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'reports', reportId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Lỗi xóa báo cáo trên Firestore:', err);
  }
}
