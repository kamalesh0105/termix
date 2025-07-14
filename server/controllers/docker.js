const Docker = require('dockerode');
const docker = new Docker();

const getContainerForSession = async (sessionId) => {
  try {
    const containers = await docker.listContainers({ 
      all: true,
      filters: { 
        label: [`app=web-terminal,session=${sessionId}`] 
      } 
    });
    
    if (containers && containers.length > 0) {
      return containers[0].Id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting container for session:', error);
    throw error;
  }
};


const createContainer = async (sessionId) => {
  try {
    console.log(`Creating container for session ${sessionId}`);
    
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
        AutoRemove: false,
        NetworkMode: 'bridge',
        Memory: 512 * 1024 * 1024, // 512MB memory limit
        MemorySwap: 1024 * 1024 * 1024, // 1GB swap
        CpuShares: 512, // CPU limit
      },

      Labels: {
        app: 'web-terminal',
        session: sessionId,
        created: new Date().toISOString()
      }
    });
    
    await container.start();
    
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


const removeContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
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

const cleanupIdleContainers = async (idleTimeMs = 24 * 60 * 60 * 1000) => {
  try {
    const containers = await docker.listContainers({ 
      all: true,
      filters: { label: ['app=web-terminal'] } 
    });
    
    const now = new Date();
    
    for (const containerInfo of containers) {
      try {
        const container = docker.getContainer(containerInfo.Id);
        const info = await container.inspect();
        
        const createdDate = new Date(info.Created);
        const idleTime = now - createdDate;
        
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