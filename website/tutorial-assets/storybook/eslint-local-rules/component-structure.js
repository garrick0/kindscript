/**
 * Custom ESLint rule to enforce Frontend Container Pattern component structure
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce Frontend Container Pattern component structure',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          required: {
            type: 'array',
            items: { type: 'string' },
          },
          recommended: {
            type: 'array',
            items: { type: 'string' },
          },
          component_dirs: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const required = options.required || ['index.ts', '*.tsx'];
    const recommended = options.recommended || [];
    const componentDirs = options.component_dirs || ['atoms', 'molecules', 'organisms', 'Pages', 'templates'];

    return {
      Program(node) {
        const filename = context.getFilename();
        
        // Check if this is a component file
        const isComponent = componentDirs.some(dir => filename.includes(`/components/${dir}/`));
        
        if (!isComponent) return;

        const path = require('path');
        const fs = require('fs');
        
        const dir = path.dirname(filename);
        const componentName = path.basename(dir);
        
        // Skip version directories
        if (/^v\d+/.test(componentName) || componentName === 'latest') return;
        
        const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
        
        // Check for required files
        for (const pattern of required) {
          const hasFile = files.some(file => {
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(file);
            }
            return file === pattern;
          });
          
          if (!hasFile && pattern !== 'index.ts') {
            context.report({
              node,
              message: `Component ${componentName} is missing required file matching pattern: ${pattern}`,
            });
          }
        }
        
        // Check for recommended files (warnings)
        for (const pattern of recommended) {
          const hasFile = files.some(file => {
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(file);
            }
            return file === pattern;
          });
          
          if (!hasFile) {
            context.report({
              node,
              severity: 1, // warning
              message: `Component ${componentName} should have file matching pattern: ${pattern}`,
            });
          }
        }
        
        // Check for forbidden centralized directories
        const forbiddenDirs = ['services', 'types', 'hooks', 'validation'];
        for (const forbidden of forbiddenDirs) {
          if (files.includes(forbidden) && fs.statSync(path.join(dir, forbidden)).isDirectory()) {
            context.report({
              node,
              message: `Component ${componentName} should not have a ${forbidden}/ directory. Files should be colocated directly in the component directory.`,
            });
          }
        }
      },
    };
  },
};