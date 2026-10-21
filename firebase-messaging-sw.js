// Fica rodando "escondido" no celular pra receber notificação com o app fechado.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyArC6doyHeI3uowTUWG-ZXY4HXJaKClBR4",
  authDomain: "viradafloripa-10ce1.firebaseapp.com",
  projectId: "viradafloripa-10ce1",
  storageBucket: "viradafloripa-10ce1.firebasestorage.app",
  messagingSenderId: "186595627671",
  appId: "1:186595627671:web:849b43a7d800b85c5d8fd2"
});
firebase.messaging(); // a notificação em si é mostrada automaticamente pelo Firebase

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
    for (const c of lista) if ("focus" in c) return c.focus();
    return clients.openWindow("./");
  }));
});
