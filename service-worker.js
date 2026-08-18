// 公众号助推助手 Service Worker
// 策略：导航请求（HTML）走网络优先，保证每次都能拿到最新版本；静态资源走缓存优先，离线可用且更快。
const CACHE = "gzh-app-v2";
const ASSETS = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon.svg"];

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
  // 跨域请求（AI 接口、同步接口）和非 GET 直接放行，不缓存
  if (url.origin !== location.origin || e.request.method !== "GET") return;

  // 导航类请求（HTML 页面）：网络优先，保证每次都能拿到最新版本
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // 其他静态资源：缓存优先，离线可用且更快
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
