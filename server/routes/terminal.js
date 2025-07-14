const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/docker');
const terminalController = require('../controllers/terminal');

router.get('/sessions', async (req, res) => {
  try {
    const containers = await dockerController.docker.listContainers({ 
      all: true,
      filters: { label: ['app=web-terminal'] } 
    });
    
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


router.post('/sessions/:id/end', async (req, res) => {
  const { id } = req.params;
  
  try {
    terminalController.endTerminal(id);
    
    const containerId = await dockerController.getContainerForSession(id);
    if (containerId) {
      await dockerController.stopContainer(containerId);
    }
    
    res.json({ success: true, message: 'Terminal session ended' });
  } catch (error) {
    console.error(`Error ending session ${id}:`, error);
    res.status(500).json({ error: 'Failed to end terminal session' });
  }
});

router.post('/sessions/:id/remove', async (req, res) => {
  const { id } = req.params;
  
  try {
    terminalController.endTerminal(id);
    
    const containerId = await dockerController.getContainerForSession(id);
    if (containerId) {
      await dockerController.removeContainer(containerId);
    }
    
    res.json({ success: true, message: 'Terminal session removed' });
  } catch (error) {
    console.error(`Error removing session ${id}:`, error);
    res.status(500).json({ error: 'Failed to remove terminal session' });
  }
});

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