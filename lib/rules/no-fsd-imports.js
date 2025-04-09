module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure correct imports according to FSD architecture',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },

  create(context) {
    const fsdLayers = {
      app: ['pages', 'widgets', 'features', 'entities', 'shared'],
      pages: ['widgets', 'features', 'entities', 'shared'],
      widgets: ['features', 'entities', 'shared'],
      features: ['entities', 'shared'],
      entities: ['shared'],
      shared: [],
    };

    return {
      ImportDeclaration(node) {
        const from = node.source.value;

        if (from.startsWith('node_modules')) {
          return;
        }

        const parts = from.split('/');
        
        if (parts.length > 1) {
          const layer = parts[1];
          const targetLayer = parts[0].replace('@', '');

          if (fsdLayers[layer]) {
            const allowedLayers = fsdLayers[layer];
            
            if (!allowedLayers.includes(targetLayer)) {
              context.report({
                node,
                message: `Invalid import from '${layer}' to '${targetLayer}'. Allowed imports: ${allowedLayers.join(', ')}`,
              });
            }
          }
        }
      },
    };
  },
};