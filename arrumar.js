const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const targetScreensDir = path.join(baseDir, 'src', 'screens');

const operations = [
  {
    src: path.join(baseDir, 'server', 'App.js'),
    dest: path.join(baseDir, 'App.js')
  },
  {
    src: path.join(baseDir, 'server', 'src', 'screens', 'HomeScreen.js'),
    dest: path.join(targetScreensDir, 'HomeScreen.js')
  },
  {
    src: path.join(baseDir, 'server', 'src', 'screens', 'CriarGarantiaScreen.js'),
    dest: path.join(targetScreensDir, 'CriarGarantiaScreen.js')
  }
];

try {
  if (!fs.existsSync(targetScreensDir)) {
    fs.mkdirSync(targetScreensDir, { recursive: true });
  }

  operations.forEach((op) => {
    if (!fs.existsSync(op.src)) {
      throw new Error(`Arquivo de origem não encontrado: ${op.src}`);
    }
    fs.copyFileSync(op.src, op.dest);
  });

  console.log('Estrutura corrigida com sucesso!');
} catch (error) {
  console.error('Erro ao corrigir estrutura:', error.message);
  process.exit(1);
}