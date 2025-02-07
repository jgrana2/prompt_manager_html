// index.js

// Cached DOM elements
const elements = {
  promptList: document.getElementById('prompt-list'),
  searchBar: document.getElementById('search-bar'),
  clearSearchBtn: document.getElementById('clear-search'),
  newPromptBtn: document.getElementById('new-prompt-btn'),
  newPromptModal: document.getElementById('new-prompt-modal'),
  cancelBtn: document.getElementById('cancel-btn'),
  saveBtn: document.getElementById('save-btn'),
  newPromptText: document.getElementById('new-prompt-text'),
  promptDisplay: document.getElementById('prompt-display'),
  conversation: document.getElementById('conversation'),
  initialInstruction: document.getElementById('initial-instruction'),
  contentContainer: document.getElementById('content-container'),
  userInputField: document.getElementById('user-input'),
  runButton: document.getElementById('run-button'),
  userInputTooltip: document.getElementById('user-input-tooltip'),
};

const { 
  promptList, searchBar, clearSearchBtn, newPromptBtn, newPromptModal, 
  cancelBtn, saveBtn, newPromptText, promptDisplay, conversation, 
  initialInstruction, contentContainer, userInputField, runButton, 
  userInputTooltip 
} = elements;

const OPENAI_API_KEY = window.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

let messages = [];

// Storage Functions
const loadStoredPrompts = () => {
  const stored = localStorage.getItem('savedPrompts');
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error parsing stored prompts:', e);
    return [];
  }
};

const savePrompts = (prompts) => {
  localStorage.setItem('savedPrompts', JSON.stringify(prompts));
};

let prompts = loadStoredPrompts();

// Utility Functions
const createElement = (tag, className, attributes = {}) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
};

const createPromptListItem = (text) => {
  const li = createElement('li', "py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition duration-200 rounded-lg px-3", { 'data-prompt': text });

  const span = createElement('span', "text-gray-700");
  span.textContent = text.length > 50 ? `${text.slice(0, 50)}...` : text;
  li.appendChild(span);

  const deleteBtn = createElement('button', "delete-btn text-red-500 hover:text-red-700", { title: "Delete Prompt" });
  deleteBtn.textContent = "🗑️";
  li.appendChild(deleteBtn);

  return li;
};

const renderPrompts = () => {
  promptList.innerHTML = '';
  prompts.forEach(text => promptList.appendChild(createPromptListItem(text)));
};

// Event Handlers
const handlePromptClick = (promptText) => {
  if (!conversation.classList.contains('hidden')) {
    conversation.classList.add('hidden');
  }
  
  if (initialInstruction.style.display !== 'none') {
    initialInstruction.style.display = 'none';
    contentContainer.classList.remove('hidden');
  }

  conversation.innerHTML = '';
  messages = [];
  promptDisplay.textContent = promptText;
  messages.push({ role: "system", content: promptText });
  userInputField.value = '';
  userInputField.focus();
};

const handleDeletePrompt = (promptText, li) => {
  prompts = prompts.filter(p => p !== promptText);
  savePrompts(prompts);
  li.remove();
};

const handleRun = async () => {
  const userInput = userInputField.value.trim();
  if (!userInput) {
    alert("Please enter some input before running the prompt.");
    return;
  }

  if (conversation.classList.contains('hidden')) {
    conversation.classList.remove('hidden');
  }

  const formattedInput = `:"""${userInput}"""`;
  messages.push({ role: "user", content: formattedInput });

  const userMessage = createElement('div', "message user-message clickable");
  userMessage.innerHTML = `
    <img src="https://i.pravatar.cc/40?img=3" alt="User Avatar" class="avatar user-avatar">
    <div class="message-content user-content">
      ${userInput}
    </div>
    <div class="tooltip">Copied!</div>
  `;
  conversation.appendChild(userMessage);
  conversation.scrollTop = conversation.scrollHeight;

  userMessage.addEventListener('click', () => copyToClipboard(userInput, userMessage));

  // Update run button state
  runButton.disabled = true;
  runButton.textContent = "Running...";
  runButton.classList.replace('bg-blue-500', 'bg-blue-400');
  runButton.classList.add('cursor-not-allowed');

  try {
    const stream = await sendPromptToOpenAI(messages);
    const reader = stream.getReader();
    await streamResponse(reader);
  } catch (error) {
    console.error(error);
    displayAssistantMessage("Error communicating with OpenAI API.", true);
  } finally {
    // Restore run button state
    runButton.disabled = false;
    runButton.textContent = "Run";
    runButton.classList.replace('bg-blue-400', 'bg-blue-500');
    runButton.classList.remove('cursor-not-allowed');
    runButton.classList.add('hover:bg-blue-700');

    userInputField.value = '';
  }
};

const sendPromptToOpenAI = async (messages) => {
  const requestBody = {
    model: "gpt-4o-mini",
    messages,
    stream: true,
    max_tokens: 4096,
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody.error?.message || response.statusText}`);
    }

    return response.body;
  } catch (error) {
    console.error("API request failed:", error);
    throw new Error(`Request failed: ${error.message}`);
  }
};

const streamResponse = (reader) => new Promise((resolve, reject) => {
  const decoder = new TextDecoder();
  let buffer = '';
  let assistantContent = '';

  const assistantMessage = createElement('div', "message assistant-message clickable");
  assistantMessage.innerHTML = `
    <img src="https://i.pravatar.cc/40?img=5" alt="Assistant Avatar" class="avatar">
    <div class="message-content assistant-content">
      <span class="loading-spinner">⏳</span>
    </div>
    <div class="tooltip">Copied!</div>
  `;
  conversation.appendChild(assistantMessage);
  conversation.scrollTop = conversation.scrollHeight;

  const contentDiv = assistantMessage.querySelector('.assistant-content');

  assistantMessage.addEventListener('click', () => copyToClipboard(assistantContent, assistantMessage));

  const read = async () => {
    try {
      const { done, value } = await reader.read();
      if (done) {
        finalizeResponse();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      lines.forEach(line => {
        line = line.trim();
        if (!line.startsWith('data: ')) return;

        const jsonStr = line.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') {
          finalizeResponse();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const deltaContent = parsed.choices[0]?.delta?.content;
          if (deltaContent) {
            assistantContent += deltaContent;
            contentDiv.innerHTML = marked.parse(assistantContent);
            conversation.scrollTop = conversation.scrollHeight;
          }
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      });

      read();
    } catch (error) {
      console.error("Error reading stream:", error);
      reject(error);
    }
  };

  const finalizeResponse = () => {
    contentDiv.innerHTML = marked.parse(assistantContent);
    conversation.scrollTop = conversation.scrollHeight;
    messages.push({ role: "assistant", content: assistantContent });
    resolve();
  };

  read();
});

const displayAssistantMessage = (text, isError = false) => {
  const messageClass = isError ? "assistant-message bg-red-100 text-red-800" : "assistant-message";
  const assistantMessage = createElement('div', `message ${messageClass} clickable`);
  assistantMessage.innerHTML = `
    <img src="https://i.pravatar.cc/40?img=5" alt="Assistant Avatar" class="avatar">
    <div class="message-content assistant-content ${isError ? 'bg-red-100 text-red-800' : ''}">
      ${isError ? text : marked.parse(text)}
    </div>
    <div class="tooltip">Copied!</div>
  `;
  conversation.appendChild(assistantMessage);
  conversation.scrollTop = conversation.scrollHeight;

  assistantMessage.addEventListener('click', () => copyToClipboard(text, assistantMessage));
};

// Clipboard Function
const copyToClipboard = (text, element) => {
  navigator.clipboard.writeText(text).then(() => {
    element.classList.add('show-tooltip');
    setTimeout(() => element.classList.remove('show-tooltip'), 1000);
  }).catch(err => {
    console.error('Could not copy text:', err);
  });
};

// Modal Handlers
const openNewPromptModal = () => {
  newPromptModal.classList.remove('hidden');
  newPromptText.focus();
};

const closeNewPromptModal = () => {
  newPromptModal.classList.add('hidden');
  newPromptText.value = '';
};

const saveNewPrompt = () => {
  const text = newPromptText.value.trim();
  if (text) {
    prompts.push(text);
    savePrompts(prompts);
    promptList.appendChild(createPromptListItem(text));
    closeNewPromptModal();
  }
};

// Search Handlers
const handleSearch = () => {
  const query = searchBar.value.toLowerCase();
  clearSearchBtn.classList.toggle('hidden', query.length === 0);
  
  Array.from(promptList.children).forEach(li => {
    const text = li.getAttribute('data-prompt').toLowerCase();
    li.style.display = text.includes(query) ? 'flex' : 'none';
  });
};

const clearSearch = () => {
  searchBar.value = '';
  clearSearchBtn.classList.add('hidden');
  Array.from(promptList.children).forEach(li => li.style.display = 'flex');
  searchBar.focus();
};

// Keyboard Handler
const handleInputKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleRun();
  }
};

// Initial Render
document.addEventListener('DOMContentLoaded', renderPrompts);

// Event Listeners
newPromptBtn.addEventListener('click', openNewPromptModal);
cancelBtn.addEventListener('click', closeNewPromptModal);
saveBtn.addEventListener('click', saveNewPrompt);

promptList.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  
  const promptText = li.getAttribute('data-prompt');
  
  if (e.target.classList.contains('delete-btn')) {
    handleDeletePrompt(promptText, li);
  } else {
    handlePromptClick(promptText);
  }
});

searchBar.addEventListener('input', handleSearch);
clearSearchBtn.addEventListener('click', clearSearch);
userInputField.addEventListener('keydown', handleInputKeyDown);
userInputField.addEventListener('click', () => {
  const text = userInputField.value.trim();
  if (text) copyToClipboard(text, userInputTooltip.parentElement);
});
runButton.addEventListener('click', handleRun);