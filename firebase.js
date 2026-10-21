// Liga o app ao Firebase: banco de dados (Firestore) e notificações (Cloud Messaging).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyArC6doyHeI3uowTUWG-ZXY4HXJaKClBR4",
  authDomain: "viradafloripa-10ce1.firebaseapp.com",
  projectId: "viradafloripa-10ce1",
  storageBucket: "viradafloripa-10ce1.firebasestorage.app",
  messagingSenderId: "186595627671",
  appId: "1:186595627671:web:849b43a7d800b85c5d8fd2"
};
const VAPID = "BJU5wIxIrHe-zCbc0zt-wwGk24fDhjRimQX3n-TAg2kekZ1OThOXtn6TlBn_HFlbfSI6Sy6JbYXj51pBAJe2xN8";

const app = initializeApp(firebaseConfig);
const fs = getFirestore(app);

// Mesmo "jeito de usar" que o app já tinha: db.collection(...) e db.doc("colecao/id")
function embrulhar(d) { return { id: d.id, exists: d.exists(), data: () => d.data() }; }
window.dbFirebase = {
  collection(nome) {
    const c = collection(fs, nome);
    return {
      onSnapshot(cb, erro) { return onSnapshot(c, (s) => cb({ docs: s.docs.map(embrulhar), size: s.size, empty: s.empty }), erro); },
      add(dados) { return addDoc(c, dados); }
    };
  },
  doc(caminho) {
    const [col, id] = caminho.split("/");
    const r = doc(fs, col, id);
    return {
      onSnapshot(cb, erro) { return onSnapshot(r, (d) => cb(embrulhar(d)), erro); },
      set(dados) { return setDoc(r, dados); },
      update(dados) { return updateDoc(r, dados); },
      delete() { return deleteDoc(r); }
    };
  }
};

// ---------- notificações ----------
// Retorna uma mensagem pra mostrar na tela.
window.ativarNotificacoes = async function (nome) {
  const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const instalado = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return iphone && !instalado
      ? "No iPhone: abre no Safari, toca em Compartilhar → Adicionar à Tela de Início, abre pelo ícone e toca aqui de novo."
      : "Esse navegador não aceita notificação. Tenta pelo Chrome (Android) ou pelo app instalado (iPhone).";
  }
  if (!(await isSupported())) return "Esse navegador não aceita notificação do Firebase.";
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return "Permissão negada. Libera as notificações desse site nas configurações do celular.";
  const reg = await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID, serviceWorkerRegistration: reg });
  if (!token) return "Não consegui gerar o código do aparelho. Tenta de novo.";
  await setDoc(doc(fs, "tokens", token), { nome: nome || "", criado: Date.now() });
  try { localStorage.setItem("virada:notif", "1"); } catch (e) {}
  onMessage(messaging, (m) => window.dispatchEvent(new CustomEvent("aviso-push", { detail: m.notification || {} })));
  return "Notificações ativadas! 🔔";
};

// Quem já ativou antes: renova o código do aparelho em silêncio ao abrir o app.
try {
  if (localStorage.getItem("virada:notif") === "1" && "Notification" in window && Notification.permission === "granted") {
    const eu = JSON.parse(localStorage.getItem("virada:eu") || "null");
    window.ativarNotificacoes(eu).catch(() => {});
  }
} catch (e) {}
