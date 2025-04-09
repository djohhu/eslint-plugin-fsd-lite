const path = require('path');

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
      app: ['pages', 'widgets', 'features', 'entities', 'shared', 'app'],
      pages: ['widgets', 'features', 'entities', 'shared', 'pages'],
      widgets: ['features', 'entities', 'shared', 'widgets'],
      features: ['entities', 'shared', 'features'],
      entities: ['shared', 'entities'],
      shared: ['shared'],
    };

    // Function to get the layer from the full path
    const getLayerFromPath = (filePath) => {
      const parts = filePath.split('/');

      if (parts.length >= 2) {
        return parts[1]; // Return the layer (e.g., "features", "entities", etc.)
      }
      return null;
    };

    // Function to get the layer from the filename (relative to src)
    const getLayerFilename = (fullPath) => {
      const srcIndex = fullPath.indexOf('src');
      if (srcIndex === -1) return null; // If 'src' is not found, it's not in our project

      const relativePath = fullPath.slice(srcIndex + 4); // Remove 'src/' from the start of the path
      const parts = relativePath.split(path.sep); // Use path.sep for platform-specific path separation

      return parts[0]; // Return the first folder (e.g., 'features', 'entities', 'app', etc.)
    };

    return {
      ImportDeclaration(node) {
        const from = node.source.value;

        // Ignore imports from node_modules
        if (from.startsWith('node_modules')) {
          return;
        }

        // If the path does not start with "@", it's not our alias
        if (!from.startsWith('@/')) {
          return;
        }

        // Split the path into parts
        const fromParts = from.split('/');

        // Ensure the path is valid (at least two segments)
        if (fromParts.length < 3) {
          return;  // Skip invalid paths
        }

        // Determine the target layer of the import
        const importLayer = getLayerFromPath(from);
        if (!importLayer) {
          return;  // Skip incorrect paths
        }

        // Get the layer of the current file (relative to the context)
        const currentFilePath = context.getFilename();
        const currentLayer = getLayerFilename(currentFilePath);
        if (!currentLayer) {
          return;  // If the file is outside defined layers, skip it
        }

        // If the current layer does not allow importing to the target layer, report an error
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