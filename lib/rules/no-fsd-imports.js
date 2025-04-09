const fsdLayers = {
  app: ['pages', 'widgets', 'features', 'entities', 'shared'],
  pages: ['widgets', 'features', 'entities', 'shared'],
  widgets: ['features', 'entities', 'shared'],
  features: ['entities', 'shared'],
  entities: ['shared'],
  shared: [],
};

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
    return {
      ImportDeclaration(node) {
        const from = node.source.value;

        if (from.startsWith('node_modules')) {
          return;
        }

        const [layer, ...rest] = from.split('/');

        if (fsdLayers[layer]) {
          if (!fsdLayers[layer].includes(rest[0])) {
            context.report({
              node,
              message: `Invalid import from ${layer} to ${rest[0]}. Allowed imports: ${fsdLayers[layer].join(', ')}`,
            });
          }
        }
      },
    };
  },
};