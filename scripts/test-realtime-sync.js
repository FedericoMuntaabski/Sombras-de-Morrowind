#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🧪 Test de Sincronización en Tiempo Real');
console.log('======================================');
console.log('📋 Este test verifica:');
console.log('   1. Chat en tiempo real entre clientes');
console.log('   2. Contador de jugadores actualizado');
console.log('   3. Estados de "Listo" sincronizados');
console.log('   4. Eventos de WebSocket funcionando');
console.log('');

// Función para esperar un delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Función para verificar si un puerto está en uso
function checkPort(port) {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const cmd = os.platform() === 'win32' 
            ? spawn('netstat', ['-an'])
            : spawn('lsof', ['-i', `:${port}`]);
        
        let output = '';
        cmd.stdout.on('data', (data) => output += data);
        cmd.on('close', () => {
            const isInUse = output.includes(`:${port}`);
            resolve(isInUse);
        });
    });
}

async function startServer() {
    console.log('🌐 Iniciando servidor WebSocket...');
    
    const serverProcess = spawn('npm', ['run', 'host'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
    });

    return new Promise((resolve, reject) => {
        let serverReady = false;
        
        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            process.stdout.write(`[Servidor] ${output}`);
            
            if (output.includes('WebSocket iniciado exitosamente') && !serverReady) {
                serverReady = true;
                resolve(serverProcess);
            }
        });

        serverProcess.stderr.on('data', (data) => {
            process.stderr.write(`[Servidor Error] ${data}`);
        });

        serverProcess.on('error', reject);
        
        // Timeout después de 30 segundos
        setTimeout(() => {
            if (!serverReady) {
                reject(new Error('Timeout: Servidor no inició en 30 segundos'));
            }
        }, 30000);
    });
}

async function startElectronClient(name, delay = 0) {
    if (delay > 0) {
        console.log(`⏱️  Esperando ${delay}ms antes de iniciar ${name}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log(`🖥️  Iniciando ${name}...`);
    
    const clientProcess = spawn('npm', ['start'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
    });

    clientProcess.stdout.on('data', (data) => {
        process.stdout.write(`[${name}] ${data}`);
    });

    clientProcess.stderr.on('data', (data) => {
        process.stderr.write(`[${name} Error] ${data}`);
    });

    return clientProcess;
}

async function startWebpackServer() {
    console.log('📦 Iniciando Webpack Dev Server...');
    
    const webpackProcess = spawn('npm', ['run', 'dev:renderer'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
    });

    return new Promise((resolve, reject) => {
        let webpackReady = false;
        
        webpackProcess.stdout.on('data', (data) => {
            const output = data.toString();
            process.stdout.write(`[Webpack] ${output}`);
            
            if (output.includes('webpack compiled successfully') && !webpackReady) {
                webpackReady = true;
                resolve(webpackProcess);
            }
        });

        webpackProcess.stderr.on('data', (data) => {
            process.stderr.write(`[Webpack Error] ${data}`);
        });

        webpackProcess.on('error', reject);
        
        // Timeout después de 60 segundos
        setTimeout(() => {
            if (!webpackReady) {
                reject(new Error('Timeout: Webpack no compiló en 60 segundos'));
            }
        }, 60000);
    });
}

async function main() {
    let serverProcess = null;
    let webpackProcess = null;
    let hostProcess = null;
    let clientProcess = null;

    try {
        // 1. Verificar que el puerto 3000 esté libre
        console.log('🔍 Verificando disponibilidad del puerto 3000...');
        const port3000InUse = await checkPort(3000);
        if (port3000InUse) {
            console.log('⚠️  Puerto 3000 en uso. Cerrando procesos existentes...');
            if (os.platform() === 'win32') {
                exec('taskkill /f /im node.exe', () => {});
                await delay(2000);
            }
        }

        // 2. Compilar la aplicación principal
        console.log('🔨 Compilando aplicación...');
        await new Promise((resolve, reject) => {
            const buildProcess = spawn('npm', ['run', 'build:main'], {
                cwd: process.cwd(),
                stdio: 'inherit',
                shell: true
            });
            buildProcess.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Build failed with code ${code}`));
            });
        });

        // 3. Iniciar servidor WebSocket
        serverProcess = await startServer();
        await delay(2000);

        // 4. Iniciar Webpack Dev Server
        webpackProcess = await startWebpackServer();
        await delay(3000);

        // 5. Iniciar primer cliente (HOST)
        hostProcess = await startElectronClient('HOST', 1000);
        await delay(3000);

        // 6. Iniciar segundo cliente (CLIENT)  
        clientProcess = await startElectronClient('CLIENT', 1000);

        console.log('');
        console.log('🎉 ¡Entorno iniciado exitosamente!');
        console.log('');
        console.log('📝 INSTRUCCIONES DE TESTING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. 🏠 En la ventana HOST:');
        console.log('   - Ve a "Crear Sala"');
        console.log('   - Nombre: "TestSync"');
        console.log('   - Contraseña: (vacía)');
        console.log('   - Máximo jugadores: 4');
        console.log('   - Crear sala');
        console.log('');
        console.log('2. 🔗 En la ventana CLIENT:');
        console.log('   - Ve a "Unirse a Sala"');
        console.log('   - IP: localhost (o 127.0.0.1)');
        console.log('   - Puerto: 3000');
        console.log('   - Buscar salas → Seleccionar "TestSync"');
        console.log('');
        console.log('3. 🧪 TESTS A REALIZAR:');
        console.log('   a) En HOST: Escribir "Hola desde HOST" en el chat');
        console.log('   b) En CLIENT: Verificar que aparece el mensaje');
        console.log('   c) En CLIENT: Escribir "Hola desde CLIENT"');
        console.log('   d) En HOST: Verificar que aparece el mensaje');
        console.log('   e) Verificar que el contador muestra 2/4 jugadores');
        console.log('   f) En CLIENT: Click en "Listo"');
        console.log('   g) En HOST: Verificar que CLIENT aparece como "Listo"');
        console.log('   h) En HOST: Click en "Listo"');
        console.log('   i) Verificar que ambos aparecen como "Listo"');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('✅ ÉXITO: Si todos los mensajes y estados se sincronizan');
        console.log('❌ FALLO: Si algún mensaje o estado no aparece en ambos clientes');
        console.log('');
        console.log('💡 Presiona Ctrl+C para cerrar todo');

        // Manejar cierre
        process.on('SIGINT', () => {
            console.log('\n🛑 Cerrando entorno de testing...');
            
            if (serverProcess) {
                console.log('   ✅ Cerrando servidor...');
                serverProcess.kill('SIGTERM');
            }
            if (webpackProcess) {
                console.log('   ✅ Cerrando Webpack...');
                webpackProcess.kill('SIGTERM');
            }
            if (hostProcess) {
                console.log('   ✅ Cerrando HOST...');
                hostProcess.kill('SIGTERM');
            }
            if (clientProcess) {
                console.log('   ✅ Cerrando CLIENT...');
                clientProcess.kill('SIGTERM');
            }
            
            setTimeout(() => {
                console.log('   ✅ Entorno cerrado');
                process.exit(0);
            }, 2000);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}
