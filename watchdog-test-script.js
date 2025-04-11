// This is a modified version of the heartbeat code for testing purposes
let heartbeatInterval = null;
let isHeartbeatActive = true;

// Send heartbeats to watchdog if we're in an iframe
function sendHeartbeat() {
  try {
    if (window.parent && window.parent !== window && isHeartbeatActive) {
      window.parent.postMessage('heartbeat', '*');
      console.log('Heartbeat sent to parent window');
    }
  } catch (e) {
    console.error('Error sending heartbeat:', e);
  }
}

// Start sending heartbeats every second
function startHeartbeats() {
  isHeartbeatActive = true;
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  heartbeatInterval = setInterval(sendHeartbeat, 1000);
  sendHeartbeat(); // Send initial heartbeat
  console.log('Heartbeat system started');
}

// Stop sending heartbeats (to test watchdog)
function stopHeartbeats() {
  isHeartbeatActive = false;
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  console.log('Heartbeat system stopped');
}

// Listen for messages from parent window
window.addEventListener('message', (event) => {
  if (event.data === 'stop-heartbeats') {
    stopHeartbeats();
    console.log('Received stop-heartbeats command');
  } else if (event.data === 'resume-heartbeats') {
    startHeartbeats();
    console.log('Received resume-heartbeats command');
  }
});

// Initialize heartbeats on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Document loaded, starting heartbeat system');
  startHeartbeats();
  
  // Add UI elements for testing
  const testControls = document.createElement('div');
  testControls.style.position = 'fixed';
  testControls.style.top = '10px';
  testControls.style.left = '10px';
  testControls.style.zIndex = '9999';
  testControls.style.backgroundColor = 'rgba(0,0,0,0.7)';
  testControls.style.padding = '10px';
  testControls.style.borderRadius = '5px';
  testControls.style.color = 'white';
  
  const statusText = document.createElement('div');
  statusText.id = 'heartbeat-status';
  statusText.textContent = 'Heartbeats: Active';
  
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle Heartbeats';
  toggleButton.style.marginTop = '10px';
  toggleButton.style.padding = '5px 10px';
  
  toggleButton.addEventListener('click', () => {
    if (isHeartbeatActive) {
      stopHeartbeats();
      statusText.textContent = 'Heartbeats: Stopped';
      toggleButton.textContent = 'Resume Heartbeats';
    } else {
      startHeartbeats();
      statusText.textContent = 'Heartbeats: Active';
      toggleButton.textContent = 'Stop Heartbeats';
    }
  });
  
  testControls.appendChild(statusText);
  testControls.appendChild(toggleButton);
  document.body.appendChild(testControls);
});

// Start the heartbeat system
startHeartbeats();
