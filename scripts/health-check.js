#!/usr/bin/env node
/**
 * Project Health Check Script
 * Verifica errores, performance y buenas prácticas en el proyecto
 */

const fs = require('fs');
const path = require('path');

class ProjectHealthChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  // Verificar archivos SCSS para funciones deprecadas
  checkSassFiles() {
    console.log('🎨 Verificando archivos SASS/SCSS...');
    
    const scssFiles = this.findFiles('src', '.scss');
    scssFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar funciones mix() globales
      if (content.includes('mix(') && !content.includes('@use \'sass:color\'')) {
        this.warnings.push(`${file}: Usar @use 'sass:color' y color.mix() en lugar de mix() global`);
      }
      
      // Verificar @import deprecado
      if (content.includes('@import') && !content.includes('fonts.googleapis.com')) {
        this.suggestions.push(`${file}: Considerar usar @use en lugar de @import`);
      }
    });
  }

  // Verificar archivos TypeScript/JavaScript
  checkTypeScriptFiles() {
    console.log('📜 Verificando archivos TypeScript...');
    
    const tsFiles = this.findFiles('src', '.ts', '.tsx');
    tsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar console.log en producción
      if (content.includes('console.log') && !file.includes('test')) {
        this.suggestions.push(`${file}: Reemplazar console.log con logger apropiado`);
      }
      
      // Verificar any types
      if (content.includes(': any')) {
        this.warnings.push(`${file}: Evitar uso de 'any', usar tipos específicos`);
      }
      
      // Verificar unused imports (básico)
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('import') && line.includes('unused')) {
          this.warnings.push(`${file}:${index + 1}: Posible import no utilizado`);
        }
      });
    });
  }

  // Verificar archivos de configuración
  checkConfigFiles() {
    console.log('⚙️ Verificando archivos de configuración...');
    
    // Verificar package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Verificar dependencias de seguridad
    const securityDeps = ['electron-log', 'helmet'];
    securityDeps.forEach(dep => {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        this.suggestions.push(`package.json: Considerar añadir ${dep} para mayor seguridad`);
      }
    });
    
    // Verificar scripts de producción
    if (!packageJson.scripts['build:prod']) {
      this.suggestions.push('package.json: Añadir script build:prod para builds optimizados');
    }
  }

  // Verificar estructura de archivos
  checkFileStructure() {
    console.log('📁 Verificando estructura de archivos...');
    
    // Verificar archivos duplicados
    const allFiles = this.findFiles('.', '.js', '.ts', '.tsx', '.scss');
    const fileNames = {};
    
    allFiles.forEach(file => {
      const basename = path.basename(file, path.extname(file));
      if (!fileNames[basename]) {
        fileNames[basename] = [];
      }
      fileNames[basename].push(file);
    });
    
    Object.entries(fileNames).forEach(([name, files]) => {
      if (files.length > 1 && !name.includes('index')) {
        this.warnings.push(`Posibles archivos duplicados: ${files.join(', ')}`);
      }
    });
    
    // Verificar archivos grandes
    allFiles.forEach(file => {
      const stats = fs.statSync(file);
      if (stats.size > 100 * 1024) { // 100KB
        this.suggestions.push(`${file}: Archivo grande (${Math.round(stats.size/1024)}KB), considerar dividir`);
      }
    });
  }

  // Verificar performance
  checkPerformance() {
    console.log('⚡ Verificando configuraciones de performance...');
    
    // Verificar webpack config
    if (fs.existsSync('webpack.renderer.config.js')) {
      const content = fs.readFileSync('webpack.renderer.config.js', 'utf8');
      
      if (!content.includes('splitChunks')) {
        this.suggestions.push('webpack.renderer.config.js: Añadir splitChunks para code splitting');
      }
      
      if (!content.includes('optimization')) {
        this.suggestions.push('webpack.renderer.config.js: Añadir configuraciones de optimization');
      }
    }
    
    // Verificar Electron main process
    if (fs.existsSync('src/main/main.ts')) {
      const content = fs.readFileSync('src/main/main.ts', 'utf8');
      
      if (!content.includes('partition:')) {
        this.suggestions.push('src/main/main.ts: Añadir partition único para evitar conflictos de cache');
      }
    }
  }

  // Utilidad para encontrar archivos
  findFiles(dir, ...extensions) {
    const files = [];
    
    const walk = (currentPath) => {
      if (!fs.existsSync(currentPath)) return;
      
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
          walk(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    };
    
    walk(dir);
    return files;
  }

  // Ejecutar todas las verificaciones
  runChecks() {
    console.log('🔍 Iniciando verificación de salud del proyecto...\n');
    
    this.checkSassFiles();
    this.checkTypeScriptFiles();
    this.checkConfigFiles();
    this.checkFileStructure();
    this.checkPerformance();
    
    this.generateReport();
  }

  // Generar reporte
  generateReport() {
    console.log('\n📊 REPORTE DE SALUD DEL PROYECTO');
    console.log('='.repeat(50));
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORES:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.suggestions.length > 0) {
      console.log('\n💡 SUGERENCIAS:');
      this.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0 && this.suggestions.length === 0) {
      console.log('\n✅ ¡Proyecto en excelente estado!');
    }
    
    console.log(`\n📈 RESUMEN: ${this.errors.length} errores, ${this.warnings.length} advertencias, ${this.suggestions.length} sugerencias`);
  }
}

// Ejecutar verificación
if (require.main === module) {
  const checker = new ProjectHealthChecker();
  checker.runChecks();
}

module.exports = ProjectHealthChecker;
