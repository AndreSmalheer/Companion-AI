const settings_btn = document.getElementById("settings-icon");

settings_btn.addEventListener("click", () => {
  const settingsPanel = document.getElementById("settings");
  settingsPanel.classList.toggle("hidden");
});
