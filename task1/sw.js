const FilesToCache = [
  "/pages/index.html",
  "/pages/page1.html",
  "/js/main.js",
  "/offline.html",
  "/error404.html",
  "/manifest.json",
];

const StaticDB = "Pages";

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(StaticDB)
      .then((cache) => {
        console.log("Service Worker: Caching Files");
        return cache.addAll(FilesToCache);
      })
      .catch((err) => {
        console.log("Error in Caching:", err);
      }),
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  console.log("fetching request", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("found in cache", event.request.url);
        return response;
      } else {
        console.log("server request");
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 404) {
              return caches.match("/error404.html");
            }

            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();

              caches.open(StaticDB).then((cache) => {
                cache.put(event.request, responseClone);
                console.log(
                  "Service Worker: Cached new request:",
                  event.request.url,
                );
              });
            }

            return networkResponse;
          })
          .catch(() => {
            console.log("Service Worker: Network failed, checking fallback...");
            return caches.match("/offline.html");
          });
      }
    }),
  );
});


