const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/docker');
const terminalController = require('../controllers/terminal');

/**
 * GET /api/terminal/sessions
 * Get list of all terminal sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    // List all containers with our app label
    const containers = await dockerController.docker.listContainers({ 
      all: true,
      filters: { label: ['app=web-terminal'] } 
    });
    
    // Map container info to session info
    const sessions = containers.map(container => {
      return {
        id: container.Labels.session,
        containerId: container.Id,
        status: container.State,
        created: container.Created
      };
    });
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list terminal sessions' });
  }
});

/**
 * POST /api/terminal/sessions/:id/end
 * End a terminal session
 */
router.post('/sessions/:id/end', async (req, res) => {
  const { id } = req.params;
  
  try {
    // End terminal process
    terminalController.endTerminal(id);
    
    // Get container for this session
    const containerId = await dockerController.getContainerForSession(id);
    if (containerId) {
      // Stop container but don't remove (allows session resuming)
      await dockerController.stopContainer(containerId);
    }
    
    res.json({ success: true, message: 'Terminal session ended' });
  } catch (error) {
    console.error(`Error ending session ${id}:`, error);
    res.status(500).json({ error: 'Failed to end terminal session' });
  }
});

/**
 * POST /api/terminal/sessions/:id/remove
 * Remove a terminal session and its container
 */
router.post('/sessions/:id/remove', async (req, res) => {
  const { id } = req.params;
  
  try {
    // End terminal process
    terminalController.endTerminal(id);
    
    // Get container for this session
    const containerId = await dockerController.getContainerForSession(id);
    if (containerId) {
      // Remove container
      await dockerController.removeContainer(containerId);
    }
    
    res.json({ success: true, message: 'Terminal session removed' });
  } catch (error) {
    console.error(`Error removing session ${id}:`, error);
    res.status(500).json({ error: 'Failed to remove terminal session' });
  }
});

/**
 * POST /api/terminal/cleanup
 * Clean up idle terminal sessions
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { idleTimeHours } = req.body;
    const idleTimeMs = (idleTimeHours || 24) * 60 * 60 * 1000;
    
    await dockerController.cleanupIdleContainers(idleTimeMs);
    
    res.json({ success: true, message: 'Idle terminal sessions cleaned up' });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ error: 'Failed to clean up idle terminal sessions' });
  }
});

module.exports = router;