const Docker = require('dockerode');
const docker = new Docker();

/**
 * Get or create container for a session
 * @param {string} sessionId - Session identifier
 * @returns {string} - Container ID
 */
const getContainerForSession = async (sessionId) => {
  try {
    // List all containers with our app label
    const containers = await docker.listContainers({ 
      all: true,
      filters: { 
        label: [`app=web-terminal,session=${sessionId}`] 
      } 
    });
    
    // Return container ID if found
    if (containers && containers.length > 0) {
      return containers[0].Id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting container for session:', error);
    throw error;
  }
};

/**
 * Create a new container for a session
 * @param {string} sessionId - Session identifier
 * @returns {string} - Container ID
 */
const createContainer = async (sessionId) => {
  try {
    console.log(`Creating container for session ${sessionId}`);
    
    // Create container with minimal Linux image
    const container = await docker.createContainer({
      Image: 'ubuntu:latest',
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ['/bin/bash'],
      HostConfig: {
        AutoRemove: false, // Don't remove when stopped to allow resuming
        NetworkMode: 'bridge',
        Memory: 512 * 1024 * 1024, // 512MB memory limit
        MemorySwap: 1024 * 1024 * 1024, // 1GB swap
        CpuShares: 512, // CPU limit
      },
      // Labels for identifying containers
      Labels: {
        app: 'web-terminal',
        session: sessionId,
        created: new Date().toISOString()
      }
    });
    
    // Start the container
    await container.start();
    
    // Install basic packages
    const exec = await container.exec({
      Cmd: ['bash', '-c', 'apt-get update && apt-get install -y curl wget nano vim git htop'],
      AttachStdout: true,
      AttachStderr: true
    });
    await exec.start();
    
    return container.id;
  } catch (error) {
    console.error('Error creating container:', error);
    throw error;
  }
};

/**
 * Start a stopped container
 * @param {string} containerId - Container ID
 */
const startContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    await container.start();
    console.log(`Container ${containerId} started`);
    return true;
  } catch (error) {
    console.error(`Error starting container ${containerId}:`, error);
    throw error;
  }
};

/**
 * Stop a container
 * @param {string} containerId - Container ID
 */
const stopContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    console.log(`Container ${containerId} stopped`);
    return true;
  } catch (error) {
    console.error(`Error stopping container ${containerId}:`, error);
    throw error;
  }
};

/**
 * Get container information
 * @param {string} containerId - Container ID
 * @returns {object} - Container info
 */
const getContainerInfo = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return {
      Id: info.Id,
      Name: info.Name,
      State: info.State.Status,
      Created: info.Created,
      SessionId: info.Config.Labels.session
    };
  } catch (error) {
    console.error(`Error getting container info for ${containerId}:`, error);
    return null;
  }
};

/**
 * Remove container
 * @param {string} containerId - Container ID
 */
const removeContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    // Check if container is running
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop();
    }
    await container.remove();
    console.log(`Container ${containerId} removed`);
    return true;
  } catch (error) {
    console.error(`Error removing container ${containerId}:`, error);
    throw error;
  }
};

/**
 * Cleanup idle containers
 * @param {number} idleTimeMs - Idle time in milliseconds
 */
const cleanupIdleContainers = async (idleTimeMs = 24 * 60 * 60 * 1000) => {
  try {
    // List all containers with our app label
    const containers = await docker.listContainers({ 
      all: true,
      filters: { label: ['app=web-terminal'] } 
    });
    
    const now = new Date();
    
    for (const containerInfo of containers) {
      try {
        // Get detailed container info
        const container = docker.getContainer(containerInfo.Id);
        const info = await container.inspect();
        
        // Check if container is idle
        const createdDate = new Date(info.Created);
        const idleTime = now - createdDate;
        
        // Remove if idle for too long
        if (idleTime > idleTimeMs) {
          console.log(`Removing idle container ${containerInfo.Id}`);
          await removeContainer(containerInfo.Id);
        }
      } catch (error) {
        console.error(`Error processing container ${containerInfo.Id}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error cleaning up idle containers:', error);
    throw error;
  }
};

module.exports = {
  getContainerForSession,
  createContainer,
  startContainer,
  stopContainer,
  getContainerInfo,
  removeContainer,
  cleanupIdleContainers
};