// Service worker da MIF BRECHO.
// - Deixa o navegador reconhecer o site como app instalável (sem guardar nada no aparelho).
// - Mostra os avisos de pedido novo no celular das administradoras.
 
self.addEventListener("install", () => {
  self.skipWaiting();
});
 
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
 
// Sem handler de "fetch" de propósito: sem ele, o navegador ignora o
// service worker nas requisições (mais rápido) e o site continua sempre
// carregando a versão mais nova, sem cache.
 
self.addEventListener("push", (event) => {
  let data = {};
 
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
 
  const title = data.title || "MIF BRECHO";
 
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/pwa-icon/192?variant=admin&v=2",
      badge: "/pwa-icon/192?variant=admin&v=2",
      tag: data.tag || "pedido",
      renotify: true,
      data: { url: data.url || "/admin/pedidos" },
    })
  );
});
 
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
 
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/admin/pedidos",
    self.location.origin
  ).href;
 
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            return client.focus().then((focused) => {
              if (focused && "navigate" in focused) return focused.navigate(target);
            });
          }
        }
 
        return self.clients.openWindow(target);
      })
  );
});
