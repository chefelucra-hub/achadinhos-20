import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles.css', 'utf8') + '\n' + readFileSync('marketplace.css', 'utf8') + '\n' + readFileSync('professional.css', 'utf8') + '\n' + readFileSync('visitor.css', 'utf8');
const js = readFileSync('app.js', 'utf8');
const config = readFileSync('config.js', 'utf8');
const logo = readFileSync('logo-achadinhos-20.png').toString('base64');

const standalone = html
  .replace('  <link rel="stylesheet" href="styles.css" />\n  <link rel="stylesheet" href="marketplace.css" />\n  <link rel="stylesheet" href="professional.css" />\n  <link rel="stylesheet" href="visitor.css" />', `  <style>${css}</style>`)
  .replace('logo-achadinhos-20.png', `data:image/png;base64,${logo}`)
  .replace('  <script src="config.js"></script><script src="app.js"></script>', `  <script>${config}\n${js}</script>`);

writeFileSync('Achadinhos-20-Celular.html', standalone);
