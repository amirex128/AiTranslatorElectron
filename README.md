# AI Translator Electron

A modern Electron-based desktop application for AI-powered translation, grammar correction, and response suggestions. Built with React, TypeScript, and Electron Forge.

## Features

- **Translation**: Translate between English and Persian (Farsi)
- **Grammar Correction**: Get AI-powered grammar corrections with teaching explanations
- **Response Suggestions**: Get AI-generated response suggestions for English questions
- **Multiple AI Models**: Support for Ollama and OpenRouter models
- **History**: Save and manage translation history
- **Text-to-Speech**: Built-in TTS functionality
- **System Tray**: Minimize to system tray for quick access
- **Customizable UI**: Adjustable font size and window dimensions

## Prerequisites

- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **Ollama** (optional): Required if using Ollama models. [Download here](https://ollama.com/download)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AiTranslatorElectron
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Linux/Mac
mv .env.example .env
```

**Note**: If you want to keep `.env.example` as a template, use `cp .env.example .env` instead of `mv` on Linux/Mac.

Then edit the `.env` file with your configuration. See [Environment Variables](#environment-variables) section for details.

### 4. Run the Application

#### Development Mode

```bash
npm run start
```

#### Build for Production

```bash
# Package the application
npm run package

# Create distributables (installers)
npm run make
```

The built application will be in the `out/` directory.

## Environment Variables

The application requires a `.env` file in the project root (development) or next to the executable (production). Here are the required variables:

### Model Selection

- `SELECTED_MODEL`: The AI model to use. Can be a model key (e.g., `QWEN3_8B`) or model value (e.g., `qwen3:8b`)

**Available Models:**
- **Ollama Models**: `QWEN3_8B`, `GEMMA3_12B`, `LLAMA3_1_8B`, `GEMMA3_4B`, `QWEN3_14B`
- **OpenRouter Models**: `GEMMA3_27B_IT_OPENROUTER1`, `GEMMA3_27B_IT_OPENROUTER2`, `DEEPSEEK_V3_1_NEX_N1_OPENROUTER1`, `DEEPSEEK_V3_1_NEX_N1_OPENROUTER2`, `DEEPSEEK_R1T2_CHIMERA_OPENROUTER1`, `DEEPSEEK_R1T2_CHIMERA_OPENROUTER2`, `QWEN3_235B_A22B_OPENROUTER1`, `QWEN3_235B_A22B_OPENROUTER2`, `GLM_4_5_AIR_OPENROUTER1`, `GLM_4_5_AIR_OPENROUTER2`

### AI Provider Configuration

- `AI_PROVIDER_URL`: Ollama server URL (default: `http://localhost:11434`)

### OpenRouter Configuration

- `OPEN_ROUTER_BASE_URL`: OpenRouter API base URL (default: `https://openrouter.ai/api/v1`)
- `OPEN_ROUTER_API_KEY_1`: First OpenRouter API key
- `OPEN_ROUTER_API_KEY_2`: Second OpenRouter API key (for load balancing)
- `OPEN_ROUTER_REFERER`: Referer header for OpenRouter requests
- `OPEN_ROUTER_SITE_NAME`: Site name for OpenRouter requests

### AI Configuration

- `TEMPERATURE`: AI temperature setting (0.0 to 2.0, default: `0.7`)

### UI Configuration

- `FONT_SIZE`: Base font size in pixels (default: `14`)
- `WINDOW_WIDTH`: Initial window width in pixels (default: `1200`)
- `WINDOW_HEIGHT`: Initial window height in pixels (default: `800`)

### Example `.env` File

```env
# Model Selection
SELECTED_MODEL=QWEN3_8B

# AI Provider Configuration
AI_PROVIDER_URL=http://localhost:11434

# OpenRouter Configuration
OPEN_ROUTER_BASE_URL=https://openrouter.ai/api/v1
OPEN_ROUTER_API_KEY_1=your-api-key-1
OPEN_ROUTER_API_KEY_2=your-api-key-2
OPEN_ROUTER_REFERER=https://your-site.com
OPEN_ROUTER_SITE_NAME=Your Site Name

# AI Configuration
TEMPERATURE=0.7

# UI Configuration
FONT_SIZE=14
WINDOW_WIDTH=1200
WINDOW_HEIGHT=800
```

## Setting Up Ollama (Optional)

If you plan to use Ollama models, follow these steps:

### 1. Install Ollama

**Windows:**
```powershell
winget install Ollama.Ollama
```

Or download from [ollama.com/download](https://ollama.com/download)

### 2. Download Models

After installing Ollama, download the models you want to use:

```bash
ollama pull qwen3:8b
ollama pull gemma3:12b
ollama pull llama3.1:8b
ollama pull gemma3:4b
ollama pull qwen3:14b
```

### 3. Verify Installation

```bash
# List downloaded models
ollama list

# Start Ollama service (usually runs automatically)
ollama serve
```

## Available Scripts

- `npm run start`: Start the application in development mode
- `npm run package`: Package the application without creating installers
- `npm run make`: Create distributables (installers) for the current platform
- `npm run lint`: Run ESLint to check code quality
- `npm run clean`: Clean build directories (`.webpack` and `out`)

## Project Structure

```
AiTranslatorElectron/
├── src/
│   ├── components/       # React components
│   ├── constants/        # App configuration and constants
│   ├── main/            # Electron main process code
│   │   ├── database/    # Database service
│   │   ├── ipc/         # IPC handlers
│   │   └── services/    # Main process services
│   ├── models/          # Data models
│   ├── pages/           # Page components
│   ├── services/        # Renderer process services
│   ├── stores/          # Zustand state stores
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── forge.config.ts      # Electron Forge configuration
├── webpack.*.ts         # Webpack configuration files
└── package.json         # Project dependencies and scripts
```

## Merge Request Guidelines

When submitting a merge request, please follow these guidelines:

### 1. Code Quality

- **Linting**: Ensure your code passes ESLint checks. Run `npm run lint` before submitting.
- **TypeScript**: All code must be properly typed. Avoid using `any` unless absolutely necessary.
- **Formatting**: Follow the existing code style and formatting conventions.

### 2. Commit Messages

- Use clear, descriptive commit messages
- Follow conventional commit format when possible (e.g., `feat: add new feature`, `fix: resolve bug`)
- Reference issue numbers if applicable

### 3. Testing

- Test your changes thoroughly before submitting
- Ensure the application builds successfully (`npm run make`)
- Test both development and production builds if applicable
- Verify that environment variables are properly configured

### 4. Documentation

- Update README.md if you add new features or change setup requirements
- Add comments for complex logic or non-obvious code
- Update `.env.example` if you add new environment variables

### 5. Branch Naming

- Use descriptive branch names (e.g., `feature/add-new-model`, `fix/translation-bug`)
- Avoid generic names like `update` or `fix`

### 6. Pull Request Description

Include in your PR description:
- **What**: What changes were made
- **Why**: Why these changes were necessary
- **How**: How to test the changes
- **Screenshots**: If UI changes are involved, include screenshots

### 7. Review Process

- Address all review comments before requesting re-review
- Keep PRs focused - avoid mixing unrelated changes
- Keep PRs reasonably sized - break large changes into smaller PRs when possible

### 8. Environment Variables

- **Never commit `.env` file**: Ensure `.env` is in `.gitignore`
- **Update `.env.example`**: If you add new environment variables, update `.env.example` with placeholder values
- **Documentation**: Document new environment variables in README.md

### 9. Dependencies

- **Justify new dependencies**: Explain why a new dependency is needed
- **Keep dependencies updated**: Use `npm audit` to check for vulnerabilities
- **Avoid breaking changes**: Test that existing functionality still works

### 10. Build and Packaging

- Ensure the application builds successfully on Windows
- Test that the packaged application runs correctly
- Verify that all assets are included in the build

## Troubleshooting

### Build Issues

If `npm run make` fails or gets stuck:

1. **Clean build directories**:
   ```bash
   npm run clean
   ```

2. **Run as Administrator** (Windows): Right-click PowerShell/CMD and select "Run as Administrator"

3. **Disable Antivirus temporarily**: Some antivirus software may interfere with the build process

4. **Check for locked files**: Ensure no other processes are using files in the project directory

### Environment Variables Not Loading

- Ensure `.env` file exists in the project root (development) or next to the executable (production)
- Check that all required variables are set
- Verify file encoding is UTF-8

### Ollama Connection Issues

- Ensure Ollama is running: `ollama serve`
- Verify the `AI_PROVIDER_URL` in `.env` matches your Ollama installation
- Check firewall settings if using a remote Ollama instance

## License

MIT

## Author

amir.shirdeli (amir.shirdeli@zoodfood.com)

