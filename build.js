const { build } = require('vite');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildApp() {
  console.log('Building Vite app...');
  
  // Build the Vite app
  await build({
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  });
  
  console.log('Vite build complete!');
  
  // Copy electron files
  if (!fs.existsSync('dist/electron')) {
    fs.mkdirSync('dist/electron');
  }
  
  fs.copyFileSync('electron/main.js', 'dist/electron/main.js');
  fs.copyFileSync('electron/preload.js', 'dist/electron/preload.js');
  
  // Create package.json for electron
  const electronPackageJson = {
    name: 'igi2-mef-viewer',
    version: '1.0.0',
    description: 'IGI2 MEF Model Viewer - Standalone Desktop Application',
    main: 'electron/main.js',
    author: 'IGI2 Tools',
    license: 'MIT',
    scripts: {
      start: 'electron .'
    },
    devDependencies: {
      electron: '^latest'
    }
  };
  
  fs.writeFileSync('dist/package.json', JSON.stringify(electronPackageJson, null, 2));
  
  console.log('Building Electron app...');
  
  // Build electron app
  try {
    execSync('npx electron-builder --config electron-builder.json', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('Electron build complete! Check the dist folder for your executable.');
  } catch (error) {
    console.error('Electron build failed:', error.message);
  }
}

buildApp().catch(console.error);