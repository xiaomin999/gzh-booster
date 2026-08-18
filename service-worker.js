// 公众号助推助手 Service Worker：缓存应用外壳，离线可用
const CACHE = "gzh-app-v1";
const ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // 跨域请求（AI 接口、同步接口）和带方法非 GET 的直接放行，不缓存
  if (url.origin !== location.origin || e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((r) =>
      r ||
      fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
