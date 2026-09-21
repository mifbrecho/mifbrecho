// Service worker mínimo: deixa o navegador reconhecer o site como app instalável.
// Ele NÃO guarda nada no aparelho, então o site sempre carrega a versão mais nova.
self.addEventListener("install", () => {
  self.skipWaiting();
});
 
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
 
self.addEventListener("fetch", () => {
  // sem cache de propósito
});
