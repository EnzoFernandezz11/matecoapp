self.addEventListener("push", (event) => {
  let data = {
    title: "MatecoApp",
    body: "Tenes una novedad en tu mesa de mate.",
    url: "/rondas",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/mate-apple.png",
      badge: "/icons/mate-apple.png",
      data: { url: data.url || "/rondas" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/rondas";
  event.waitUntil(clients.openWindow(target));
});
