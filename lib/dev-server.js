import browserSync from 'browser-sync';

/**
 * Creates and manages a BrowserSync development server.
 * Handles initial startup and subsequent reloads during watch mode.
 *
 * @param {Object} config - Server configuration
 * @param {string} config.host - Server hostname (default: 'localhost')
 * @param {number} config.port - Server port (default: 3000)
 * @param {string} config.basePath - Subdirectory base path for subdomain deployments
 * @param {string} config.buildDir - Path to the build output directory
 * @returns {Object} Server controller with reload() method
 */
const createDevServer = ({
  host = 'localhost',
  port = 3000,
  basePath = '',
  buildDir = './build',
}) => {
  let server = null;

  const start = () => {
    server = browserSync.create();

    const serverConfig = {
      host,
      port,
      injectChanges: false,
      reloadThrottle: 0,
    };

    if (basePath) {
      serverConfig.server = {
        baseDir: buildDir,
        routes: {
          [`/${basePath}`]: buildDir,
        },
      };
      serverConfig.startPath = `/${basePath}/`;
    } else {
      serverConfig.server = buildDir;
    }

    server.init(serverConfig);
  };

  const reload = () => {
    if (server) {
      server.reload();
    } else {
      start();
    }
  };

  return { start, reload };
};

export default createDevServer;
