// index.js

// Cached DOM elements
const elements = {
  promptList: document.getElementById('prompt-list'),
  searchBar: document.getElementById('search-bar'),
  clearSearchBtn: document.getElementById('clear-search'),
  newPromptBtn: document.getElementById('new-prompt-btn'),
  newPromptModal: document.getElementById('new-prompt-modal'),
  cancelBtn: document.getElementById('cancel-btn'),
  closeModalBtn: document.getElementById('modal-close'),
  saveBtn: document.getElementById('save-btn'),
  newPromptText: document.getElementById('new-prompt-text'),
  promptDisplay: document.getElementById('prompt-display'),
  conversation: document.getElementById('conversation'),
  initialInstruction: document.getElementById('initial-instruction'),
  contentContainer: document.getElementById('content-container'),
  userInputField: document.getElementById('user-input'),
  runButton: document.getElementById('run-button'),
  userInputTooltip: document.getElementById('user-input-tooltip'),
  chainSection: document.getElementById('chained-prompts').closest('section'),
  chainedPromptList: document.getElementById('chained-prompt-list'),
  exportPromptsBtn: document.getElementById('export-prompts-btn'),
  importPromptsBtn: document.getElementById('import-prompts-btn'),
  importFile: document.getElementById('import-file'),
};

const {
  promptList, searchBar, clearSearchBtn, newPromptBtn, newPromptModal,
  cancelBtn, closeModalBtn, saveBtn, newPromptText, promptDisplay, conversation,
  initialInstruction, contentContainer, userInputField, runButton,
  userInputTooltip, chainSection,
  chainedPromptList, exportPromptsBtn,
  importPromptsBtn,
  importFile
} = elements;

const OPENAI_API_KEY = window.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

let messages = [];

// Settings Modal Functions
const initializeSettings = () => {
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    openSettingsModal();
  }
};

const openSettingsModal = () => {
  const modal = createElement('div', 'fixed inset-0 bg-slate-900/70 backdrop-blur-sm items-center justify-center flex z-50');
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-10 w-11/12 sm:w-3/4 md:w-2/5 max-w-4xl">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-semibold text-slate-800 dark:text-slate-200">Settings</h3>
        <button class="settings-close text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <form id="settings-form" class="space-y-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">OpenAI API Key</label>
          <input 
            type="password" 
            id="api-key-input"
            class="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
            placeholder="sk-..." 
            value="${localStorage.getItem('openai_api_key') || ''}"
          />
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Your API key is stored locally and never sent to any server besides OpenAI.
            <a href="https://platform.openai.com/account/api-keys" target="_blank" class="text-blue-500 hover:text-blue-700">
              Get your API key here
            </a>
          </p>
        </div>

        <div class="flex justify-end space-x-4">
          <button type="button" class="settings-close px-6 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Event Listeners
  const closeModal = () => modal.remove();
  modal.querySelector('.settings-close').addEventListener('click', closeModal);
  
  modal.querySelector('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const apiKey = modal.querySelector('#api-key-input').value.trim();
    
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      alert('Invalid API key format. It should start with "sk-"');
      return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    closeModal();
  });
};

// Add Settings Button to Header
const addSettingsButton = () => {
  const settingsBtn = createElement('button', 'px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors focus:outline-none');
  settingsBtn.innerHTML = `
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  `;
  settingsBtn.addEventListener('click', openSettingsModal);
  
  // Insert before the dark mode toggle
  const darkModeBtn = document.getElementById('dark-mode-toggle');
  darkModeBtn.parentNode.insertBefore(settingsBtn, darkModeBtn);
};

// Add export functionality
const exportPrompts = () => {
  const promptsData = {
    prompts: prompts,
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(promptsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Add import functionality
const importPrompts = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.prompts || !Array.isArray(data.prompts)) {
      throw new Error('Invalid prompts file format');
    }

    // Merge imported prompts with existing ones, removing duplicates
    const newPrompts = [...new Set([...prompts, ...data.prompts])];
    prompts = newPrompts;
    
    // Save to localStorage and update UI
    savePrompts(prompts);
    renderPrompts();
    
    alert('Prompts imported successfully!');
  } catch (error) {
    console.error('Error importing prompts:', error);
    alert('Error importing prompts. Please check the file format.');
  }
};

// Add event listeners
exportPromptsBtn.addEventListener('click', exportPrompts);

importPromptsBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    importPrompts(file);
  }
  // Reset the input so the same file can be imported again if needed
  e.target.value = '';
});

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

// Update the createPromptListItem function
const createPromptListItem = (text) => {
  const li = createElement('li', "prompt-item p-4 bg-slate-100 dark:bg-slate-700 rounded-xl shadow-md cursor-grab", {
    'data-prompt': text,
    'draggable': 'true'
  });

  const contentDiv = createElement('div', "flex justify-between items-center");

  const titleSpan = createElement('span', "prompt-title text-slate-700 dark:text-slate-300");
  titleSpan.textContent = text.length > 50 ? `${text.slice(0, 50)}...` : text;

  const deleteBtn = createElement('button', "delete-btn text-red-500 hover:text-red-700", { title: "Delete Prompt" });
  deleteBtn.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  `;

  contentDiv.appendChild(titleSpan);
  contentDiv.appendChild(deleteBtn);
  li.appendChild(contentDiv);

  return li;
};

// Helper Function to Run a Single Prompt
const runSinglePrompt = async (promptText, previousResponse = '') => {
  messages = [{ role: "system", content: promptText }];

  if (previousResponse) {
    messages.push({ role: "user", content: previousResponse });
  }
  try {
    const stream = await sendPromptToOpenAI(messages);
    const assistantResponse = await streamResponse(stream);
    messages.push({ role: "assistant", content: assistantResponse });
    return assistantResponse;
  } catch (error) {
    console.error('Error in runSinglePrompt:', error);
    throw error;
  }
};

// Update the Sortable creation and chain handling
document.addEventListener('DOMContentLoaded', () => {
  const promptList = document.getElementById('prompt-list');
  const chainedPromptList = document.getElementById('chained-prompt-list');
  Sortable.create(promptList, {
    group: {
      name: 'prompts',
      pull: 'clone',
      put: false
    },
    sort: false,
    animation: 150,
    ghostClass: 'opacity-50',
    onClone: function (evt) {
      const item = evt.item;
      const originalText = item.getAttribute('data-prompt');

      item.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="prompt-title text-slate-700 dark:text-slate-300">${originalText}</span>
          </div>
      `;
    }
  });

  Sortable.create(chainedPromptList, {
    group: {
      name: 'prompts',
      pull: false,
      put: true
    },
    animation: 150,
    ghostClass: 'opacity-50',
    onAdd: function (evt) {
      const item = evt.item;
      addRemoveButton(item);
      updateChainUI();
    },
    onRemove: function () {
      updateChainUI();
    },
    onSort: function () {
      updateChainUI();
    }
  });

  updateChainUI();
  initializeSettings();
  addSettingsButton();
});

// Function to Update Chain UI Elements
const updateChainUI = () => {
  const hasChainedPrompts = chainedPromptList.children.length > 0;

  Array.from(chainedPromptList.children).forEach((item, index) => {
      let numberBadge = item.querySelector('.chain-number');
      if (!numberBadge) {
          numberBadge = createElement('span', 'chain-number inline-flex items-center justify-center px-2 py-1 mr-2 bg-blue-500 text-white text-sm font-medium rounded-full');
          item.querySelector('.flex').insertBefore(numberBadge, item.querySelector('.flex').firstChild);
      }
      numberBadge.textContent = `${index + 1}`;
  });
};

// Message display function
function addMessage(sender, text) {
  const conversation = document.getElementById('conversation');
  if (!conversation) {
      console.error('Conversation element not found');
      return;
  }

  const message = document.createElement('div');
  message.className = `message ${sender}-message clickable`;

  // Create the message HTML structure
  message.innerHTML = `
      <img src="https://i.pravatar.cc/40?img=${sender === 'ai' ? '5' : '3'}" alt="${sender === 'ai' ? 'Assistant' : 'User'} Avatar" class="avatar ${sender === 'user' ? 'user-avatar' : ''}">
      <div class="message-content ${sender}-content">
          ${marked.parse(text)}
      </div>
      <div class="tooltip">Copied!</div>
  `;

  conversation.appendChild(message);
  conversation.scrollTop = conversation.scrollHeight;

  // Add click-to-copy functionality
  message.addEventListener('click', () => copyToClipboard(text, message));
}

// AI Response function for chain
async function getAIResponse(prompt) {
  try {
      // Create messages array for this specific prompt
      const messages = [{ role: "user", content: prompt }];

      // Use the existing OpenAI API call function to get a stream
      const stream = await sendPromptToOpenAI(messages);
      const reader = stream.getReader();

      // Use the existing streamResponse function to handle the streaming
      const response = await streamResponse(reader);
      return response;
  } catch (error) {
      console.error('Error in getAIResponse:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

// Run Chain Handler
async function handleRunChain(initialInput) {
  try {
      console.log('Starting handleRunChain with initial input:', initialInput);
      const prompts = Array.from(chainedPromptList?.children || []).map(item => {
          const promptTitle = item.querySelector('.prompt-title');
          return promptTitle ? promptTitle.innerText : null;
      }).filter(prompt => prompt !== null);

      if (prompts.length === 0) {
          return;
      }

      let input = initialInput; // Use the main prompt's response as initial input

      for (let i = 0; i < prompts.length; i++) {
          const prompt = prompts[i];
          console.log(`Processing chain prompt ${i + 1}:`, prompt);

          try {
              // Display the current prompt
              addMessage('user', `Chain Step ${i + 1}: ${prompt}`);

              // Create messages for this step
              const messages = [{ role: "user", content: `${prompt}\n\nInput: ${input}` }];

              // Get streaming response
              const stream = await sendPromptToOpenAI(messages);
              const reader = stream.getReader();

              // Use streamResponse to handle the streaming display
              const response = await streamResponse(reader);
              console.log(`Received chain response for prompt ${i + 1}:`, response);

              // Use this response as input for the next prompt
              input = response;
          } catch (innerError) {
              console.error(`Error processing chain prompt ${i + 1}:`, innerError);
              addMessage('ai', `Error: ${innerError.message}`);
              return;
          }
      }

      console.log('Chain execution completed successfully');

  } catch (error) {
      console.error('Detailed error in handleRunChain:', {
          error: error,
          message: error.message,
          stack: error.stack
      });
      addMessage('ai', `Error running the prompt chain: ${error.message}`);
  }
}

const renderPrompts = () => {
  promptList.innerHTML = '';
  prompts.forEach(text => promptList.appendChild(createPromptListItem(text)));
};

// Dark Mode Functionality
const initializeTheme = () => {
  const toggleButton = document.getElementById('dark-mode-toggle');
  const sunIcon = document.getElementById('theme-sun-icon');
  const moonIcon = document.getElementById('theme-moon-icon');
  const root = document.documentElement;

  const updateIcons = (isDark) => {
    if (isDark) {
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    } else {
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
    }
  };

  const setTheme = (theme) => {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      updateIcons(true);
      localStorage.setItem('theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      updateIcons(false);
      localStorage.setItem('theme', 'light');
    }
  };

  const initialize = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  };

  toggleButton.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  });

  initialize();
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

  chainSection.classList.remove('hidden');

  promptDisplay.innerHTML = `
    <div class="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700">
      <div class="flex items-center gap-2 mb-2">
        <span class="inline-flex items-center justify-center px-3 py-1 bg-purple-500 text-white text-sm font-medium rounded-full">
          Main Prompt
        </span>
      </div>
      <div class="text-slate-700 dark:text-slate-300">
        ${marked.parse(promptText)}
      </div>
    </div>
  `;

  conversation.innerHTML = '';
  messages = [];
  messages.push({ role: "system", content: promptText });
  userInputField.value = '';
  userInputField.focus();
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

  // Get the main prompt from the promptDisplay
  const mainPromptElement = promptDisplay.querySelector('.text-slate-700, .dark\\:text-slate-300');
  if (!mainPromptElement) {
      alert("Please select a main prompt first.");
      return;
  }
  const mainPrompt = mainPromptElement.textContent.trim();

  // Process main prompt first
  const formattedInput = `:"""${userInput}"""`;
  messages = [
      { role: "system", content: mainPrompt },
      { role: "user", content: formattedInput }
  ];

  // Display user input
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

  runButton.disabled = true;
  runButton.textContent = "Running...";
  runButton.classList.replace('bg-blue-500', 'bg-blue-400');
  runButton.classList.add('cursor-not-allowed');

  try {
      // Process main prompt
      const stream = await sendPromptToOpenAI(messages);
      const reader = stream.getReader();
      const mainResponse = await streamResponse(reader);

      // If there are chained prompts, process them with the main prompt's response
      if (chainedPromptList.children.length > 0) {
          await handleRunChain(mainResponse);
      }
  } catch (error) {
      console.error(error);
      displayAssistantMessage("Error communicating with OpenAI API.", true);
  } finally {
      runButton.disabled = false;
      runButton.textContent = "Run";
      runButton.classList.replace('bg-blue-400', 'bg-blue-500');
      runButton.classList.remove('cursor-not-allowed');
      runButton.classList.add('hover:bg-blue-700');

      userInputField.value = '';
  }
};

const sendPromptToOpenAI = async (messages) => {
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    throw new Error('No API key found. Please configure your OpenAI API key in settings.');
  }

  const requestBody = {
    model: "gpt-4",
    messages,
    stream: true,
    max_tokens: 4096,
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
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

const streamResponse = (streamBody) => new Promise((resolve, reject) => {
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
          const { done, value } = await streamBody.read();
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
      resolve(assistantContent); // Return the assistant's response
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

const copyToClipboard = (text, element) => {
  navigator.clipboard.writeText(text).then(() => {
    element.classList.add('show-tooltip');
    setTimeout(() => element.classList.remove('show-tooltip'), 1000);
  }).catch(err => {
    console.error('Could not copy text:', err);
  });
};

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

const handleInputKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleRun();
  }
};

document.addEventListener('DOMContentLoaded', renderPrompts);
document.addEventListener('DOMContentLoaded', initializeTheme);

newPromptBtn.addEventListener('click', openNewPromptModal);
cancelBtn.addEventListener('click', closeNewPromptModal);
closeModalBtn.addEventListener('click', closeNewPromptModal);
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

const handleDeletePrompt = (promptText, listItem) => {
  if (confirm('Are you sure you want to delete this prompt?')) {
    prompts = prompts.filter(prompt => prompt !== promptText);
    savePrompts(prompts);
    listItem.remove();
  }
};

const addRemoveButton = (item) => {
  const promptTitle = item.querySelector('.prompt-title');
  if (promptTitle) {
    item.setAttribute('data-prompt', promptTitle.textContent);
  }

  // Remove any existing wrapper div
  const existingWrapper = item.querySelector('.flex');
  if (existingWrapper) {
    while (existingWrapper.firstChild) {
      item.appendChild(existingWrapper.firstChild);
    }
    existingWrapper.remove();
  }

  // Create new wrapper div
  const contentDiv = createElement('div', "flex justify-between items-center w-full");

  // Move existing content into wrapper
  while (item.firstChild) {
    contentDiv.appendChild(item.firstChild);
  }

  // Add delete button
  const deleteBtn = createElement('button', "delete-btn text-red-500 hover:text-red-700", { title: "Remove from Chain" });
  deleteBtn.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  `;

  // Add number badge container
  const badgeAndTitleDiv = createElement('div', "flex items-center gap-2");
  
  // Add the chain number badge (if it exists)
  const existingBadge = item.querySelector('.chain-number');
  if (existingBadge) {
    badgeAndTitleDiv.appendChild(existingBadge);
  }
  
  // Move the prompt title to the badge and title container
  const titleElement = contentDiv.querySelector('.prompt-title');
  if (titleElement) {
    badgeAndTitleDiv.appendChild(titleElement);
  }

  // Clear the content div and add our new structure
  contentDiv.innerHTML = '';
  contentDiv.appendChild(badgeAndTitleDiv);
  contentDiv.appendChild(deleteBtn);
  
  // Add the content div to the item
  item.appendChild(contentDiv);

  // Add click handler for delete button
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    item.remove();
    updateChainUI();
  });
};
