/**
 * Wander AI — Client-side Chat Logic
 * Works on both the full /ai page and the listing show modal
 */

// ═══════════════════════════════════════════
// FULL PAGE CHAT (/ai)
// ═══════════════════════════════════════════

const conversationHistory = [];
let isStreaming = false;

const aiWelcome    = document.getElementById("aiWelcome");
const aiMessages   = document.getElementById("aiMessages");
const aiInput      = document.getElementById("aiInput");
const aiSendBtn    = document.getElementById("aiSendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const newChatBtn   = document.getElementById("newChatBtn");

// Auto-resize textarea
if (aiInput) {
  aiInput.addEventListener("input", () => {
    aiInput.style.height = "auto";
    aiInput.style.height = Math.min(aiInput.scrollHeight, 160) + "px";
    aiSendBtn.disabled = aiInput.value.trim() === "" || isStreaming;
  });

  aiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!aiSendBtn.disabled) sendMessage();
    }
  });
}

if (aiSendBtn) {
  aiSendBtn.addEventListener("click", sendMessage);
}

if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    conversationHistory.length = 0;
    aiMessages.innerHTML = "";
    aiMessages.classList.remove("has-messages");
    if (aiWelcome) aiWelcome.style.display = "flex";
    typingIndicator.style.display = "none";
    if (aiInput) { aiInput.value = ""; aiInput.style.height = "auto"; }
    if (aiSendBtn) aiSendBtn.disabled = true;
  });
}

// Welcome chips and sidebar suggestion chips
document.querySelectorAll(".welcome-chip, .suggestion-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const prompt = chip.getAttribute("data-prompt");
    if (prompt && aiInput) {
      aiInput.value = prompt;
      aiInput.style.height = "auto";
      aiInput.style.height = Math.min(aiInput.scrollHeight, 160) + "px";
      aiSendBtn.disabled = false;
      sendMessage();
    }
  });
});

async function sendMessage(customMessage = null) {
  const text = customMessage || (aiInput ? aiInput.value.trim() : "");
  if (!text || isStreaming) return;

  // Hide welcome, show messages
  if (aiWelcome) aiWelcome.style.display = "none";
  aiMessages.classList.add("has-messages");

  // Add user message to UI
  appendMessage("user", text);
  conversationHistory.push({ role: "user", content: text });

  // Clear input
  if (aiInput) { aiInput.value = ""; aiInput.style.height = "auto"; }
  if (aiSendBtn) aiSendBtn.disabled = true;

  // Show typing
  typingIndicator.style.display = "flex";
  scrollToBottom(aiMessages);

  isStreaming = true;
  let fullResponse = "";

  try {
    const response = await fetch("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Hide typing, create AI bubble for streaming
    typingIndicator.style.display = "none";
    const aiMsgEl = appendMessage("ai", "");
    const bubbleEl = aiMsgEl.querySelector(".msg-bubble");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.error) {
              bubbleEl.textContent = "⚠️ " + data.error;
              break;
            }
            if (data.text) {
              fullResponse += data.text;
              bubbleEl.innerHTML = formatAIText(fullResponse);
              scrollToBottom(aiMessages);
            }
          } catch (e) { /* ignore parse errors */ }
        }
      }
    }

    conversationHistory.push({ role: "assistant", content: fullResponse });

  } catch (err) {
    console.error("Chat error:", err);
    typingIndicator.style.display = "none";
    appendMessage("ai", "⚠️ Sorry, I'm having trouble connecting. Please try again.");
  } finally {
    isStreaming = false;
    if (aiSendBtn) aiSendBtn.disabled = false;
    scrollToBottom(aiMessages);
  }
}

function appendMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user-row" : "ai-row"}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "U" : "✨";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = role === "user" ? escapeHtml(text) : formatAIText(text);

  row.appendChild(avatar);
  row.appendChild(bubble);
  aiMessages.appendChild(row);
  scrollToBottom(aiMessages);
  return row;
}

function formatAIText(text) {
  // Basic markdown-like formatting
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s+(.+)/gm, "<strong>$1</strong>")
    .replace(/^-\s+(.+)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.+)$/, "<p>$1</p>");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function scrollToBottom(el) {
  if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
}


// ═══════════════════════════════════════════
// LISTING PAGE — Ask AI Modal
// ═══════════════════════════════════════════

const askAiBtn   = document.getElementById("askAiBtn");
const aiModalOverlay = document.getElementById("aiModalOverlay");
const aiModalClose   = document.getElementById("aiModalClose");
const modalMessages  = document.getElementById("modalMessages");
const modalInput     = document.getElementById("modalInput");
const modalSend      = document.getElementById("modalSend");

const modalHistory = [];
let modalStreaming = false;

if (askAiBtn && aiModalOverlay) {
  askAiBtn.addEventListener("click", () => {
    aiModalOverlay.classList.add("show");
    document.body.style.overflow = "hidden";

    // Auto send initial context if no messages yet
    if (modalHistory.length === 0) {
      const listingName = askAiBtn.getAttribute("data-title") || "";
      const listingLocation = askAiBtn.getAttribute("data-location") || "";
      const listingCountry  = askAiBtn.getAttribute("data-country") || "";
      const listingDesc     = askAiBtn.getAttribute("data-desc") || "";
      const initMsg = `I'm looking at a property on Wanderlust: "${listingName}" located in ${listingLocation}, ${listingCountry}. ${listingDesc ? 'Description: ' + listingDesc : ''} Can you tell me about this location, nearby attractions, the best time to visit, and what to expect from a stay here?`;
      sendModalMessage(initMsg);
    }

    if (modalInput) setTimeout(() => modalInput.focus(), 300);
  });
}

if (aiModalClose) {
  aiModalClose.addEventListener("click", closeModal);
}

if (aiModalOverlay) {
  aiModalOverlay.addEventListener("click", (e) => {
    if (e.target === aiModalOverlay) closeModal();
  });
}

function closeModal() {
  if (aiModalOverlay) {
    aiModalOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }
}

if (modalInput) {
  modalInput.addEventListener("input", () => {
    modalSend.disabled = modalInput.value.trim() === "" || modalStreaming;
  });
  modalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!modalSend.disabled) sendModalMessage();
    }
  });
}

if (modalSend) {
  modalSend.addEventListener("click", () => sendModalMessage());
}

async function sendModalMessage(customText = null) {
  const text = customText || (modalInput ? modalInput.value.trim() : "");
  if (!text || modalStreaming) return;

  appendModalMessage("user", text);
  modalHistory.push({ role: "user", content: text });

  if (modalInput) { modalInput.value = ""; }
  if (modalSend) modalSend.disabled = true;

  // Typing
  const typingRow = document.createElement("div");
  typingRow.className = "modal-msg-row ai-row";
  typingRow.id = "modal-typing-row";
  typingRow.innerHTML = `
    <div class="modal-msg-avatar">✨</div>
    <div class="modal-typing"><span></span><span></span><span></span></div>
  `;
  if (modalMessages) { modalMessages.appendChild(typingRow); scrollToBottom(modalMessages); }

  modalStreaming = true;
  let fullResponse = "";

  try {
    const response = await fetch("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: modalHistory }),
    });

    if (!response.ok) throw new Error("HTTP " + response.status);

    // Remove typing, add streaming bubble
    document.getElementById("modal-typing-row")?.remove();
    const msgEl = appendModalMessage("ai", "");
    const bubbleEl = msgEl.querySelector(".modal-msg-bubble");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.text) {
              fullResponse += data.text;
              bubbleEl.innerHTML = formatAIText(fullResponse);
              scrollToBottom(modalMessages);
            }
          } catch(e) {}
        }
      }
    }

    modalHistory.push({ role: "assistant", content: fullResponse });

  } catch (err) {
    document.getElementById("modal-typing-row")?.remove();
    appendModalMessage("ai", "⚠️ Sorry, something went wrong. Please try again.");
    console.error(err);
  } finally {
    modalStreaming = false;
    if (modalSend) modalSend.disabled = !modalInput?.value.trim();
    scrollToBottom(modalMessages);
  }
}

function appendModalMessage(role, text) {
  const row = document.createElement("div");
  row.className = `modal-msg-row ${role === "user" ? "user-row" : "ai-row"}`;
  row.innerHTML = `
    <div class="modal-msg-avatar">${role === "user" ? "U" : "✨"}</div>
    <div class="modal-msg-bubble">${role === "user" ? escapeHtml(text) : formatAIText(text)}</div>
  `;
  if (modalMessages) modalMessages.appendChild(row);
  scrollToBottom(modalMessages);
  return row;
}
