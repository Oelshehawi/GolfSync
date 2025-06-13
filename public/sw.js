// @ts-nocheck

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
