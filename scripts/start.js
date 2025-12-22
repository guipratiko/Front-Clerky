#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const buildExists = fs.existsSync(path.join(__dirname, '../build'));

if (isProduction && buildExists) {
  console.log('🚀 Iniciando servidor de produção (arquivos estáticos)...');
  const port = process.env.PORT || 3000;
  execSync(`serve -s build -l ${port}`, { stdio: 'inherit' });
} else {
  console.log('🔧 Iniciando servidor de desenvolvimento...');
  execSync('react-scripts start', { stdio: 'inherit' });
}

