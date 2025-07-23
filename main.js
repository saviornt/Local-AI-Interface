const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs'); // Import file system module

// Create an Express app
const expressApp = express();
const appPort = 3000; // Port for the Electron app's internal web server

let mainWindow;
let views = {}; // To store BrowserView instances
let currentViewId = null;

// --- Error Logging Setup ---
// Log file path in Electron's user data directory
const logFilePath = path.join(app.getPath('userData'), 'app.log');

// -- Docker Status Check --
const { exec } = require('child_process');

// Function to log actual errors to a file and console
function logError(message, error = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ERROR: ${message}\n`;
  if (error) {
    logMessage += `  ${error.stack || error.message || error}\n`;
  }
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error('Failed to write to log file:', err); // Fallback for log file write error
  });
  console.error(logMessage); // Always log to console for immediate visibility during development
}

// Function to log informational messages to console (not file)
function logInfo(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] INFO: ${message}`);
}
// --- End Error Logging Setup ---


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1600, // Set width to 1600
    height: 900, // Set height to 900 (maintains 16:9 aspect ratio with 1600 width)
    autoHideMenuBar: true, // Menu bar hidden by default, toggles with ALT
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      // webSecurity: false // Necessary for embedding local HTTP content in BrowserView. Commented out for security.
    }
  });

  // DO NOT OPEN DEVTOOLS BY DEFAULT IN PRODUCTION
  // mainWindow.webContents.openDevTools();

  // Intercept network requests to modify response headers for n8n.
  // This block is commented out for enhanced security. Uncomment if framing issues reappear.
  /*
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const url = details.url;
    let responseHeaders = details.responseHeaders;

    // Target n8n's URL for header modification
    if (url.startsWith('http://localhost:5678')) {
      logInfo(`Attempting to modify headers for n8n (${url})`);

      // 1. Forcefully remove X-Frame-Options header
      if (responseHeaders['x-frame-options']) {
        logInfo(`Original X-Frame-Options for n8n: ${responseHeaders['x-frame-options']}`);
        responseHeaders['x-frame-options'] = null;
        logInfo('X-Frame-Options forcefully removed for n8n.');
      } else {
        logInfo('No X-Frame-Options header found from n8n.');
      }

      // 2. Forcefully set Content-Security-Policy frame-ancestors to '*'
      const permissiveFrameAncestors = "frame-ancestors *"; // Most permissive

      if (responseHeaders['content-security-policy']) {
        let csp = responseHeaders['content-security-policy'][0];
        logInfo(`Original Content-Security-Policy for n8n: ${csp}`);

        if (csp.includes('frame-ancestors')) {
            csp = csp.replace(/frame-ancestors\s+[^;]+/, permissiveFrameAncestors);
        } else {
            csp += `; ${permissiveFrameAncestors}`;
        }
        responseHeaders['content-security-policy'] = [csp];
        logInfo(`Modified Content-Security-Policy for n8n: ${responseHeaders['content-security-policy'][0]}`);
      } else {
        responseHeaders['content-security-policy'] = [permissiveFrameAncestors];
        logInfo(`Added permissive Content-Security-Policy for n8n: ${responseHeaders['content-security-policy'][0]}`);
      }
    }

    callback({ cancel: false, responseHeaders: responseHeaders });
  });
  */


  // Load the index.html from the Express server
  mainWindow.loadURL(`http://localhost:${appPort}`);

  // IPC handler for switching tabs
  ipcMain.on('switch-tab', (event, tabId) => {
    logInfo(`Switching to tab: ${tabId}`);
    if (views[tabId]) {
      if (currentViewId && views[currentViewId]) {
        mainWindow.removeBrowserView(views[currentViewId]);
      }
      mainWindow.addBrowserView(views[tabId]);
      const { width, height } = mainWindow.getBounds();
      const tabBarHeight = 50; // Height of your tab bar in index.html
      views[tabId].setBounds({
        x: 0,
        y: tabBarHeight,
        width: width,
        height: height - tabBarHeight
      });
      views[tabId].setAutoResize({ width: true, height: true });
      currentViewId = tabId;
    } else {
      logError(`Attempted to switch to non-existent tab: ${tabId}`);
    }
  });

  // Handle window resizing to adjust BrowserView bounds
  mainWindow.on('resize', () => {
    if (currentViewId && views[currentViewId]) {
      const { width, height } = mainWindow.getBounds();
      const tabBarHeight = 50; // Height of your tab bar in index.html
      views[currentViewId].setBounds({ x: 0, y: tabBarHeight, width: width, height: height - tabBarHeight });
    }
  });
}

// Function to create and prepare a BrowserView
function createAndPrepareBrowserView(id, url) {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // webSecurity: false, // Commented out for security. Uncomment if framing issues reappear.
      // allowRunningInsecureContent: true // Commented out for security. Uncomment if framing issues reappear.
    }
  });

  view.webContents.loadURL(url);

  // Optional: Open DevTools for each BrowserView for debugging
  // view.webContents.openDevTools();

  view.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logError(`BrowserView failed to load ${validatedURL}: ${errorCode} - ${errorDescription}`);
  });

  view.webContents.on('did-finish-load', () => {
    logInfo(`BrowserView successfully loaded ${url}`);
  });

  return view;
}

app.whenReady().then(() => {
  // Clear cache and storage data to ensure no old policies are lingering
  session.defaultSession.clearStorageData({
    storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'websql', 'serviceworkers', 'cachestorage']
  }).then(() => {
    logInfo('Electron session storage data cleared.');

    // Serve static files from the Electron app's root directory
    expressApp.use(express.static(path.join(__dirname, '/')));

    // Add Docker status endpoint
    expressApp.get('/api/docker-status', (req, res) => {
      exec('docker ps --format "{{.Names}}\t{{.Ports}}"', (error, stdout, stderr) => {
        if (error) {
          logError('Error checking Docker status:', error);
          res.json({ error: 'Failed to check Docker status' });
          return;
        }

        const containers = {
          'ollama': { running: false, port: '11434' },
          'open-webui': { running: false, port: '8080' },
          'n8n': { running: false, port: '5678' }
        };

        stdout.split('\n').forEach(line => {
          const [name, ports] = line.split('\t');
          Object.keys(containers).forEach(containerName => {
            if (name && name.includes(containerName)) {
              containers[containerName].running = true;
            }
          });
        });

        res.json(containers);
      });
    });

    // Start the Express server before creating the Electron window
    expressApp.listen(appPort, () => {
      logInfo(`Electron app serving from http://localhost:${appPort}`);

      // Create BrowserView instances for each service
      views['open-webui'] = createAndPrepareBrowserView('open-webui', 'http://localhost:8080');
      views['n8n'] = createAndPrepareBrowserView('n8n', 'http://localhost:5678');

      createWindow(); // Create the main Electron window once the server and views are ready
    }).on('error', (err) => {
        logError('Express server failed to start:', err);
    });
  }).catch(err => {
    logError('Failed to clear Electron session storage data:', err);
    // Proceed to create window even if clearing fails
    expressApp.use(express.static(path.join(__dirname, '/')));
    expressApp.listen(appPort, () => {
      logInfo(`Electron app serving from http://localhost:${appPort}`);
      views['open-webui'] = createAndPrepareBrowserView('open-webui', 'http://localhost:8080');
      views['n8n'] = createAndPrepareBrowserView('n8n', 'http://localhost:5678');
      createWindow();
    }).on('error', (err) => {
        logError('Express server failed to start (fallback):', err);
    });
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
