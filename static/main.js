async function ollama_stream(input) {
  const history = document.getElementById("history_container");

  // Add user message
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.textContent = input;
  history.appendChild(userMsg);

  // Add loading animation
  const loading = document.createElement("div");
  loading.className = "loading";
  loading.innerHTML = `
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        `;
  history.appendChild(loading);
  history.scrollTop = history.scrollHeight;

  try {
    const response = await fetch("http://127.0.0.1:5000/ollama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;

    // Create bot message container
    const botMsg = document.createElement("div");
    botMsg.className = "message";
    history.appendChild(botMsg);

    // Remove loading
    history.removeChild(loading);

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        botMsg.textContent += chunk;
        history.scrollTop = history.scrollHeight;
      }
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

async function get_history() {
  try {
    const response = await fetch("/get_chat_history");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
  }
}

async function load_history() {
  const history = await get_history();
  const history_div = document.getElementById("history_container");

  for (const message of history) {
    id = message.id;
    sender = message.sender;
    content = message.message;
    timestamp = message.timestamp;

    const div = document.createElement("div");

    if (sender === "user") {
      div.className = "message user";
    } else {
      div.className = "message";
    }

    div.textContent = content;
    history_div.appendChild(div);
  }
}

load_history();

const input = document.getElementById("text-input");
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && input.value.trim() !== "") {
    const userInput = input.value;
    input.value = "";
    ollama_stream(userInput);
  }
});
