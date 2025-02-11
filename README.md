# LLM Prompt Manager

A sophisticated web application for managing, chaining, and executing prompts using OpenAI's API. This application provides a modern, user-friendly interface for creating, organizing, and generating text completions with advanced features like prompt chaining and real-time response streaming.

## Key Features

### Core Functionality
- Create and save custom prompts
- Search through saved prompts
- Chain multiple prompts together
- Generate text completions using OpenAI's API
- Copy generated responses to clipboard

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
- Drag-and-drop interface for prompt chaining

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
- Web browser with JavaScript enabled
- OpenAI API key

### Installation
1. Download or clone the repository
2. Create a `config.js` file in the root directory
3. Add your OpenAI API key to `config.js`:
   ```javascript
   window.OPENAI_API_KEY = 'your-api-key-here';
   ```
4. Open `index.html` in a web browser

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

### Storage and Data
- Local storage for prompts
- Import/export functionality for prompts
- Session persistence for theme preferences
- Message history management

### User Experience
- Intuitive drag-and-drop interface
- Visual feedback for actions
- Smooth animations and transitions
- Responsive design
- Accessibility features
- Loading states and error handling

### Input/Output
- Support for multi-line input
- Shortcut keys (Enter to submit)
- Formatted output with Markdown support
- Loading indicators during API calls
- Error feedback for failed operations

## Security Note
Never commit your API key to version control. Always use a separate configuration file or environment variables to manage sensitive credentials.

## Browser Support
The application is compatible with modern web browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is open source and available under the MIT License.

Enjoy using LLM Prompt Manager for all your AI prompt management needs! 🚀