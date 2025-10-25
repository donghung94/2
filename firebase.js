import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALblbqW_VrZh2r7sPJ8Q6XT2fGbk0dsFg",
  authDomain: "donghung-3208d.firebaseapp.com",
  projectId: "donghung-3208d",
  storageBucket: "donghung-3208d.firebasestorage.app",
  messagingSenderId: "753379492663",
  appId: "1:753379492663:web:baff34f2c0bac00e02d0b2",
  measurementId: "G-06PF7MH1P0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Tạo ID thiết bị ổn định cho mỗi trình duyệt
function getDeviceId() {
  const KEY = "dh_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() :
         (Date.now().toString(36) + Math.random().toString(36).slice(2));
    localStorage.setItem(KEY, id);
  }
  return id;
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const deviceId = getDeviceId();
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // Dữ liệu sẽ được ghi TUÂN THEO RULES phía trên
  await setDoc(ref, {
    email: user.email,
    activeDevice: snap.exists() ? (snap.data().activeDevice ?? deviceId) : deviceId,
    lastLogin: new Date().toISOString()
  }, { merge: true });

  // Đọc lại để xác nhận: nếu activeDevice khác deviceId => bị chặn
  const check = await getDoc(ref);
  if (check.exists() && check.data().activeDevice !== deviceId) {
    await signOut(auth);
    throw new Error("Tài khoản đang đăng nhập ở thiết bị khác.");
  }
}

export async function logout() {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, { activeDevice: null }, { merge: true }); // giải phóng slot
  await signOut(auth);
}
