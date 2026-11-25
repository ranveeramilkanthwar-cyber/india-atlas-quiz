const esbuild = require('esbuild');

try {
  esbuild.buildSync({
    entryPoints: ['index.tsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
    minify: true,
    format: 'iife',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global': 'window',
    },
  });
  console.log('Build succeeded! Output: dist/bundle.js');
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
