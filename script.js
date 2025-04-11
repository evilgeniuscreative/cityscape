// Configuration
const CYCLE_DURATION = 120000; // Milliseconds for one 24-hour cycle (2 minutes)
const DEBUG = true; // Enable/disable debug logging
const INIT_TIMEOUT = 30000; // 30 second timeout for initialization

// Global variable to track if heartbeats are enabled
let heartbeatsEnabled = true;
let heartbeatInterval = null;

// Send heartbeats to watchdog if we're in an iframe
function sendHeartbeat() {
  try {
    if (window.parent && window.parent !== window && heartbeatsEnabled) {
      window.parent.postMessage('heartbeat', '*');
      if (DEBUG) console.log('Heartbeat sent to parent window');
    }
  } catch (e) {
    // Silently fail if postMessage is not available
  }
}

// Start sending heartbeats every second
function startHeartbeatSystem() {
  heartbeatsEnabled = true;
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  heartbeatInterval = setInterval(sendHeartbeat, 1000);
  sendHeartbeat(); // Send initial heartbeat
  console.log('Heartbeat system started');
}

// Initialize heartbeat system
startHeartbeatSystem();

// Add a test function to stop heartbeats (for testing watchdog)
function stopHeartbeats() {
  heartbeatsEnabled = false;
  console.log('Heartbeats stopped for testing watchdog');
}

// Add a function to resume heartbeats
function resumeHeartbeats() {
  heartbeatsEnabled = true;
  sendHeartbeat();
  console.log('Heartbeats resumed');
}

// Helper for debug logging
function log(message) {
  try {
    if (DEBUG) {
      console.log(`[CityLights] ${message}`);
    }
  } catch (e) {
    // Silently fail if console is not available
  }
}

function setLoadingText(text) {
  if (this.loadingText) {
    this.loadingText.textContent = text;
    // Log loading steps to help with debugging
    log(`Loading step: ${text}`);
  }
}

(function setupErrorHandling() {
  const errorLog = document.getElementById("error-log");
  const errorSidebar = document.getElementById("error-sidebar");
  const showErrorsBtn = document.getElementById("show-errors");
  const clearErrorsBtn = document.getElementById("clear-errors");
  const toggleSidebarBtn = document.getElementById("toggle-sidebar");

  if (errorLog && errorSidebar && showErrorsBtn) {
    // Show error sidebar initially during development
    errorSidebar.style.display = "block";

    // Original console.error
    const originalConsoleError = console.error;

    // Override console.error to capture errors
    console.error = function () {
      // Call original console.error
      originalConsoleError.apply(console, arguments);

      // Format error message
      const errorMsg = Array.from(arguments)
        .map((arg) => {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack}`;
          }
          return typeof arg === "object"
            ? JSON.stringify(arg, null, 2)
            : String(arg);
        })
        .join(" ");

      // Add to error log
      const errorEntry = document.createElement("div");
      errorEntry.className = "error-entry";
      errorEntry.innerHTML = `<hr><p><strong>${new Date().toLocaleTimeString()}</strong>: ${errorMsg}</p>`;
      errorLog.appendChild(errorEntry);

      // Show sidebar and button
      errorSidebar.style.display = "block";
      showErrorsBtn.style.display = "none";
    };

    // Handle window errors
    window.addEventListener("error", function (event) {
      console.error(
        `Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
      );
      event.preventDefault();
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", function (event) {
      console.error("Unhandled Promise Rejection:", event.reason);
    });

    // Button event handlers
    if (clearErrorsBtn) {
      clearErrorsBtn.addEventListener("click", function () {
        errorLog.innerHTML = "";
      });
    }

    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener("click", function () {
        errorSidebar.style.display = "none";
        showErrorsBtn.style.display = "block";
      });
    }

    if (showErrorsBtn) {
      showErrorsBtn.addEventListener("click", function () {
        errorSidebar.style.display = "block";
        showErrorsBtn.style.display = "none";
      });
    }
  }
})();

// Add initialization monitoring
function monitorInitialization() {
  // Store the last loading message
  let lastLoadingMessage = "";
  let lastChangeTime = Date.now();

  // Check every second if loading is stuck
  const monitorInterval = setInterval(() => {
    const loadingText = document.querySelector(".loading-text");
    if (!loadingText) {
      clearInterval(monitorInterval);
      return;
    }

    const currentMessage = loadingText.textContent;

    // If loading overlay is not visible, stop monitoring
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay && loadingOverlay.style.display === "none") {
      clearInterval(monitorInterval);
      return;
    }

    // If message hasn't changed in 3 seconds, might be stuck
    if (currentMessage === lastLoadingMessage) {
      const timeSinceChange = Date.now() - lastChangeTime;
      if (timeSinceChange > 3000) {
        // 3 seconds
        console.warn(
          `Loading appears stuck at "${currentMessage}" for ${Math.round(
            timeSinceChange / 1000
          )} seconds`
        );

        // After 5 seconds of being stuck, show emergency button
        if (timeSinceChange > 5000) {
          const emergencyBtn = document.getElementById("emergency-refresh");
          if (emergencyBtn) {
            emergencyBtn.classList.add("visible");
            loadingText.textContent = `Stuck at: ${currentMessage}. Consider refreshing.`;
          }
        }
      }
    } else {
      // Message changed, reset timer
      lastLoadingMessage = currentMessage;
      lastChangeTime = Date.now();
    }
  }, 1000);

  return monitorInterval;
}

monitorInitialization();

// Track active instance
let activeScene = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  log("Document loaded, initializing scene");

  // Add event listener for watchdog test button
  const testWatchdogBtn = document.getElementById("testWatchdog");
  if (testWatchdogBtn) {
    testWatchdogBtn.addEventListener("click", () => {
      log("Watchdog test button clicked - stopping heartbeats");
      stopHeartbeats();
      
      // Alert the user that the test has started
      alert("Heartbeats stopped. The watchdog should trigger in about 5 seconds.");
    });
  }

  // Show loading overlay immediately
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex";
  }

  // Ensure any previous instance is cleaned up
  if (activeScene) {
    log("Cleaning up previous scene instance");
    try {
      activeScene.cleanup();
    } catch (error) {
      console.error("Error cleaning up scene:", error);
    }
    activeScene = null;
  }

  // Create new scene instance with a delay to ensure DOM is fully ready
  setTimeout(() => {
    try {
      activeScene = new CityScene();
      log("Scene initialized successfully");
    } catch (error) {
      console.error("Error initializing scene:", error);
      // Hide loading overlay if there was an error
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
    }
  }, 300);
});

// Core initialization function
function initScene() {
  log("Initializing new scene");

  // Clean up any existing scene
  if (activeScene) {
    log("Cleaning up existing scene");
    try {
      activeScene.cleanup();
    } catch (e) {
      log(`Error cleaning up: ${e.message}`);
    }
    activeScene = null;
  }

  // Create new scene
  try {
    activeScene = new CityScene();
    log("Scene initialized successfully");
  } catch (e) {
    log(`Error creating scene: ${e.message}`);
    console.error(e);
  }
}

class CityScene {
  constructor(options = {}) {
    // Default options
    this.options = Object.assign(
      {
        cycleDuration: 240000, // 4 minutes per day/night cycle
        buildingCount: 15 + Math.floor(Math.random() * 10),
        houseCount: 10 + Math.floor(Math.random() * 5),
        minClouds: 3,
        maxClouds: 8,
        starCount: 100,
      },
      options
    );

    // State variables
    this.isInitialized = false;
    this.loadingComplete = false;
    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedAt = null;
    this.clouds = [];
    this.stars = [];
    this.lastWindowUpdate = 0;
    this.speedSlider = null;
    this.speedDisplay = null;
    this.lampLights = null;
    this.lampDowns = null;
    this.nightLayer = null;
    this.dayLayer = null;

    // Window tracking
    this.windowObjects = [];
    this.isNewDay = true;

    // Initialize properties
    this.startTime = null;
    this.isPlaying = false;
    this.animationFrameId = null;
    this.pausedAt = null;
    this.wasPlayingBeforeHidden = false;
    this.clouds = [];
    this.isInitialized = false;
    this.loadingComplete = false;
    this.animationStarted = false;
    this.animationRunning = false;
    this.lastWindowOffTime = null;

    // Store references to event handlers for proper cleanup
    this.eventHandlers = {
      visibilityChange: null,
      playPauseClick: null,
      resetClick: null,
      speedChange: null,
      clockToggle: null,
      resize: null,
    };

    // DOM element references
    this.loadingOverlay = null;
    this.loadingText = null;
    this.sceneContainer = null;
    this.cityscape = null;
    this.sky = null;
    this.sun = null;
    this.moon = null;
    this.starContainer = null;
    this.cloudContainer = null;
    this.ufoWrap = null;
    this.ufo = null;
    this.airplane = null;
    this.clockDisplay = null;
    this.digitalClock = null;
    this.analogClock = null;
    this.hourHand = null;
    this.minuteHand = null;
    this.clockToggleBtn = null;
    this.playPauseBtn = null;
    this.resetBtn = null;
    this.speedSlider = null;
    this.speedDisplay = null;
    this.lampLights = null;
    this.lampDowns = null;
    this.nightLayer = null;
    this.dayLayer = null;

    // Initialize the scene
    this.init();
  }

  init() {
    // Get references to DOM elements
    this.loadingOverlay = document.getElementById("loading-overlay");

    // Show loading overlay initially, will be hidden after initialization completes
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = "flex";
      setLoadingText("Initializing...");
    }

    this.loadingText = this.loadingOverlay
      ? this.loadingOverlay.querySelector(".loading-text")
      : null;

    // Log initialization start
    log("Starting initialization sequence");

    // Get references to DOM elements
    this.sceneContainer = document.getElementById("scene-container");
    this.cityscape = document.getElementById("cityscape");
    this.sky = document.getElementById("sky");
    this.sun = document.getElementById("sun");
    this.moon = document.getElementById("moon");
    this.starContainer = document.getElementById("stars");
    this.cloudContainer = document.getElementById("clouds");
    this.ufoWrap = document.querySelector(".ufo-wrap");
    this.ufo = document.querySelector(".ufo");
    this.airplane = document.querySelector(".airplane");

    // Clock elements
    this.clockDisplay = document.getElementById("clock");
    this.digitalClock = document.getElementById("digital-clock");
    this.analogClock = document.getElementById("analog-clock");
    this.hourHand = this.analogClock
      ? this.analogClock.querySelector(".hour-hand")
      : null;
    this.minuteHand = this.analogClock
      ? this.analogClock.querySelector(".minute-hand")
      : null;

    // Controls
    this.clockToggleBtn = document.getElementById("toggleClock");
    this.playPauseBtn = document.getElementById("playPause");
    this.resetBtn = document.getElementById("reset");
    this.speedSlider = document.getElementById("speedSlider");
    this.speedDisplay = document.getElementById("speedDisplay");

    // Additional elements that are queried multiple times
    this.lampLights = document.querySelectorAll(".lamp-light");

    // Setup event listeners first (they're lightweight)
    this.setupEventListeners();

    // Set initial state
    this.isInitialized = false;

    // Initialize elements sequentially with delays to prevent browser freezing
    // Use a small timeout to ensure DOM is fully ready
    setTimeout(() => {
      this.initializeSequentially();
    }, 300);
  }

  initializeSequentially() {
    try {
      // Log the initialization progress
      log("Sequential initialization started");

      // Set a timeout to prevent infinite loading
      const initTimeoutId = setTimeout(() => {
        log("Initialization timeout reached - forcing refresh option");
        const emergencyBtn = document.getElementById("emergency-refresh");
        if (emergencyBtn) {
          emergencyBtn.classList.add("visible");
          setLoadingText("Loading taking too long. Consider refreshing.");
        }
        
        // Force hide loading overlay after timeout
        if (this.loadingOverlay) {
          this.loadingOverlay.style.display = "none";
          log("Force hiding loading overlay due to timeout");
          
          // Ensure scene container is visible
          const sceneContainer = document.getElementById("scene-container");
          if (sceneContainer) {
            sceneContainer.style.display = "block";
            sceneContainer.style.visibility = "visible";
          }
        }
      }, INIT_TIMEOUT);

      // Update loading text if available
      setLoadingText("Setting up stars...");

      // Setup stars first
      this.setupStars();

      // Update loading text
      setLoadingText("Setting up sun and moon...");

      // Setup celestial bodies
      this.setupCelestialBodies();

      // Create buildings with a small delay to prevent browser freezing
      setTimeout(() => {
        try {
          // Update loading text
          setLoadingText("Building the buildings...");
          this.createBuildings();

          setLoadingText("Building the houses...");

          this.createHouses();

          // Update loading text
          setLoadingText("Adding final touches...");

          // Add remaining elements
          // Update loading text
          setLoadingText("Setting up clouds...");
          this.setupClouds();
          // Update loading text
          setLoadingText("Building street lamps...");
          this.createStreetlamps();

          // Make sure we're not in pause mode
          this.isPlaying = true;

          // Start at 5:30am (5.5/24 = 0.23 of the day)
          const startTimeOffset = 0.23 * this.options.cycleDuration;
          this.startTime = Date.now() - startTimeOffset;

          // Update loading text
          setLoadingText("Finish Initializing, updating phases...");

          // Set initialization complete
          this.isInitialized = true;
          this.loadingComplete = true;

          // Force an initial update of all visual elements before starting animation
          const timeOfDay =
            ((Date.now() - this.startTime) % this.options.cycleDuration) /
            this.options.cycleDuration;
          this.updatePhases(timeOfDay);
          this.updateCelestialBodies(timeOfDay);
          this.updateClock(timeOfDay);
          this.updateWindowLights(timeOfDay);

          // Update loading text
          setLoadingText("Starting animation...");

          // Start the animation loop
          this.animate();

          // Trigger airplane movement
          this.airplaneMovement();

          // Trigger initial UFO movement
          this.ufoRandomMovement();

          // Start UFO random movement interval
          this.ufoMovementInterval = setInterval(() => {
            if (this.isPlaying && this.ufo) {
              this.ufoRandomMovement();
            }
          }, 1000 + Math.random() * 2000); // Change UFO movement every 1-4 seconds

          // Clear the initialization timeout since we've completed successfully
          clearTimeout(initTimeoutId);

          // Hide loading overlay now that everything is initialized
          if (this.loadingOverlay) {
            setTimeout(() => {
              this.loadingOverlay.style.display = "none";
              
              // Ensure scene container is visible
              const sceneContainer = document.getElementById("scene-container");
              if (sceneContainer) {
                sceneContainer.style.display = "block";
                sceneContainer.style.visibility = "visible";
                sceneContainer.style.opacity = "1";
              }
            }, 500);
          }
        } catch (error) {
          console.error("Error during second phase of initialization:", error);
          // Make emergency button visible
          const emergencyBtn = document.getElementById("emergency-refresh");
          if (emergencyBtn) {
            emergencyBtn.classList.add("visible");
            setLoadingText("Error during initialization. Please refresh.");
          }
        }
      }, 300);
    } catch (error) {
      console.error("Error during first phase of initialization:", error);
      // Make emergency button visible
      const emergencyBtn = document.getElementById("emergency-refresh");
      if (emergencyBtn) {
        emergencyBtn.classList.add("visible");
        setLoadingText("Error during initialization. Please refresh.");
      }
    }
  }

  // New method to reset animation to beginning of cycle
  resetAnimation() {
    log("Resetting animation to beginning of cycle");
    this.startTime = Date.now();
    this.isPlaying = true;

    // Force update to start position (timeOfDay = 0 means midnight/start of cycle)
    // This is 12am/0:00, which should be night time
    const timeOfDay = 0;

    // Apply immediate updates with the reset time
    this.updatePhases(timeOfDay);
    this.updateCelestialBodies(timeOfDay);
    this.updateClock(timeOfDay);
    this.updateClouds();

    // Start animation loop
    this.animate();
  }

  // Setup all event listeners for the scene
  setupEventListeners() {
    // Visibility change handler
    this.eventHandlers.visibilityChange = () => {
      log(`Visibility changed: ${document.hidden ? "hidden" : "visible"}`);
      if (document.hidden) {
        // Pause animation when tab is not visible
        if (this.isPlaying) {
          this.pause();
          this.wasPlayingBeforeHidden = true;
        }
      } else if (this.wasPlayingBeforeHidden) {
        // Resume animation when tab becomes visible again
        this.play();
        this.wasPlayingBeforeHidden = false;
      }
    };
    document.addEventListener(
      "visibilitychange",
      this.eventHandlers.visibilityChange
    );

    // Play/Pause button handler
    if (this.playPauseBtn) {
      this.eventHandlers.playPauseClick = () => {
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      };
      this.playPauseBtn.addEventListener(
        "click",
        this.eventHandlers.playPauseClick
      );
    }

    // Reset button handler
    if (this.resetBtn) {
      this.eventHandlers.resetClick = () => {
        // Start at 5:30am (5.5/24 = 0.23 of the day)
        const startTimeOffset = 0.23 * this.options.cycleDuration;
        this.startTime = Date.now() - startTimeOffset;

        if (!this.isPlaying) {
          this.play();
        }
      };
      this.resetBtn.addEventListener("click", this.eventHandlers.resetClick);
    }

    // Speed slider handler
    if (this.speedSlider) {
      // Get the speed display element
      this.speedDisplay = document.getElementById("speedDisplay");

      this.eventHandlers.speedChange = (e) => {
        // Get current progress through the day
        const now = Date.now();
        const elapsed = now - this.startTime;
        const currentProgress =
          (elapsed % this.options.cycleDuration) / this.options.cycleDuration;

        // Update cycle duration based on slider value (already in milliseconds)
        const sliderValue = parseFloat(e.target.value);
        this.options.cycleDuration = sliderValue;

        // Update the speed display
        if (this.speedDisplay) {
          // Convert milliseconds to minutes and seconds for display
          const minutes = Math.floor(sliderValue / 60000);
          const seconds = Math.floor((sliderValue % 60000) / 1000);
          this.speedDisplay.textContent = `${minutes}:${seconds
            .toString()
            .padStart(2, "0")}`;
        }

        // Adjust start time to maintain current time of day
        this.startTime = now - currentProgress * this.options.cycleDuration;

        // Force update of celestial bodies to match new speed
        const timeOfDay = currentProgress;
        this.updateCelestialBodies(timeOfDay);
      };
      this.speedSlider.addEventListener(
        "input",
        this.eventHandlers.speedChange
      );

      // Initialize the speed display with the current value
      if (this.speedDisplay) {
        const initialValue = parseFloat(this.speedSlider.value);
        const minutes = Math.floor(initialValue / 60000);
        const seconds = Math.floor((initialValue % 60000) / 1000);
        this.speedDisplay.textContent = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
    }

    // Clock toggle handler
    if (this.clockToggleBtn) {
      const digitalClock = document.getElementById("digital-clock");
      const analogClock = document.getElementById("analog-clock");

      this.eventHandlers.clockToggle = () => {
        // Toggle between analog and digital clock
        if (digitalClock && analogClock) {
          if (digitalClock.classList.contains("active")) {
            // Switch to analog
            digitalClock.classList.remove("active");
            analogClock.classList.add("active");
            this.clockToggleBtn.classList.add("active");
          } else {
            // Switch to digital
            digitalClock.classList.add("active");
            analogClock.classList.remove("active");
            this.clockToggleBtn.classList.remove("active");
          }
        }
      };
      this.clockToggleBtn.addEventListener(
        "click",
        this.eventHandlers.clockToggle
      );
    }

    // Window resize handler
    this.eventHandlers.resize = () => {
      // Force update of celestial bodies on resize to maintain correct positions
      if (this.startTime) {
        const now = Date.now();
        const elapsed = now - this.startTime;
        const timeOfDay =
          (elapsed % this.options.cycleDuration) / this.options.cycleDuration;
        this.updateCelestialBodies(timeOfDay);
      }
    };
    window.addEventListener("resize", this.eventHandlers.resize);

    // Emergency refresh button handler
    const emergencyRefreshBtn = document.getElementById("emergency-refresh");
    if (emergencyRefreshBtn) {
      emergencyRefreshBtn.addEventListener("click", () => {
        log("Emergency refresh triggered");
        this.cleanup();
        initScene();
      });
    }
  }

  initializeElements() {
    log("Initializing element references");

    // Scene container
    this.sceneContainer = document.getElementById("scene-container");

    // Store viewport dimensions for calculations
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    // Scene-specific elements
    this.sun = document.getElementById("sun");
    this.moon = document.getElementById("moon");
    this.starContainer = document.getElementById("stars");
    this.clouds = [];
    this.cloudContainer = document.getElementById("clouds");

    // Clock elements
    this.digitalClock = document.getElementById("digital-clock");
    this.analogClock = document.getElementById("analog-clock");

    // Initialize hour and minute hand references
    if (this.analogClock) {
      this.hourHand = this.analogClock.querySelector(".hour-hand");
      this.minuteHand = this.analogClock.querySelector(".minute-hand");

      if (!this.hourHand || !this.minuteHand) {
        log("ERROR: Hour or minute hand not found in analog clock");
      } else {
        log("Analog clock hands initialized successfully");
      }
    }

    log("Element initialization complete");
  }

  setupScene() {
    // Create cityscape container if it doesn't exist
    if (!this.cityscape) {
      this.cityscape = document.createElement("div");
      this.cityscape.id = "cityscape";
      document.getElementById("scene-container").appendChild(this.cityscape);
    }

    this.createBuildings();
    this.createHouses();
    this.createStreetlamps();
  }

  createBuildings() {
    // Get the cityscape element
    const cityscape = document.getElementById("cityscape");
    if (!cityscape) {
      console.error("Cityscape element not found");
      return;
    }

    // Clear existing buildings
    const existingBuildings = document.querySelectorAll(".building");
    existingBuildings.forEach((building) => {
      building.remove();
    });

    // Create buildings in batches
    const buildingCount = this.options.buildingCount;
    const batchSize = 5; // Process buildings in smaller batches
    const fragment = document.createDocumentFragment();

    const createBuildingsBatch = (startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx && i < buildingCount; i++) {
        try {
          // Create building element
          const building = document.createElement("div");
          building.className = "building";

          // Random width (50px to 100px)
          const width = Math.floor(Math.random() * 150) + 50;
          building.style.width = width + "px";

          // Random height (150px to 300px)
          const height = Math.floor(Math.random() * 400) + 150;
          building.style.height = height + "px";

          // Random position
          building.style.left = Math.floor(Math.random() * 90) + "%";

          // Create floors
          const floorCount = Math.floor(height / 30);
          for (let j = 0; j < floorCount; j++) {
            const floor = document.createElement("div");
            floor.className = "floor";

            // Create windows for this floor
            const windowCount = Math.floor(width / 20);
            for (let k = 0; k < windowCount; k++) {
              const window = document.createElement("div");
              window.className = "window";

              // Add to window tracking with a 70% chance of being active
              if (Math.random() < 0.7) {
                // Store window object with proper properties
                this.windowObjects.push({
                  element: window,
                  state: "off",
                  hasBeenOn: false,
                  building: true,
                });
              }

              floor.appendChild(window);
            }

            building.appendChild(floor);
          }

          // Add to fragment
          fragment.appendChild(building);
        } catch (error) {
          console.error(`Error creating building ${i}:`, error);
          // Continue with next building
        }
      }

      // If we have more buildings to process, schedule next batch
      if (endIdx < buildingCount) {
        setTimeout(() => {
          createBuildingsBatch(endIdx, endIdx + batchSize);
        }, 0);
      } else {
        // All buildings created, append fragment to cityscape
        cityscape.appendChild(fragment);
        log("Buildings created");

        // Update loading text
        setLoadingText("Buildings created successfully");
      }
    };

    // Start creating buildings in batches
    createBuildingsBatch(0, batchSize);
  }

  createHouses() {
    // Clear existing houses
    const existingHouses = this.cityscape.querySelectorAll(".house");
    existingHouses.forEach((house) => house.remove());

    // Reset window objects array for house windows
    this.windowObjects = this.windowObjects.filter((w) => w.building);

    const houseColors = [
      "#FFB6C1",
      "#FFEB3B",
      "#64B5F6",
      "#FA8072",
      "#FFA726",
      "#81C784",
      "#BA68C8",
    ];
    const roofColors = [
      "#212121",
      "#795548",
      "#BDBDBD",
      "#2E7D32",
      "#C62828",
      "#4527A0",
      "#1565C0",
    ];
    const doorColors = ["#D32F2F", "#FBC02D", "#6A1B9A", "#1565C0", "#4E342E"];

    const houseCount = Math.floor(Math.random() * 6) + 6; // 6-11 houses
    const containerWidth = window.innerWidth;
    const minSpacing = 130; // Minimum space between houses

    // Create array of x positions
    const positions = [];
    for (let i = 0; i <= houseCount; i++) {
      let x;
      do {
        x = Math.random() * (containerWidth - 120); // 120px is house width
      } while (positions.some((pos) => Math.abs(pos - x) < minSpacing));
      positions.push(x);
    }

    positions.forEach((x, i) => {
      const house = document.createElement("div");
      house.className = "house";

      // Random height between 80 and 110 pixels
      const height = Math.random() * 30 + 80;
      house.style.height = `${height}px`;

      // Random colors
      const houseColor =
        houseColors[Math.floor(Math.random() * houseColors.length)];
      const roofColor =
        roofColors[Math.floor(Math.random() * roofColors.length)];
      const doorColor =
        doorColors[Math.floor(Math.random() * doorColors.length)];

      // Create roof
      const roof = document.createElement("div");
      roof.className = "roof";
      roof.style.backgroundColor = roofColor;
      house.appendChild(roof);

      // Create door
      const door = document.createElement("div");
      door.className = "door";
      door.style.backgroundColor = doorColor;
      house.appendChild(door);

      // Set house color and position
      house.style.backgroundColor = houseColor;
      house.style.left = `${x}px`;

      // Fixed z-index of 20 (houses always in front of buildings)
      house.style.zIndex = 20;

      // Add windows - start unlit
      const leftWindow = document.createElement("div");
      leftWindow.className = "house-window-left";

      // Create window object for state tracking
      const windowId = `window-${this.windowObjects.length}`;
      leftWindow.dataset.windowId = windowId;

      // Add to window objects array
      this.windowObjects.push({
        id: windowId,
        element: leftWindow,
        state: "off",
        hasBeenOn: false,
        building: false, // true for building, false for house
        floor: 0,
        position: 0,
      });

      house.appendChild(leftWindow);

      const rightWindow = document.createElement("div");
      rightWindow.className = "house-window-right";

      // Create window object for state tracking
      const windowId2 = `window-${this.windowObjects.length}`;
      rightWindow.dataset.windowId = windowId2;

      // Add to window objects array
      this.windowObjects.push({
        id: windowId2,
        element: rightWindow,
        state: "off",
        hasBeenOn: false,
        building: false, // true for building, false for house
        floor: 0,
        position: 1,
      });

      house.appendChild(rightWindow);

      this.cityscape.appendChild(house);
    });
  }

  createStreetlamps() {
    // Clear existing lamps
    const existingLamps = this.cityscape.querySelectorAll(".streetlamp");
    existingLamps.forEach((lamp) => lamp.remove());

    const spacing = 150; // Fixed spacing of 150px
    const lampCount = Math.ceil(window.innerWidth / spacing);

    // Store references to lamp lights and lamp downs for later updates
    this.lampLights = [];
    this.lampDowns = [];

    for (let i = 0; i <= lampCount; i++) {
      const lamp = document.createElement("div");
      lamp.className = "streetlamp";
      lamp.style.left = `${i * spacing}px`;

      const light = document.createElement("div");
      light.className = "lamp-light day";

      const down = document.createElement("div");
      down.className = "lamp-down";

      lamp.appendChild(light);
      lamp.appendChild(down);

      this.cityscape.appendChild(lamp);

      // Store references
      this.lampLights.push(light);
      this.lampDowns.push(down);
    }
  }

  setupCelestialBodies() {
    log("Setting up celestial bodies");
    // Update loading text
    setLoadingText("setupCelestialBodies()...");
    // Check if elements exist
    if (!this.sun) {
      this.sun = document.getElementById("sun");
      if (!this.sun) {
        log("ERROR: Sun element not found");
        return;
      }
      // Update loading text
      setLoadingText("setupCelestialBodies() loaded Sun.");
    }

    if (!this.moon) {
      this.moon = document.getElementById("moon");
      if (!this.moon) {
        log("ERROR: Moon element not found");
        return;
      }
      setLoadingText("setupCelestialBodies() loaded Moon.");
    }

    // Ensure they have proper styling
    this.sun.className = "sun";
    this.moon.className = "moon";

    // Add moon craters if they don't exist
    if (this.moon.querySelectorAll(".moon-crater").length === 0) {
      for (let i = 0; i < 4; i++) {
        const crater = document.createElement("div");
        crater.className = "moon-crater";
        this.moon.appendChild(crater);
      }
      setLoadingText("setupCelestialBodies() Setup Moon Craters.");
    }

    log("Celestial bodies setup complete");
  }

  setupStars() {
    // Update loading text
    setLoadingText("setupStars()...");

    try {
      // Make sure the star container exists
      if (!this.starContainer) {
        this.starContainer = document.getElementById("stars");
        if (!this.starContainer) {
          console.error("Star container not found");
          return; // Exit if we can't find the star container
        }
      }

      // Clear existing stars
      while (this.starContainer.firstChild) {
        this.starContainer.removeChild(this.starContainer.firstChild);
      }

      // Create random stars - use a more efficient approach with batching
      const starCount = Math.floor(Math.random() * 50) + 100; // 100-150 stars
      const batchSize = 20; // Process stars in smaller batches
      const fragment = document.createDocumentFragment(); // Use fragment for better performance

      const createStarsBatch = (startIdx, endIdx) => {
        for (let i = startIdx; i < endIdx && i < starCount; i++) {
          const star = document.createElement("div");
          star.className = "star";

          // Random position
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          star.style.top = `${top}%`;
          star.style.left = `${left}%`;

          // Random size (0.5px to 2px)
          const size = Math.random() * 1.5 + 0.5;
          star.style.width = `${size}px`;
          star.style.height = `${size}px`;

          // Random opacity
          star.style.opacity = Math.random() * 0.8 + 0.2;

          // Add to fragment
          fragment.appendChild(star);
        }

        // If we have more stars to process, schedule next batch
        if (endIdx < starCount) {
          setTimeout(() => {
            createStarsBatch(endIdx, endIdx + batchSize);
          }, 0);
        } else {
          // All stars created, append fragment to container
          this.starContainer.appendChild(fragment);
          log("Stars setup complete");
        }
      };

      // Start creating stars in batches
      createStarsBatch(0, batchSize);
    } catch (error) {
      console.error("Error setting up stars:", error);
      // Continue initialization even if stars fail
    }
  }

  setupClouds() {
    // Clear existing clouds
    const existingClouds = document.querySelectorAll(".cloud");
    existingClouds.forEach((cloud) => cloud.remove());
    this.clouds = [];

    // Create initial clouds
    this.minClouds = 3;
    this.maxClouds = 6;

    for (let i = 0; i < this.minClouds; i++) {
      this.createCloud(true);
    }
  }

  createCloud(randomizePosition = false) {
    const cloud = document.createElement("div");
    cloud.className = "cloud";

    // Random cloud properties
    const width = 100 + Math.random() * 100;
    const height = 40 + Math.random() * 30;
    const speed = 0.02 + Math.random() * 0.03;

    cloud.style.width = width + "px";
    cloud.style.height = height + "px";
    cloud.style.top = Math.random() * 40 + "%";

    if (randomizePosition) {
      cloud.style.left = Math.random() * 100 + "%";
    } else {
      cloud.style.left = "-20%";
    }

    // Store cloud properties
    cloud.dataset.speed = speed;

    document.getElementById("clouds").appendChild(cloud);
    this.clouds.push(cloud);

    // Remove excess clouds
    if (this.clouds.length > this.maxClouds) {
      const oldCloud = this.clouds.shift();
      oldCloud.remove();
    }

    return cloud;
  }

  updateClouds() {
    const remainingClouds = [];

    for (const cloud of this.clouds) {
      const left = parseFloat(cloud.style.left);
      const speed = parseFloat(cloud.dataset.speed);

      if (left <= 120) {
        cloud.style.left = left + speed + "%";
        remainingClouds.push(cloud);
      } else {
        cloud.remove();
      }
    }

    this.clouds = remainingClouds;

    // Add new clouds if needed
    if (Math.random() < 0.01 && this.clouds.length < this.maxClouds) {
      this.createCloud(false);
    } else if (this.clouds.length < this.minClouds) {
      this.createCloud(false);
    }
  }

  updateCelestialBodies(timeOfDay) {
    // Calculate which bodies should be visible based on the hour of day
    const hourOfDay = timeOfDay * 24;

    // Sun: visible from dawn (5:30am) through dusk (8pm)
    // Moon: visible from dusk (6pm) through dawn (5:30am)

    // Calculate sun visibility and animation progress
    if (hourOfDay >= 5.5 && hourOfDay <= 20) {
      // Sun is visible during day
      // Calculate animation progress (0-1) for the sun
      const sunDayLength = 14.5; // 5:30am to 8pm = 14.5 hours
      const sunProgress = (hourOfDay - 5.5) / sunDayLength;

      // Make sun visible
      this.sun.style.opacity = "1";
      this.sun.classList.add("visible");

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate x position - linear from left to right
      // Start at -500px, end at viewportWidth + 500px
      const totalWidth = viewportWidth + 1000; // Add 500px on each side
      const xPos = -500 + totalWidth * sunProgress;

      // Calculate y position - parabolic path
      // Use a simple parabola: y = a * (x - h)² + k
      // Where (h,k) is the vertex (0.5, 0.05) and a = 4
      // This creates a parabola that opens upward with its lowest point at 5% from the top
      const normalizedX = sunProgress - 0.5; // Center at 0.5 -> 0
      const a = 4; // Controls how steep the parabola is
      const k = 0.05; // Lowest point (5% from top)
      const yPercent = a * Math.pow(normalizedX, 2) + k;

      // Convert to pixel position (invert because CSS y-axis goes down)
      const yPos = yPercent * viewportHeight;

      // Set positions directly
      this.sun.style.left = `${xPos}px`;
      this.sun.style.top = `${yPos}px`;

      // Update sun appearance
      // Calculate sun brightness based on progress
      const brightness = Math.min(1, 1 - Math.abs(sunProgress - 0.5) * 2);

      // Update sun appearance
      const baseSunColor = [255, 221, 0];
      const sunsetColor = [255, 140, 0];
      const sunColor = this.interpolateColor(
        sunsetColor,
        baseSunColor,
        brightness
      );

      // Apply color and glow
      const rgbSunColor = `rgb(${sunColor[0]}, ${sunColor[1]}, ${sunColor[2]})`;
      this.sun.style.backgroundColor = rgbSunColor;
      this.sun.style.boxShadow = `0 0 ${
        30 * brightness
      }px ${rgbSunColor}, 0 0 ${60 * brightness}px rgb(255, 187, 0)`;
    } else {
      // Sun is not visible
      this.sun.style.opacity = "0";
      this.sun.classList.remove("visible");
    }

    // Calculate moon visibility and animation progress
    if (hourOfDay >= 18 || hourOfDay <= 5.5) {
      // Moon is visible during night
      // Calculate animation progress (0-1) for the moon
      let moonProgress;

      const moonNightLength = 11.5; // 6pm to 5:30am = 11.5 hours

      if (hourOfDay >= 18) {
        // Evening: 6pm (0) to 12am (0.52)
        moonProgress = (hourOfDay - 18) / moonNightLength;
      } else {
        // Early morning: 12am (0.52) to 5:30am (1)
        moonProgress = (hourOfDay + 6) / moonNightLength;
      }

      // Make moon visible
      this.moon.style.opacity = "1";
      this.moon.classList.add("visible");

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate x position - linear from left to right
      // Start at -500px, end at viewportWidth + 500px
      const totalWidth = viewportWidth + 1000; // Add 500px on each side
      const xPos = -500 + totalWidth * moonProgress;

      // Calculate y position - parabolic path
      // Use a simple parabola: y = a * (x - h)² + k
      // Where (h,k) is the vertex (0.5, 0.05) and a = 4
      // This creates a parabola that opens upward with its lowest point at 5% from the top
      const normalizedX = moonProgress - 0.5; // Center at 0.5 -> 0
      const a = 4; // Controls how steep the parabola is
      const k = 0.05; // Lowest point (5% from top)
      const yPercent = a * Math.pow(normalizedX, 2) + k;

      // Convert to pixel position (invert because CSS y-axis goes down)
      const yPos = yPercent * viewportHeight;

      // Set positions directly
      this.moon.style.left = `${xPos}px`;
      this.moon.style.top = `${yPos}px`;
    } else {
      // Moon is not visible
      this.moon.style.opacity = "0";
      this.moon.classList.remove("visible");
    }

    // Update stars based on time of day (stars fade in at dusk and fade out at dawn)
    let starOpacity = 0;
    if (hourOfDay >= 19 || hourOfDay < 5) {
      // Night: full opacity
      starOpacity = 1;
    } else if (hourOfDay >= 5 && hourOfDay < 7) {
      // Dawn: fade out (7-5)/2 = 1 -> 0
      starOpacity = 1 - (hourOfDay - 5) / 2;
    } else if (hourOfDay >= 17 && hourOfDay < 19) {
      // Dusk: fade in (19-17)/2 = 0 -> 1
      starOpacity = (hourOfDay - 17) / 2;
    }

    this.starContainer.style.opacity = starOpacity.toString();
  }

  updatePhases(timeOfDay) {
    try {
      // Convert time of day to hours (0-24)
      const currentTime = timeOfDay * 24;
      let currentPhase;

      // Get all sky layers
      const skyLayers = {
        dawn: document.querySelector(".sky-layer.dawn"),
        day: document.querySelector(".sky-layer.day"),
        dusk: document.querySelector(".sky-layer.dusk"),
        night: document.querySelector(".sky-layer.night"),
      };

      // Reset all layers to hidden first
      Object.values(skyLayers).forEach((layer) => {
        if (layer) {
          layer.classList.add("hidden");
          layer.style.opacity = 0;
        }
      });

      // Update sky colors based on time of day
      if (currentTime >= 5 && currentTime < 7) {
        // Dawn: 5am-7am
        currentPhase = "dawn";
        if (skyLayers.dawn) {
          skyLayers.dawn.classList.remove("hidden");
          skyLayers.dawn.style.opacity = 1;

          // Gradually show day behind dawn as we approach 7am
          const progress = (currentTime - 5) / 2; // 0 to 1 over 2 hours
          if (skyLayers.day) {
            skyLayers.day.classList.remove("hidden");
            skyLayers.day.style.opacity = progress;
          }
        }
      } else if (currentTime >= 7 && currentTime < 18) {
        // Day: 7am-6pm
        currentPhase = "day";
        if (skyLayers.day) {
          skyLayers.day.classList.remove("hidden");
          skyLayers.day.style.opacity = 1;
        }
      } else if (currentTime >= 18 && currentTime < 20) {
        // Dusk: 6pm-8pm
        currentPhase = "dusk";
        if (skyLayers.dusk) {
          skyLayers.dusk.classList.remove("hidden");
          skyLayers.dusk.style.opacity = 1;

          // Gradually show night behind dusk as we approach 8pm
          const progress = (currentTime - 18) / 2; // 0 to 1 over 2 hours
          if (skyLayers.night) {
            skyLayers.night.classList.remove("hidden");
            skyLayers.night.style.opacity = progress;
          }
        }
      } else {
        // Night: 8pm-5am
        currentPhase = "night";
        if (skyLayers.night) {
          skyLayers.night.classList.remove("hidden");
          skyLayers.night.style.opacity = 1;
        }
      }

      // Update lamp lights based on time of day
      if (this.lampLights && this.lampLights.length > 0) {
        for (let i = 0; i < this.lampLights.length; i++) {
          const light = this.lampLights[i];
          const down = this.lampDowns[i];

          // Turn on streetlamps at dusk and night, turn off during day
          if (currentPhase === "night" || currentPhase === "dusk") {
            light.classList.remove("day");
            light.classList.add("night");

            if (down) {
              down.classList.add("night");
            }
          } else {
            light.classList.remove("night");
            light.classList.add("day");

            if (down) {
              down.classList.remove("night");
            }
          }
        }
      }

      // Update window lights based on time of day
      this.updateWindowLights(timeOfDay);

      // Update the clock display
      this.updateClock(timeOfDay);
    } catch (error) {
      console.error("Error in updatePhases:", error);
    }
  }

  updateClock(timeOfDay) {
    // Convert timeOfDay (0-1) to hours and minutes
    const totalMinutes = timeOfDay * 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);

    // Format for 12-hour clock
    const hours12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";

    // Update digital clock
    this.digitalClock.textContent = `${hours12}:${String(minutes).padStart(
      2,
      "0"
    )} ${ampm}`;

    // Update analog clock
    if (this.hourHand && this.minuteHand) {
      // Hour hand makes two complete 360° rotations in 24 hours
      const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30 degrees per hour, 0.5 degrees per minute
      this.hourHand.style.transform = `rotate(${hourAngle}deg)`;

      // Minute hand makes one complete 360° rotation per hour
      const minuteAngle = minutes * 6; // 6 degrees per minute
      this.minuteHand.style.transform = `rotate(${minuteAngle}deg)`;

      // Log occasionally for debugging
      if (Math.random() < 0.01) {
        log(
          `Updating clock - Time: ${hours12}:${String(minutes).padStart(
            2,
            "0"
          )} ${ampm}`
        );
        log(
          `Hour hand angle: ${hourAngle}deg, Minute hand angle: ${minuteAngle}deg`
        );
      }
    } else if (Math.random() < 0.01) {
      // Log if hands are missing, but only occasionally
      log("WARNING: Hour or minute hand references missing in updateClock");
      log(
        `hourHand exists: ${!!this.hourHand}, minuteHand exists: ${!!this
          .minuteHand}`
      );
    }
  }

  updateWindowLights(timeOfDay) {
    // Only update window lights every 500ms to reduce CPU usage
    const now = Date.now();
    if (now - this.lastWindowUpdate < 500) {
      return;
    }
    this.lastWindowUpdate = now;

    try {
      // Convert time of day to hours (0-24)
      const hours = timeOfDay * 24;

      // Check if it's a new day (morning)
      if (hours >= 7 && hours < 8 && !this.isNewDay) {
        // Reset all window states for the new day
        this.windowObjects.forEach((window) => {
          window.hasBeenOn = false;
          window.state = "off";
          window.element.classList.remove("lit");
        });
        this.isNewDay = true;
        console.log("New day started - window states reset");
      } else if (hours < 7 || hours >= 8) {
        // Not morning anymore
        this.isNewDay = false;
      }

      // Determine the percentage of windows that should be lit based on time
      let litPercentage = 0;

      // No lights during day (7am-5pm): 0%
      if (hours >= 7 && hours < 17) {
        litPercentage = 0;
      }
      // Evening (5pm-7pm): 10-35%
      else if (hours >= 17 && hours < 19) {
        // Scale from 10% at 5pm to 35% at 7pm
        litPercentage = 0.1 + 0.25 * ((hours - 17) / 2);
      }
      // Night (7pm-11pm): 35-10%
      else if (hours >= 19 && hours < 23) {
        // Scale from 35% at 7pm down to 10% at 11pm
        litPercentage = 0.35 - 0.25 * ((hours - 19) / 4);
      }
      // Late night (11pm-7am): 0%
      else {
        litPercentage = 0;
      }

      // Handle building windows
      const buildingWindows = this.windowObjects.filter((w) => w.building);

      // Calculate how many windows should be lit
      const totalBuildingWindows = buildingWindows.length;
      const targetLitCount = Math.floor(totalBuildingWindows * litPercentage);

      // Count currently lit windows
      const currentlyLitWindows = buildingWindows.filter(
        (w) => w.state === "on"
      ).length;

      // If we need to turn on more windows
      if (currentlyLitWindows < targetLitCount) {
        // Get eligible windows (not lit and haven't been on tonight)
        const eligibleWindows = buildingWindows.filter(
          (w) => w.state === "off" && !w.hasBeenOn
        );

        // Shuffle array to randomize which windows get turned on
        this.shuffleArray(eligibleWindows);

        // Turn on enough windows to reach target
        const windowsToLight = eligibleWindows.slice(
          0,
          Math.min(targetLitCount - currentlyLitWindows, eligibleWindows.length)
        );

        windowsToLight.forEach((window) => {
          window.state = "on";
          window.hasBeenOn = true;
          window.element.classList.add("lit");
        });
      }
      // If we need to turn off windows
      else if (currentlyLitWindows > targetLitCount) {
        // Get all lit windows
        const litWindows = buildingWindows.filter((w) => w.state === "on");

        // Shuffle array to randomize which windows get turned off
        this.shuffleArray(litWindows);

        // Turn off enough windows to reach target
        const windowsToTurnOff = litWindows.slice(
          0,
          currentlyLitWindows - targetLitCount
        );

        windowsToTurnOff.forEach((window) => {
          window.state = "off";
          // Note: hasBeenOn remains true
          window.element.classList.remove("lit");
        });
      }

      // Handle house windows separately - simpler logic
      const houseWindows = this.windowObjects.filter((w) => !w.building);

      houseWindows.forEach((window) => {
        // Houses have lights on during evening and night (5pm-11pm)
        const shouldBeLit = hours >= 17 && hours < 23;

        if (shouldBeLit && window.state === "off" && !window.hasBeenOn) {
          window.state = "on";
          window.hasBeenOn = true;
          window.element.classList.add("lit");
        } else if (!shouldBeLit && window.state === "on") {
          window.state = "off";
          window.element.classList.remove("lit");
        }
      });
    } catch (error) {
      console.error("Error updating window lights:", error);
    }
  }

  calculateWindowTurnOffTime() {
    // Use rejection sampling with the provided Gaussian mixture PDF
    let x, y;
    do {
      // Generate random x between 18 (6pm) and 25 (1am)
      x = Math.random() * 7 + 18;
      // Generate random y between 0 and the max PDF value (approximately 0.2)
      y = Math.random() * 0.2;
    } while (y > this.gaussianMixturePDF(x));

    return x;
  }

  gaussianMixturePDF(x) {
    // First Gaussian parameters
    const mu1 = 8 + 18; // Shift to 8pm (20:00)
    const sigma1 = Math.sqrt(5);
    const w1 = 0.7;

    // Second Gaussian parameters
    const mu2 = 4 + 18; // Shift to 4pm (22:00)
    const sigma2 = Math.sqrt(10);
    const w2 = 0.3;

    // Normal distribution formula
    function normalPDF(x, mu, sigma) {
      return (
        (1 / (Math.sqrt(2 * Math.PI) * sigma)) *
        Math.exp(-Math.pow(x - mu, 2) / (2 * sigma * sigma))
      );
    }

    // Weighted sum of both Gaussians
    return w1 * normalPDF(x, mu1, sigma1) + w2 * normalPDF(x, mu2, sigma2);
  }

  calculateCelestialPosition(progress, body) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate horizontal position
    // Start: -200px, End: viewportWidth + 200px
    const startX = -200;
    const endX = viewportWidth + 200;
    const x = startX + progress * (endX - startX);

    // Calculate vertical position using a parabola with the equation: y = a(x-h)^2 + k
    // Where (h,k) is the vertex (0.5, 0.05) and a = 4
    // This creates a parabola that opens upward with its lowest point at 5% from the top
    const h = viewportWidth / 2;
    const k = 10; // Apex at 10px from top

    // Calculate 'a' safely to prevent division by zero or very small numbers
    // When x = -200, y should be viewportHeight
    // When x = viewportWidth + 200, y should also be viewportHeight
    const maxDistance = Math.max(h + 200, viewportWidth + 200 - h);
    const a =
      maxDistance > 0
        ? (viewportHeight - k) / (maxDistance * maxDistance)
        : 0.001;

    // Calculate y using the parabola formula with safety checks
    let y;
    try {
      y = a * Math.pow(x - h, 2) + k;

      // Ensure y is a valid number
      if (isNaN(y) || !isFinite(y)) {
        y = viewportHeight / 2; // Fallback to middle of screen
      }
    } catch (e) {
      console.error("Error calculating celestial position:", e);
      y = viewportHeight / 2; // Fallback to middle of screen
    }

    // Ensure y stays within viewport bounds
    y = Math.max(10, Math.min(y, viewportHeight));

    return { x, y };
  }

  interpolateColor(color1, color2, factor) {
    const c1 = this.parseColor(color1);
    const c2 = this.parseColor(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  }

  parseColor(color) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    return {
      r: parseInt(ctx.fillStyle.slice(1, 3), 16),
      g: parseInt(ctx.fillStyle.slice(3, 5), 16),
      b: parseInt(ctx.fillStyle.slice(5, 7), 16),
    };
  }

  play() {
    log(`play called, isPlaying: ${this.isPlaying}`);

    if (this.isPlaying) {
      return;
    }

    // Set isPlaying to true BEFORE starting animation to prevent race conditions
    this.isPlaying = true;
    this.isPaused = false;

    // Resume all celestial animations
    this.sun.style.animationPlayState = "running";
    this.moon.style.animationPlayState = "running";

    // Resume UFO animation - ensure the whole UFO-wrap is resumed
    if (this.ufoWrap) {
      // Remove all animation classes first
      this.ufoWrap.classList.remove(
        "drifting",
        "up",
        "down",
        "diagonalUpRight",
        "diagonalDownRight",
        "diagonalUpLeft",
        "diagonalDownLeft",
        "zoomOffRight",
        "zoomOffLeft",
        "fadeIn"
      );

      // Force the current position
      const ufoRect = this.ufoWrap.getBoundingClientRect();
      this.ufoWrap.style.transition = "none";
      this.ufoWrap.style.animation = "none";
      if (this.ufoWrap.style.top <= 15) {
        this.ufoWrap.style.top = "15px";
      }
      this.ufoWrap.style.top = `${ufoRect.top}px`;

      this.ufoWrap.style.left = `${ufoRect.left}px`;
      this.ufoWrap.style.animationPlayState = "running";

      // Also resume any animations on child elements
      const ufoElements = this.ufoWrap.querySelectorAll("*");
      ufoElements.forEach((element) => {
        element.style.animationPlayState = "running";
        element.style.transition = "none";
      });

      // Restart UFO movement interval if it was cleared
      if (!this.ufoMovementInterval) {
        this.ufoMovementInterval = setInterval(() => {
          if (this.isPlaying && this.ufo) {
            this.ufoRandomMovement();
          }
        }, 1000 + Math.random() * 3000); // Change UFO movement every 1-4 seconds
      }
    }

    // Resume cloud animations
    if (this.clouds && this.clouds.length) {
      this.clouds.forEach((cloud) => {
        if (cloud) {
          // Remove the fixed position and allow clouds to continue moving
          cloud.style.transition = "left 0.1s linear";

          // Get the current position and speed from dataset
          const left = parseFloat(cloud.style.left);
          const speed = parseFloat(cloud.dataset.speed);

          // Apply a small increment to ensure movement resumes
          setTimeout(() => {
            if (cloud && cloud.parentNode) {
              cloud.style.left = left + speed + "%";
            }
          }, 50);
        }
      });
    }

    // Resume airplane animation if present
    if (this.airplane) {
      this.airplane.style.animationPlayState = "running";
    }

    // Start the animation loop
    this.animate();

    // Update UI
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = "Pause";
    }

    // Trigger UFO movement
    this.ufoRandomMovement();

    // Failsafe: If animation doesn't start properly, try again after a short delay
    setTimeout(() => {
      if (this.isPlaying && !this.animationRunning) {
        log("Animation not running after play, retrying...");
        this.animate();
      }
    }, 100);
  }

  pause() {
    if (this.isPaused) {
      return;
    }

    // Set isPlaying to false BEFORE cancelling animation frame to prevent race conditions
    this.isPlaying = false;
    this.isPaused = true;

    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Pause all celestial animations
    this.sun.style.animationPlayState = "paused";
    this.moon.style.animationPlayState = "paused";

    // Pause UFO animation - ensure the whole UFO-wrap is paused
    if (this.ufoWrap) {
      // Remove all animation classes first
      this.ufoWrap.classList.remove(
        "drifting",
        "up",
        "down",
        "diagonalUpRight",
        "diagonalDownRight",
        "diagonalUpLeft",
        "diagonalDownLeft",
        "zoomOffRight",
        "zoomOffLeft",
        "fadeIn"
      );

      // Force the current position
      const ufoRect = this.ufoWrap.getBoundingClientRect();
      this.ufoWrap.style.transition = "none";
      this.ufoWrap.style.animation = "none";
      if (this.ufoWrap.style.top <= 15) {
        this.ufoWrap.style.top = "15px";
      }
      this.ufoWrap.style.top = `${ufoRect.top}px`;

      this.ufoWrap.style.left = `${ufoRect.left}px`;
      this.ufoWrap.style.animationPlayState = "paused";

      // Also pause any animations on child elements
      const ufoElements = this.ufoWrap.querySelectorAll("*");
      ufoElements.forEach((element) => {
        element.style.animationPlayState = "paused";
        element.style.transition = "none";
      });

      // Clear any UFO movement interval
      if (this.ufoMovementInterval) {
        clearInterval(this.ufoMovementInterval);
        this.ufoMovementInterval = null;
      }
    }

    // Pause cloud animations
    if (this.clouds && this.clouds.length) {
      this.clouds.forEach((cloud) => {
        if (cloud) {
          // Remove the fixed position and allow clouds to continue moving
          cloud.style.transition = "none";
          // Get current left position
          const computedStyle = window.getComputedStyle(cloud);
          cloud.style.left = computedStyle.left;
          cloud.style.animationPlayState = "paused";
        }
      });
    }

    // Pause airplane animation if present
    if (this.airplane) {
      this.airplane.style.animationPlayState = "paused";
    }

    // Store the exact moment we paused
    this.pausedAt = Date.now();

    // Update UI
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = "Play";
    }
  }

  startAnimation() {
    log(`startAnimation called, isPlaying: ${this.isPlaying}`);

    if (this.isPlaying) {
      return;
    }

    // Reset animation state
    this.isPlaying = true;
    this.startTime = Date.now();
    log("Animation started, isPlaying set to true");

    // Force initial updates immediately
    const timeOfDay = 0; // Start at midnight
    log(`Forcing initial update with timeOfDay: ${timeOfDay}`);

    // Make celestial bodies visible before updating positions
    this.sun.style.display = "block";
    this.moon.style.display = "block";

    // Apply immediate updates
    this.updatePhases(timeOfDay);
    this.updateCelestialBodies(timeOfDay);
    this.updateClock(timeOfDay);
    this.updateClouds();
    this.updateWindowLights(timeOfDay);

    // Start animation loop
    log("Starting animation loop");
    this.animate();
  }

  animate() {
    // Don't continue if animation is paused
    if (!this.isPlaying) {
      return;
    }

    try {
      // Calculate current time of day (0-1 representing midnight to midnight)
      const now = Date.now();
      const elapsed = now - this.startTime;
      const timeOfDay =
        (elapsed % this.options.cycleDuration) / this.options.cycleDuration;

      // Update scene elements based on time of day
      this.updatePhases(timeOfDay);
      this.updateCelestialBodies(timeOfDay);
      this.updateClock(timeOfDay);
      this.updateClouds();
      this.updateWindowLights(timeOfDay);

      // Ensure UFO never goes above 15px from the top
      if (this.ufoWrap) {
        const ufoTop = this.ufoWrap.getBoundingClientRect().top;
        if (ufoTop < 15) {
          this.ufoWrap.style.top = "15px";
        }
      }
    } catch (error) {
      // Catch any errors to prevent page crashes
      console.error("Error in animation loop:", error);
    }

    // Request next frame - do this outside try/catch to ensure animation continues
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Set a flag to indicate animation is running
    this.animationRunning = true;

    // Enforce minimum top position for UFO
    if (this.ufoWrap && this.ufoWrap.getBoundingClientRect().top < 15) {
      this.ufoWrap.style.top = "15px";
    }
  }

  // Add a failsafe to check if animation is running
  checkAnimationStatus() {
    log("Checking animation status...");

    // If animation should be running but isn't, restart it
    if (this.isPlaying && !this.animationRunning) {
      log("Animation appears to be stalled, restarting...");

      // Cancel any existing animation frame
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      // Restart animation
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  resumeAnimation() {
    if (this.isPlaying) {
      return;
    }

    // Resume all celestial animations
    this.sun.style.animationPlayState = "running";
    this.moon.style.animationPlayState = "running";

    // Resume UFO animation if present
    if (this.ufoWrap) {
      // Remove all previous animation classes
      this.ufoWrap.classList.remove(
        "up",
        "down",
        "diagonalUpRight",
        "diagonalDownRight",
        "diagonalUpLeft",
        "diagonalDownLeft",
        "zoomOffRight",
        "zoomOffLeft",
        "fadeIn"
      );

      // Force the current position
      const ufoRect = this.ufoWrap.getBoundingClientRect();
      this.ufoWrap.style.transition = "none";
      this.ufoWrap.style.animation = "none";
      this.ufoWrap.style.top = `${ufoRect.top}px`;

      if (this.ufoWrap.style.top <= 15) {
        this.ufoWrap.style.top = "15px";
      }
      this.ufoWrap.style.left = `${ufoRect.left}px`;
      this.ufoWrap.style.animationPlayState = "running";

      // Also resume any animations on child elements
      const ufoElements = this.ufoWrap.querySelectorAll("*");
      ufoElements.forEach((element) => {
        element.style.animationPlayState = "running";
        element.style.transition = "none";
      });

      // Restart UFO movement interval if it was cleared
      if (!this.ufoMovementInterval) {
        this.ufoMovementInterval = setInterval(() => {
          if (this.isPlaying && this.ufo) {
            this.ufoRandomMovement();
          }
        }, 10000); // Change UFO movement every 10 seconds
      }
    }

    // Resume cloud animations
    if (this.clouds && this.clouds.length) {
      this.clouds.forEach((cloud) => {
        if (cloud) {
          // Remove the fixed position and allow clouds to continue moving
          cloud.style.transition = "left 0.1s linear";

          // Get the current position and speed from dataset
          const left = parseFloat(cloud.style.left);
          const speed = parseFloat(cloud.dataset.speed);

          // Apply a small increment to ensure movement resumes
          setTimeout(() => {
            if (cloud && cloud.parentNode) {
              cloud.style.left = left + speed + "%";
            }
          }, 50);
        }
      });
    }

    // Resume airplane animation if present
    if (this.airplane) {
      this.airplane.style.animationPlayState = "running";
    }

    // Adjust start time to account for pause duration
    if (this.pausedAt) {
      const pauseDuration = Date.now() - this.pausedAt;
      this.startTime += pauseDuration;
      this.pausedAt = null;
    }

    // Set isPlaying to true and restart animation
    this.isPlaying = true;
    this.animate();
  }

  pauseAnimations() {
    // Pause all animations
    this.isPlaying = false;
    document.body.classList.add("paused");

    // Pause specific animations
    if (this.clouds) {
      this.clouds.forEach((cloud) => {
        cloud.style.animationPlayState = "paused";
      });
    }
    if (this.ufoWrap) {
      this.ufoWrap.style.animationPlayState = "paused";
    }
    if (this.ufo) {
      this.ufo.style.animationPlayState = "paused";
    }
  }

  // UFO movement
  ufoRandomMovement() {
    // Only proceed if UFO elements exist
    if (!this.ufoWrap || !this.ufo) return;

    // Get the current position
    const ufoRect = this.ufoWrap.getBoundingClientRect();
    const currentTop = ufoRect.top;
    const currentLeft = ufoRect.left;

    // If UFO is at or near the top of the screen, make it come back down
    if (currentTop <= 15) {
      this.handleUfoAtTop();
      return;
    }

    // Remove all animation classes first
    this.ufoWrap.classList.remove(
      "up",
      "down",
      "diagonalUpRight",
      "diagonalDownRight",
      "diagonalUpLeft",
      "diagonalDownLeft",
      "zoomOffRight",
      "zoomOffLeft",
      "fadeIn"
    );

    // Calculate viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Determine if we should keep the UFO in the upper half (90% chance)
    const keepInUpperHalf = Math.random() < 0.9;

    // Calculate max vertical position based on whether to keep in upper half
    const maxVerticalPosition = keepInUpperHalf
      ? viewportHeight * 0.5
      : viewportHeight - 100;

    // Temporarily disable transitions
    this.ufoWrap.style.transition = "none";

    // Set the current position explicitly to prevent jumps
    this.ufoWrap.style.top = `${currentTop}px`;
    this.ufoWrap.style.left = `${currentLeft}px`;

    // Force reflow
    void this.ufoWrap.offsetWidth;

    // Calculate new position based on movement type with equal probability for all directions
    // Generate a random movement type (0-7 for 8 possible movements)
    const movementType = Math.floor(Math.random() * 8);

    // Set transition duration based on distance to prevent teleporting appearance
    const transitionDuration = 2.5; // seconds

    // Enable transition before calculating new position
    this.ufoWrap.style.transition = `top ${transitionDuration}s ease-in-out, left ${transitionDuration}s ease-in-out, right ${transitionDuration}s ease-in-out`;

    // Small delay to ensure transition is applied
    setTimeout(() => {
      let newTop, newLeft;

      switch (movementType) {
        case 0: // Up
          newTop = Math.max(15, currentTop - 200);
          newLeft = currentLeft;
          console.log("UFO moving up");
          break;
        case 1: // Down
          newTop = Math.min(maxVerticalPosition, currentTop + 200);
          newLeft = currentLeft;
          console.log("UFO moving down");
          break;
        case 2: // Diagonal up right
          newTop = Math.max(15, currentTop - 150);
          newLeft = Math.min(viewportWidth - 150, currentLeft + 200);
          console.log("UFO moving diagonal up right");
          break;
        case 3: // Diagonal down right
          newTop = Math.min(maxVerticalPosition, currentTop + 150);
          newLeft = Math.min(viewportWidth - 150, currentLeft + 200);
          console.log("UFO moving diagonal down right");
          break;
        case 4: // Diagonal up left
          newTop = Math.max(15, currentTop - 150);
          newLeft = Math.max(50, currentLeft - 200);
          console.log("UFO moving diagonal up left");
          break;
        case 5: // Diagonal down left
          newTop = Math.min(maxVerticalPosition, currentTop + 150);
          newLeft = Math.max(50, currentLeft - 200);
          console.log("UFO moving diagonal down left");
          break;
        case 6: // Zoom off right
          this.ufoWrap.style.right = "-110%";
          this.ufoWrap.style.left = "auto";
          console.log("UFO zooming right");
          this.scheduleUfoReturn();
          return;
        case 7: // Zoom off left
          this.ufoWrap.style.left = "-110%";
          console.log("UFO zooming left");
          this.scheduleUfoReturn();
          return;
      }

      // Apply the new position with transition
      this.ufoWrap.style.top = `${newTop}px`;
      this.ufoWrap.style.left = `${newLeft}px`;
    }, 20);
  }

  handleUfoAtTop() {
    // Pause animations
    this.ufoWrap.classList.remove("drifting");
    this.ufoWrap.style.animationPlayState = "paused";

    // Schedule the UFO to return after a delay
    setTimeout(() => {
      // Make UFO invisible
      this.ufoWrap.style.opacity = "0";

      // After it's invisible, reset its position
      setTimeout(() => {
        // Remove up class but keep transition property
        this.ufoWrap.classList.remove("up");

        // Set a random horizontal position
        const randomLeft = Math.random() * 80 + 10; // 10% to 90% of screen width
        this.ufoWrap.style.left = `${randomLeft}%`;

        // Position off-screen at the bottom
        this.ufoWrap.style.top = "95vh";

        // Force reflow to ensure the style changes take effect before adding transitions back
        void this.ufoWrap.offsetWidth;

        // Make it visible again
        this.ufoWrap.style.opacity = "1";

        // Animate it coming up
        setTimeout(() => {
          // Restore transitions before adding class
          this.ufoWrap.style.transition = "";
          this.ufoWrap.classList.add("down");
          this.ufoWrap.style.animationPlayState = "running";

          // Resume normal movement after the down animation completes
          setTimeout(() => {
            this.ufoWrap.style.transition = "none";
            this.ufoWrap.classList.remove("down");
            void this.ufoWrap.offsetWidth;
            this.ufoWrap.style.top = "";
            this.ufoWrap.style.transition = "";
            this.ufoWrap.classList.add("drifting");
            this.ufoRandomMovement();
          }, 3000);
        }, 100);
      }, 500);
    }, 5000 + Math.random() * 5000);
  }

  // Schedule UFO to return after zooming off
  scheduleUfoReturn() {
    // Clear any existing return timeout
    if (this.ufoReturnTimeout) {
      clearTimeout(this.ufoReturnTimeout);
    }

    // Schedule the UFO to return after a random delay (3-8 seconds)
    const returnDelay = 3000 + Math.random() * 5000;

    this.ufoReturnTimeout = setTimeout(() => {
      if (!this.ufoWrap || !this.isPlaying) return;

      // Reset position off-screen on the opposite side from where it left
      const viewportWidth = window.innerWidth;
      const randomHeight = 50 + Math.random() * 150;

      // Determine which side the UFO is currently on
      const isOffRight = this.ufoWrap.style.right === "-110%";

      // Position UFO off-screen on the opposite side
      this.ufoWrap.style.transition = "none";

      if (isOffRight) {
        // If it went off right, bring it back from left
        this.ufoWrap.style.left = "-110%";
        this.ufoWrap.style.right = "auto";
      } else {
        // If it went off left, bring it back from right
        this.ufoWrap.style.right = "-110%";
        this.ufoWrap.style.left = "auto";
      }

      this.ufoWrap.style.top = `${randomHeight}px`;

      // Force reflow
      void this.ufoWrap.offsetWidth;

      // Animate the UFO coming back into view
      this.ufoWrap.style.transition =
        "left 3s ease-in-out, right 3s ease-in-out";

      setTimeout(() => {
        if (!this.ufoWrap || !this.isPlaying) return;

        if (isOffRight) {
          // If it went off right, position it on the left side
          this.ufoWrap.style.left = "100px";
        } else {
          // If it went off left, position it on the right side
          this.ufoWrap.style.right = "100px";
        }
      }, 50);
    }, returnDelay);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  updateSkyColors(phase, currentTime) {
    try {
      // Get the scene container
      const sceneContainer = document.getElementById("scene-container");
      if (!sceneContainer) return;

      // Apply appropriate sky class based on phase
      if (phase === "dawn") {
        // Dawn should transition from dark to light
        const progress = (currentTime - 5) / 2; // 5am-7am
        let dawnColor;

        if (progress < 0.5) {
          // First half: dark blue to purple
          const adjustedProgress = progress * 2; // Scale 0-0.5 to 0-1
          dawnColor = this.interpolateColor(
            "#1a1a2e",
            "#d88ae3",
            adjustedProgress
          );
        } else {
          // Second half: purple to light blue
          const adjustedProgress = (progress - 0.5) * 2; // Scale 0.5-1 to 0-1
          dawnColor = this.interpolateColor(
            "#d88ae3",
            "#87ceeb",
            adjustedProgress
          );
        }

        sceneContainer.style.background = dawnColor;
      } else if (phase === "day") {
        sceneContainer.style.background = "#87ceeb"; // Light blue for day
      } else if (phase === "dusk") {
        // Dusk should transition from light to dark
        const progress = (currentTime - 18) / 2; // 6pm-8pm
        let duskColor;

        if (progress < 0.5) {
          // First half: light blue to purple
          const adjustedProgress = progress * 2; // Scale 0-0.5 to 0-1
          duskColor = this.interpolateColor(
            "#87ceeb",
            "#d88ae3",
            adjustedProgress
          );
        } else {
          // Second half: purple to dark blue
          const adjustedProgress = (progress - 0.5) * 2; // Scale 0.5-1 to 0-1
          duskColor = this.interpolateColor(
            "#d88ae3",
            "#0f0c29",
            adjustedProgress
          );
        }

        sceneContainer.style.background = duskColor;
      } else {
        sceneContainer.style.background = "#0f0c29"; // Dark blue for night
      }
    } catch (error) {
      console.error("Error in updateSkyColors:", error);
      // Fallback to default colors
      if (phase === "dawn") sceneContainer.style.background = "#87ceeb";
      else if (phase === "day") sceneContainer.style.background = "#87ceeb";
      else if (phase === "dusk") sceneContainer.style.background = "#614385";
      else sceneContainer.style.background = "#0f0c29";
    }
  }

  // Airplane
  airplaneMovement() {
    // Set airplane movement
    // Reset airplane position
    if (this.airplane) {
      this.airplane.classList.remove("goLeft", "goRight");
      this.airplane.style.top = `${100 + Math.random() * 300}px`;
    }

    // Randomly choose direction
    if (this.airplane) {
      let spaceTime = Math.random();
      if (spaceTime < 0.2) {
        this.airplane.classList.add("goLeft");
      } else if (spaceTime > -0.2) {
        this.airplane.classList.add("goRight");
      } else {
        this.airplane.classList.remove("goLeft", "goRight");
        this.airplane.classList.add("stopFlying");
      }
    }

    // Schedule the next movement
    setTimeout(() => {
      this.airplaneMovement();
    }, 5000 + Math.random() * 15000);
  }

  // Add a cleanup method to properly dispose of resources
  cleanup() {
    log("Cleaning up CityScene resources");

    try {
      // Cancel any pending animations
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Clear any intervals
      if (this.ufoMovementInterval) {
        clearInterval(this.ufoMovementInterval);
        this.ufoMovementInterval = null;
      }

      // Clear global heartbeat interval
      if (typeof heartbeatInterval !== 'undefined') {
        clearInterval(heartbeatInterval);
      }

      // Remove event listeners
      if (this.eventHandlers.visibilityChange) {
        document.removeEventListener(
          "visibilitychange",
          this.eventHandlers.visibilityChange
        );
      }

      if (this.eventHandlers.playPauseClick && this.playPauseBtn) {
        this.playPauseBtn.removeEventListener(
          "click",
          this.eventHandlers.playPauseClick
        );
      }

      if (this.eventHandlers.resetClick && this.resetBtn) {
        this.resetBtn.removeEventListener(
          "click",
          this.eventHandlers.resetClick
        );
      }

      if (this.eventHandlers.speedChange && this.speedSlider) {
        this.speedSlider.removeEventListener(
          "input",
          this.eventHandlers.speedChange
        );
      }

      if (this.eventHandlers.clockToggle && this.clockToggleBtn) {
        this.clockToggleBtn.removeEventListener(
          "click",
          this.eventHandlers.clockToggle
        );
      }

      if (this.eventHandlers.resize) {
        window.removeEventListener("resize", this.eventHandlers.resize);
      }

      // Reset state
      this.isPlaying = false;
      this.isInitialized = false;
      this.loadingComplete = false;

      // Hide loading overlay if it's visible
      if (this.loadingOverlay) {
        this.loadingOverlay.style.display = "none";
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }

    log("CityScene cleanup complete");
  }
}
