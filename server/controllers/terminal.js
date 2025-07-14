const pty = require('node-pty');
const os = require('os');
const dockerController = require('./docker');

const terminals = {};

const createTerminal = async (sessionId, containerId) => {
  if (terminals[sessionId]) {
    return terminals[sessionId];
  }

  const containerInfo = await dockerController.getContainerInfo(containerId);
  if (!containerInfo || containerInfo.State !== 'running') {
    await dockerController.startContainer(containerId);
  }

  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  
  const term = pty.spawn('docker', ['exec', '-it', containerId, shell], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || os.homedir(),
    env: process.env
  });

  terminals[sessionId] = term;
  
  console.log(`Terminal created for session ${sessionId}`);
  return term;
};


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