// @ts-nocheck
const CACHE_NAME = "quilchena-golf-v1";
const urlsToCache = ["/", "/quilchena_logo.png", "/favicon.ico"];

// Install event - cache resources
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    }),
  );
});

// Push notification event
self.addEventListener("push", function (event) {
  let data;
  let title = "Quilchena Golf Club";
  let body = "You have a new notification";

  if (event.data) {
    try {
      // Try to parse as JSON first
      data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: "/quilchena_logo.png",
    badge: "/quilchena_logo.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
    actions: [
      {
        action: "open",
        title: "Open App",
      },
    ],
    requireInteraction: false,
    silent: false,
  };

  // Only show notification if we have permission
  if (Notification.permission === "granted") {
    event.waitUntil(self.registration.showNotification(title, options));
  } else {
    console.log("Notification permission not granted");
  }
});

// Notification click event
self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(function (clientList) {
        // If a window is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
    );
  }
});
