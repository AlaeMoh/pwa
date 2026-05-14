let deferredPrompt;

const installBtn = document.getElementById("installBtn");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((err) => {
        console.log("SW registration failed:", err);
      });
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  console.log("Install prompt ready");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) {
    alert("Install prompt is not available yet.");
    return;
  }

  deferredPrompt.prompt();

  const result = await deferredPrompt.userChoice;

  console.log(result.outcome);

  deferredPrompt = null;
});

window.addEventListener("appinstalled", () => {
  console.log("App installed");
});