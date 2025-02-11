# LLM Prompt Manager
![LLM Prompt Manager](https://github.com/user-attachments/assets/9707da49-61e5-464c-84b6-993f8fad0b58)
**Code Name:** Princess Jean

A sophisticated web application for managing, chaining, and executing prompts using LLMs' APIs. This application provides a modern, user-friendly interface for creating, organizing, and generating text completions with advanced features like prompt chaining and real-time response streaming.

## Live Demo

Experience the **LLM Prompt Manager** live:

[https://prompt-manager-html-8fwq3o5k7-jose-granados-projects.vercel.app/](https://prompt-manager-html-8fwq3o5k7-jose-granados-projects.vercel.app/)

## Key Features

### Core Functionality
- Create and save prompts locally
- Search saved prompts
- Chain multiple prompts together
- Generate text completions using OpenAI's API
- Copy generated responses to clipboard
- Import/export functionality for backup and sharing
- Dark/light mode
- Fully client-side - no server required

### User Interface
- Modern, responsive design with glass-morphism style
- Dark/light mode toggle with system preference detection
- Split-panel layout:
  - Left sidebar for saved prompts
  - Main content area for prompt details and interactions
  - Conversation section for displaying responses

### Prompt Management
- Create new prompts through a modal interface
- Delete existing prompts
- Search/filter through saved prompts
- Export prompts to JSON file
- Import prompts from JSON file

### Prompt Chaining
- Chain multiple prompts together sequentially
- Drag-and-drop interface for creating chains
- Visual feedback for chain order
- Easy removal of prompts from chain
- Sequential execution of chained prompts

### Conversation Features
- Real-time streaming of AI responses
- Markdown support for formatted text
- Click-to-copy functionality for messages
- Avatar display for user and AI messages
- Auto-scrolling to latest messages

### Technical Features
- Local storage for saving prompts
- Stream processing for API responses
- Comprehensive error handling and display
- Responsive design for various screen sizes
- Theme persistence across sessions

## Getting Started

### Prerequisites
1. A modern web browser
2. OpenAI API key ([Get one here](https://platform.openai.com/account/api-keys))

### Installation
1. Download or clone the repository
2. Open `prompts.html` in your web browser
3. Click the settings icon and enter your OpenAI API key
4. Start using the application!

### Important Notes
- All data (prompts, settings) is stored in your browser's localStorage
- Your API key is stored locally and is only sent to OpenAI's servers
- Regular backups using the export feature are recommended
- localStorage has a size limit (usually 5-10 MB)

### Basic Usage
1. Click "New Prompt" to create a prompt
2. Select a prompt from the left sidebar
3. Enter any additional instructions in the input area
4. Click "Run" to generate a response
5. Use the copy button to copy responses
6. Use the search bar to filter prompts

### Advanced Usage
1. **Prompt Chaining:**
   - Drag prompts from the sidebar to the chain area
   - Arrange prompts in desired order
   - Run the chain to process prompts sequentially

2. **Import/Export:**
   - Use the Export button to save your prompts
   - Use the Import button to load saved prompts

## Dependencies
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [Marked](https://marked.js.org/) - For Markdown parsing
- [SortableJS](https://sortablejs.github.io/Sortable/) - For drag-and-drop functionality
- [GSAP](https://greensock.com/gsap/) - For animations
- [OpenAI API](https://platform.openai.com/) - For text generation

## Features in Detail

## Data Storage
- All data is stored in your browser's localStorage
- No data is sent to any server (except OpenAI for generating responses)
- Use the export feature regularly to backup your prompts
- Use import to restore prompts or move them to another browser/device

### User Experience
- Intuitive drag-and-drop interface
- Visual feedback for actions
- Smooth animations and transitions
- Accessibility features
- Loading states and error handling

### Input/Output
- Support for multi-line input
- Shortcut keys (Enter to submit)
- Formatted output with Markdown support
- Loading indicators during API calls
- Error feedback for failed operations

## Security Notes
- Your API key is stored in localStorage
- Never share your API key
- Regular clearing of browser data will remove stored prompts and settings
- Use export feature to backup before clearing browser data

## Browser Support
The application is compatible with modern web browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Limitations
- Storage is limited by browser's localStorage capacity
- Performance may vary with large numbers of prompts
- API usage is limited by your OpenAI account's quota and rate limits

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is open source and available under the MIT License.