console.log('Starting main.js');

try {
  const electron = require('electron');
  console.log('Electron:', electron);

  if (!electron.app) {
    console.error('Electron app is not available');
    process.exit(1);
  }

  const { app, BrowserWindow } = electron;

  console.log('app:', app);
  console.log('BrowserWindow:', BrowserWindow);

  function createWindow() {
    console.log('Creating window');
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      }
    });

    win.loadFile('index.html');
    
    // Open the DevTools.
    win.webContents.openDevTools();
  }

  console.log('Setting up app.whenReady()');
  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  console.log('End of main.js');
} catch (error) {
  console.error('Error in main.js:', error);
  process.exit(1);
}