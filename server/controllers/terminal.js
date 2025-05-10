const pty = require('node-pty');
const os = require('os');
const dockerController = require('./docker');

// Store active terminals
const terminals = {};

/**
 * Create a new terminal session
 * @param {string} sessionId - Unique session identifier
 * @param {string} containerId - Docker container ID
 * @returns {object} - Terminal process object
 */
const createTerminal = async (sessionId, containerId) => {
  // If terminal already exists for this session, return it
  if (terminals[sessionId]) {
    return terminals[sessionId];
  }

  // Get container info to check if it's running
  const containerInfo = await dockerController.getContainerInfo(containerId);
  if (!containerInfo || containerInfo.State !== 'running') {
    await dockerController.startContainer(containerId);
  }

  // Create shell using node-pty
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  
  // Execute command in Docker container
  const term = pty.spawn('docker', ['exec', '-it', containerId, shell], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || os.homedir(),
    env: process.env
  });

  // Store terminal
  terminals[sessionId] = term;
  
  console.log(`Terminal created for session ${sessionId}`);
  return term;
};

/**
 * Resize terminal dimensions
 * @param {string} sessionId - Session identifier
 * @param {object} dimensions - Terminal dimensions (cols, rows)
 */
const resizeTerminal = (sessionId, dimensions) => {
  const term = terminals[sessionId];
  if (term && dimensions) {
    try {
      term.resize(dimensions.cols, dimensions.rows);
    } catch (error) {
      console.error(`Error resizing terminal for session ${sessionId}:`, error);
    }
  }
};

/**
 * End a terminal session
 * @param {string} sessionId - Session identifier
 */
const endTerminal = (sessionId) => {
  const term = terminals[sessionId];
  if (term) {
    try {
      term.kill();
      delete terminals[sessionId];
      console.log(`Terminal ended for session ${sessionId}`);
    } catch (error) {
      console.error(`Error ending terminal for session ${sessionId}:`, error);
    }
  }
};

/**
 * Cleanup all terminal sessions
 */
const cleanupAllTerminals = async () => {
  try {
    const sessionIds = Object.keys(terminals);
    for (const sessionId of sessionIds) {
      await endTerminal(sessionId);
    }
    return true;
  } catch (error) {
    console.error('Error cleaning up terminals:', error);
    throw error;
  }
};

/**
 * Get terminal for a session
 * @param {string} sessionId - Session identifier
 * @returns {object|null} - Terminal process or null
 */
const getTerminal = (sessionId) => {
  return terminals[sessionId] || null;
};

module.exports = {
  createTerminal,
  resizeTerminal,
  endTerminal,
  cleanupAllTerminals,
  getTerminal
};