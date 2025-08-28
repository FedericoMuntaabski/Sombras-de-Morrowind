const path = require('path');
const sass = require('sass');

module.exports = {
  implementation: sass,
  sassOptions: {
    api: 'modern',
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
