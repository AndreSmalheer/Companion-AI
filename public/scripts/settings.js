const settings_btn = document.getElementById("settings-icon");

async function verifyConnection(url, statusDiv) {
  statusDiv.textContent = "Verifying...";

  try {
    const response = await fetch(url + "/status", { method: "GET" });
    const data = await response.json();

    if (data.visible === true) {
      statusDiv.textContent = "Connection successful!";
      statusDiv.style.color = "green";
    } else {
      statusDiv.textContent = "Connection failed: status is false";
      statusDiv.style.color = "red";
    }
  } catch (error) {
    statusDiv.textContent = "Connection error: " + error.message;
    statusDiv.style.color = "red";
  }
}

document.getElementById("verifyBtn").addEventListener("click", () => {
  const url = document.getElementById("electronUrl").value;
  const statusDiv = document.getElementById("status");
  verifyConnection(url, statusDiv);
});

settings_btn.addEventListener("click", () => {
  const settingsPanel = document.getElementById("settings");
  settingsPanel.classList.toggle("hidden");
});
