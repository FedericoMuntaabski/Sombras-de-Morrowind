const path = require('path');

module.exports = {
  implementation: require('sass'),
  sassOptions: {
    // Usar API legacy de forma silenciosa hasta migrar completamente
    silenceDeprecations: ['legacy-js-api'],
    importers: [
      {
        findFileUrl(url) {
          if (url.startsWith('~')) {
            return new URL(`file://${path.resolve('node_modules', url.slice(1))}`);
          }
          return null;
        }
      }
    ]
  },
  additionalData: `
    @use 'sass:color';
    @use 'sass:math';
    @use 'sass:string';
    @use 'sass:list';
    @use 'sass:map';
  `
};
