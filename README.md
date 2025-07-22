# Local AI Interface

A desktop application built with Electron that provides a user-friendly interface for managing and interacting with local AI services, including Ollama (for Large Language Models) and n8n (for workflow automation). This project aims to simplify the setup and usage of a personal AI development stack.

## Features

- Unified Interface: Access Open WebUI (for Ollama) and n8n from a single desktop application.
- Dark Mode Toggle: Switch between light and dark themes for comfortable viewing.
- Persistent Theme: Your preferred theme mode is saved and loaded on next launch.
- Dockerized Services: All backend AI services run in isolated Docker containers, ensuring easy setup and management.
- One-Command Setup: A single command to get both Docker services running and the desktop application built.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Docker Desktop: Includes Docker Engine and Docker Compose. Essential for running the AI services.
- Node.js: Includes npm (Node Package Manager). Required for building and running the Electron application. (LTS version recommended)

## Getting Started

Follow these steps to set up and run your Local AI Interface:

1. Clone the Repository:

    ```bash
    git clone https://github.com/saviornt/local-ai-interface.git
    cd local-ai-interface
    ```

2. Install Electron Dependencies:

    Navigate into the project's root directory (where package.json is located) and install the Electron dependencies:

    ```bash
    npm install
    ```

3. Build and Run Everything (One Command!):

    ```bash
    npm run build-all
    ```

    This command will:

    - Start all necessary Docker containers (Ollama, Open WebUI, n8n) in the background.
    - Build the Electron desktop application.

    **Platform-Specific Builds:**
    If you need to build for a specific platform, use one of the following commands:
    - **Windows:** `npm run build-all-win`
    - **macOS:** `npm run build-all-mac`
    - **Linux:** `npm run build-all-linux`

    This process might take some time on the first run as Docker images are downloaded and Electron packages the application.

4. Launch the Application:

    Once the build completes (e.g., `npm run build-all` or `npm run build-all-win`), you will find the executable in a subdirectory within the `dist/` folder (e.g., `dist/local-ai-interface-win32-x64/` for Windows).

    - Navigate to the appropriate build directory: `cd dist/local-ai-interface-<platform>-<arch>/` (e.g., `cd dist/local-ai-interface-win32-x64/`)
    - Run the executable: `.\Local AI Interface.exe` (on Windows) or `./Local AI Interface` (on macOS or Linux).
    - Alternatively, you can right-click on executable and select `Send to > Desktop (create shortcut)` for easy access on Windows.

   **Important Note for Unsigned Applications:**
   As this application is not digitally signed (due to the cost of code signing certificates), your operating system (Windows or macOS) may display security warnings when you first download or attempt to run it.
   - **On Windows:** You might see a "Windows protected your PC" (SmartScreen) warning. Click "More info" and then "Run anyway" to proceed.
   - **On macOS:** You might see a warning stating the "developer cannot be verified." To open the app, go to System Settings > Privacy & Security > General, and then click "Open Anyway" next to the application's name.

   These warnings are standard for unsigned software. I assure you the application is safe to use.
   - Alternatively, you can right-click on the executable and select `Send to > Desktop (create shortcut)` for easy access on Windows.

## Running in Development Mode

If you want to run the Electron app directly without building the full executable (useful for testing UI changes):

1. Start Docker Services:

    ```bash
    docker compose -p ai-stack up -d
    ```

2. Start Electron App:

    ```bash
    npm start
    ```

    This will open the Electron window. Developer tools will not be open by default. You can toggle the menu bar by pressing ALT.

## Project Structure

```text
local-ai-interface/
├── docker-compose.yaml       # Defines Docker services (Ollama, Open WebUI, n8n)
├── main.js                   # Electron's main process (manages windows, BrowserViews, IPC)
├── index.html                # Electron's renderer process UI (tabs, dark mode toggle)
├── preload.js                # Electron's preload script (secure IPC communication)
├── package.json              # Node.js project configuration and scripts
├── package-lock.json         # Records exact dependency versions
├── icon.ico                  # Application icon
├── README.md                 # This file
├── LICENSE.md                # Project license
└── .gitignore                # Specifies files/directories to ignore in Git
├── dist/                     # Output directory for packaged Electron app (created after build)
└── node_modules/             # Node.js dependencies (created after npm install)
```

## Potential Features

I am exploring ways to expand the capabilities of the Local AI Interface. Here are some features that could be integrated in future updates:

- **Automatic1111 Integration:** Adding a tab and Docker Compose service for AUTOMATIC1111's Stable Diffusion WebUI to enable local image generation.
- **ComfyUI Integration:** Including ComfyUI as another powerful local interface for Stable Diffusion workflows.
- **Cloud-Hosted Service Integration:** Providing a seamless way to connect and interact with popular cloud-hosted AI services such as:
  - ChatGPT
  - Gemini
  - Perplexity
  - Anthropic

These would eitherinvolve API key management and dedicated interfaces within the app, or just serving each as a webpage to the provider.

## Donating

If you find this project useful and would like to support its continued development, please consider donating. While this specific project might seem simple, your contributions are invaluable as they support many other, extremely challenging projects I'm working on. Your generosity is much, much appreciated!

- [GitHub Sponsors: Support me monthly on GitHub.](https://github.com/sponsors/saviornt)
- [Patreon: Become a patron to support this project and many others.](https://www.patreon.com/saviornt)
- [Buy Me a Coffee: A simple way to offer a one-time donation to show your appreciation.](https://www.buymeacoffee.com/saviornt)

## Troubleshooting

- Docker Services Not Starting:
  - Ensure Docker Desktop is running.
  - Check for port conflicts (e.g., 8080, 5678, 11434, 3000).
  - Review Docker logs: `docker compose logs`
- Application Not Loading Content (Blank Screen / Errors):
  - Ensure Docker services are running (`docker ps`).
  - Open Electron's Developer Tools (`Ctrl+Shift+I` or `Cmd+Option+I`) and check the Console and Network tabs for errors.
  - If `Refused to frame` or `ERR_BLOCKED_BY_RESPONSE` errors reappear, you might need to re-enable the commented-out security bypasses in `main.js` (see `main.js` comments for details).

## Contributing

Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
