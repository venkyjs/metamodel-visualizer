import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  injectStyle: false,
  // Copy CSS files to dist
  onSuccess: async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    // Read and concatenate all CSS files
    const cssFiles = [
      'src/styles/index.css',
      'src/components/GraphNode/GraphNode.css',
      'src/components/ControlCenter/ControlCenter.css',
    ];
    
    let combinedCss = '/* react-graph-chart styles */\n\n';
    
    for (const file of cssFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        combinedCss += `/* ${file} */\n${content}\n\n`;
      }
    }
    
    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    
    fs.writeFileSync('dist/styles.css', combinedCss);
    console.log('✓ Combined CSS files into dist/styles.css');
  },
});

