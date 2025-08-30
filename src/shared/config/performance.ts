/**
 * Performance and Best Practices Configuration
 * Configuraciones globales para optimización de performance
 */

// Configuraciones de webpack para producción
export const webpackOptimizations = {
  // Tree shaking habilitado
  sideEffects: false,
  
  // Code splitting para reducir bundle size
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
      },
    },
  },
};

// Configuraciones de Electron para mejor performance
export const electronOptimizations = {
  // Evitar errores de cache
  webPreferences: {
    partition: `session-${Date.now()}`,
    additionalArguments: [
      '--disable-web-security',
      '--disable-gpu-cache',
      '--disable-application-cache',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-gpu-sandbox', // Evitar errores de GPU
    ],
  },
};

// Configuraciones de red para mejor conectividad
export const networkOptimizations = {
  // Timeouts optimizados
  connectionTimeout: 5000,
  reconnectDelay: 1000,
  maxReconnectAttempts: 3,
  
  // Configuración de WebSocket
  websocket: {
    pingInterval: 30000,
    pongTimeout: 5000,
    maxPayload: 1024 * 1024, // 1MB
  },
};

// Lista de archivos a excluir del build
export const buildExclusions = [
  /node_modules/,
  /\.test\.(ts|tsx|js)$/,
  /src\/test\//,
  /src\/server\/legacy/,
  /src\/server\/debug-server\.ts$/,
  /src\/main\//,
  /\.map$/,
  /\.spec\.(ts|tsx|js)$/,
];

// Configuraciones de SASS/SCSS
export const scssOptimizations = {
  // Usar funciones modernas de SASS
  modernSyntax: true,
  useColorModule: true,
  
  // Evitar warnings deprecados
  deprecationWarnings: false,
  
  // Minificación para producción
  minify: process.env.NODE_ENV === 'production',
};

// Buenas prácticas para React
export const reactOptimizations = {
  // Usar React.memo para componentes funcionales
  memoizeComponents: true,
  
  // Lazy loading de componentes
  lazyLoadRoutes: true,
  
  // Evitar re-renders innecesarios
  useCallback: true,
  useMemo: true,
};

// Configuraciones de logging
export const loggingConfig = {
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  transports: ['console', 'file'],
  maxFileSize: '10MB',
  maxFiles: 5,
};

// Performance metrics a monitorear
export const performanceMetrics = {
  bundleSize: {
    warning: 5 * 1024 * 1024, // 5MB
    error: 10 * 1024 * 1024, // 10MB
  },
  memoryUsage: {
    warning: 100 * 1024 * 1024, // 100MB
    error: 200 * 1024 * 1024, // 200MB
  },
  renderTime: {
    warning: 16, // 16ms (60fps)
    error: 32, // 32ms (30fps)
  },
};
