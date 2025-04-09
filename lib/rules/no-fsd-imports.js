const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure correct imports according to FSD architecture',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          aliases: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of aliases to replace the default "src" path',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const fsdLayers = {
      app: ['pages', 'widgets', 'features', 'entities', 'shared'],
      pages: ['widgets', 'features', 'entities', 'shared'],
      widgets: ['features', 'entities', 'shared'],
      features: ['entities', 'shared'],
      entities: ['shared'],
      shared: ['shared'],
    };

    const aliases = context.options[0]?.aliases || ['src']; // Use provided aliases or default to '@'

    // Function to get the layer from the full path (considering alias)
    const getLayerFromPath = (filePath) => {
      for (const alias of aliases) {
        if (filePath.startsWith(`${alias}/`)) {
          const relativePath = filePath.slice(alias.length + 1); // Remove alias part
          const parts = relativePath.split('/'); // Split into parts
          return parts[0]; // Return the first part as the layer (e.g., "features", "entities")
        }
      }
      return null;
    };

    // Function to get the layer from the filename (relative to the file's path)
    const getLayerFilename = (fullPath) => {
      const srcIndex = fullPath.indexOf('src');
      if (srcIndex === -1) return null; // If not in the 'src' directory, return null

      const relativePath = fullPath.slice(srcIndex + 4); // Remove 'src' part
      const parts = relativePath.split(path.sep); // Use path.sep for platform compatibility

      return parts[0]; // Return the first folder (e.g., 'features', 'entities', 'app')
    };

    return {
      ImportDeclaration(node) {
        const from = node.source.value;

        // Ignore imports from node_modules
        if (from.startsWith('node_modules')) {
          return;
        }

        // If the path doesn't start with any alias, it's not a valid path
        const importLayer = getLayerFromPath(from);
        if (!importLayer) {
          return; // Skip invalid imports
        }

        // Get the current file's path and determine its layer
        const currentFilePath = context.getFilename();
        const currentLayer = getLayerFilename(currentFilePath);

        // Skip main.ts or similar entry point files (if they don't belong to any layer)
        if (currentFilePath.includes('main.ts')) {
          return; // No need to check imports for main.ts or other entry points
        }

        if (!currentLayer) {
          return; // Skip files that are outside of defined layers
        }

        // If the current layer doesn't allow importing to the target layer, report an error
        const allowedLayers = fsdLayers[currentLayer] || [];
        if (!allowedLayers.includes(importLayer)) {
          context.report({
            node,
            message: `Invalid import from '${currentLayer}' to '${importLayer}'. Allowed imports: ${allowedLayers.join(', ')}`,
          });
        }
      },
    };
  },
};
