// Element references
const promptList = document.getElementById('prompt-list');
const searchBar = document.getElementById('search-bar');
const clearSearchBtn = document.getElementById('clear-search');
const newPromptBtn = document.getElementById('new-prompt-btn');
const newPromptModal = document.getElementById('new-prompt-modal');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const newPromptText = document.getElementById('new-prompt-text');
const promptDisplay = document.getElementById('prompt-display');
const conversation = document.getElementById('conversation');
const initialInstruction = document.getElementById('initial-instruction');
const contentContainer = document.getElementById('content-container');
const userInputField = document.getElementById('user-input');
const runButton = document.getElementById('run-button');
const userInputTooltip = document.getElementById('user-input-tooltip');

const OPENAI_API_KEY = window.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

let messages = [];

function loadStoredPrompts() {
    const stored = localStorage.getItem('savedPrompts');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored prompts:', e);
        }
    }
    return [];
}

function savePrompts(prompts) {
    localStorage.setItem('savedPrompts', JSON.stringify(prompts));
}

let prompts = loadStoredPrompts();

function createPromptListItem(text) {
    const li = document.createElement('li');
    li.className = "py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition duration-200 rounded-lg px-3";
    li.setAttribute('data-prompt', text);

    const span = document.createElement('span');
    span.textContent = text.length > 50 ? text.slice(0, 50) + '...' : text;
    span.className = "text-gray-700";
    li.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = "delete-btn text-red-500 hover:text-red-700";
    deleteBtn.title = "Delete Prompt";
    deleteBtn.textContent = "🗑️";
    li.appendChild(deleteBtn);

    attachPromptClickHandler(li);

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const promptToDelete = li.getAttribute('data-prompt');
        li.remove();
        prompts = prompts.filter(p => p !== promptToDelete);
        savePrompts(prompts);
    });

    return li;
}

prompts.forEach(text => {
    const li = createPromptListItem(text);
    promptList.appendChild(li);
});

function attachPromptClickHandler(item) {
    item.addEventListener('click', function () {
        const conversation = document.getElementById('conversation');
        if (conversation.classList.contains('hidden')) {
            // Stay hidden
        }else{
            conversation.classList.add('hidden');
        }
        if (initialInstruction.style.display !== 'none') {
            initialInstruction.style.display = 'none';
            contentContainer.classList.remove('hidden');
        }

        conversation.innerHTML = '';
        messages = [];

        const promptText = this.getAttribute('data-prompt');
        promptDisplay.textContent = promptText;

        // Initialize messages with system prompt
        messages.push({ role: "system", content: promptText });

        // Clear input fields
        userInputField.value = '';

        // Focus on the main input field
        userInputField.focus();
    });
}

async function handleRun() {
    // Gather user input
    let userInput = userInputField.value.trim();
    const conversation = document.getElementById('conversation');
    if (conversation.classList.contains('hidden')) {
        conversation.classList.remove('hidden');
    }

    if (!userInput) {
        alert("Please enter some input before running the prompt.");
        return;
    }

    // Append the user input with :""" and """
    let formattedInput = `:"""${userInput}"""`;

    // Add user input to messages
    messages.push({ role: "user", content: formattedInput });

    // Append user message to conversation without :""" and """
    const userMessage = document.createElement('div');
    userMessage.className = "message user-message clickable";
    userMessage.innerHTML = `
        <img src="https://i.pravatar.cc/40?img=3" alt="User Avatar" class="avatar user-avatar">
        <div class="message-content user-content">
          ${userInput}
        </div>
        <div class="tooltip">Copied!</div>
      `;
    conversation.appendChild(userMessage);
    conversation.scrollTop = conversation.scrollHeight;

    // Copy to clipboard when user message is clicked
    userMessage.addEventListener('click', () => {
        copyToClipboard(userInput, userMessage);
    });

    // Disable run button and show loading state
    runButton.disabled = true;
    runButton.textContent = "Running...";
    runButton.classList.add('bg-blue-400', 'cursor-not-allowed');

    try {
        const stream = await sendPromptToOpenAI(messages);
        const reader = stream.getReader();
        await streamResponse(reader);
    } catch (error) {
        console.error(error);
        const errorMessage = document.createElement('div');
        errorMessage.className = "message assistant-message clickable";
        errorMessage.innerHTML = `
          <img src="https://i.pravatar.cc/40?img=5" alt="Assistant Avatar" class="avatar">
          <div class="message-content assistant-content bg-red-100 text-red-800">
            Error communicating with OpenAI API.
          </div>
          <div class="tooltip">Copied!</div>
        `;
        conversation.appendChild(errorMessage);
        conversation.scrollTop = conversation.scrollHeight;

        // Copy error message on click
        errorMessage.addEventListener('click', () => {
            copyToClipboard("Error communicating with OpenAI API.", errorMessage);
        });
    } finally {
        // Re-enable run button
        runButton.disabled = false;
        runButton.textContent = "Run";
        runButton.classList.remove('bg-blue-400', 'cursor-not-allowed');
        runButton.classList.add('bg-blue-500', 'hover:bg-blue-700');

        // Clear user input fields
        userInputField.value = '';
    }
}

async function sendPromptToOpenAI(messages) {
    const requestBody = {
        model: "gpt-4o-mini",
        messages: messages,
        stream: true,
        max_tokens: 4096 // Added max tokens parameter
    };

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", { // Explicit endpoint
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.json(); // Get detailed error
            throw new Error(`OpenAI API error (${response.status}): ${errorBody.error?.message || response.statusText}`);
        }

        return response.body;
    } catch (error) {
        console.error("API request failed:", error);
        throw new Error(`Request failed: ${error.message}`);
    }
}


function streamResponse(reader) {
    return new Promise((resolve, reject) => {
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';

        // Create assistant message container
        const assistantMessage = document.createElement('div');
        assistantMessage.className = "message assistant-message clickable";
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

        // Event listener for copying assistant message
        assistantMessage.addEventListener('click', () => {
            copyToClipboard(assistantContent, assistantMessage);
        });

        function read() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    // Remove loading spinner and display content
                    contentDiv.innerHTML = marked.parse(assistantContent); // Convert Markdown to HTML
                    conversation.scrollTop = conversation.scrollHeight;
                    // Update messages with the full assistant response
                    messages.push({ role: "assistant", content: assistantContent });
                    resolve();
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n');
                buffer = lines.pop();

                for (let line of lines) {
                    line = line.trim();
                    if (!line.startsWith('data: ')) continue;

                    let jsonStr = line.replace(/^data:\s*/, '');
                    if (jsonStr === '[DONE]') {
                        // Remove loading spinner and display content
                        contentDiv.innerHTML = marked.parse(assistantContent); // Convert Markdown to HTML
                        console.log("Parsed content", contentDiv.innerHTML);
                        
                        conversation.scrollTop = conversation.scrollHeight;
                        messages.push({ role: "assistant", content: assistantContent });
                        resolve();
                        return;
                    }

                    try {
                        let parsed = JSON.parse(jsonStr);
                        let deltaContent = parsed.choices[0]?.delta?.content;
                        if (deltaContent) {
                            assistantContent += deltaContent;
                            contentDiv.innerHTML = marked.parse(assistantContent); // Update with Markdown conversion
                            conversation.scrollTop = conversation.scrollHeight;
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
                read();
            }).catch(error => {
                console.error("Error reading stream:", error);
                reject(error);
            });
        }
        read();
    });
}

function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(() => {
        // Show tooltip
        element.classList.add('show-tooltip');
        setTimeout(() => {
            element.classList.remove('show-tooltip');
        }, 1000);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

newPromptBtn.addEventListener('click', () => {
    newPromptModal.classList.remove('hidden');
    newPromptText.focus();
});

cancelBtn.addEventListener('click', () => {
    newPromptModal.classList.add('hidden');
    newPromptText.value = '';
});

saveBtn.addEventListener('click', () => {
    const text = newPromptText.value.trim();
    if (text) {
        const newLi = createPromptListItem(text);
        promptList.appendChild(newLi);

        prompts.push(text);
        savePrompts(prompts);

        newPromptText.value = '';
        newPromptModal.classList.add('hidden');
    }
});

searchBar.addEventListener('input', () => {
    const query = searchBar.value.toLowerCase();
    if (query.length > 0) {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }
    document.querySelectorAll('#prompt-list li').forEach(li => {
        const text = li.getAttribute('data-prompt').toLowerCase();
        li.style.display = text.includes(query) ? 'flex' : 'none';
    });
});

clearSearchBtn.addEventListener('click', () => {
    searchBar.value = '';
    clearSearchBtn.classList.add('hidden');
    document.querySelectorAll('#prompt-list li').forEach(li => {
        li.style.display = 'flex';
    });
    searchBar.focus();
});

// Handle Enter key for running the prompt in user-input field
userInputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            // Allow new line
            e.preventDefault();
            userInputField.value += '\n'; // Add a line break
        } else {
            // Run the command without creating a new line
            e.preventDefault();
            handleRun();
        }
    }
});

// Copy user input when input field is clicked
userInputField.addEventListener('click', () => {
    const text = userInputField.value;
    if (text.trim() !== "") {
        copyToClipboard(text, userInputTooltip.parentElement);
    }
});
