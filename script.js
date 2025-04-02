// Configuration
const CYCLE_DURATION = 120000; // Milliseconds for one 24-hour cycle (2 minutes)
const DEBUG = true; // Enable/disable debug logging

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

// Track active instance
let activeScene = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  log("Document loaded, initializing scene");

  // Ensure any previous instance is cleaned up
  if (activeScene) {
    log("Cleaning up previous scene instance");
    activeScene.cleanup();
    activeScene = null;
  }

  // Create new scene instance
  try {
    activeScene = new CityScene();
    log("Scene initialized successfully");
  } catch (error) {
    console.error("Error initializing scene:", error);
  }
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
    this.options = {
      cycleDuration: 120000, // 2 minutes per day/night cycle
      ...options,
    };

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
    this.nightLayer = null;
    this.dayLayer = null;

    // Initialize the scene
    this.init();
  }

  init() {
    // Get references to DOM elements
    this.loadingOverlay = document.getElementById("loading-overlay");
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = "flex";
    }

    this.loadingText = this.loadingOverlay
      ? this.loadingOverlay.querySelector(".loading-text")
      : null;

    // Get references to DOM elements
    this.sceneContainer = document.getElementById("scene-container");
    this.cityscape = document.getElementById("cityscape");
    this.sky = document.getElementById("sky");
    this.sun = document.getElementById("sun");
    this.moon = document.getElementById("moon");
    this.starContainer = document.getElementById("stars");
    this.cloudContainer = document.getElementById("clouds");
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
    this.initializeSequentially();

    // Start UFO random movement
    this.ufoMovementInterval = setInterval(() => {
      if (this.isPlaying && this.ufo) {
        this.ufoRandomMovement();
      }
    }, 10000); // Change UFO movement every 10 seconds
  }

  initializeSequentially() {
    // Make sure we have all required DOM elements before starting
    this.ensureDomElementsExist();

    // Set initialization complete immediately to prevent getting stuck
    this.isInitialized = true;
    this.loadingComplete = true;
    
    // Make sure we're not in pause mode
    this.isPlaying = true;

    // Start at 5:30am (5.5/24 = 0.23 of the day)
    const startTimeOffset = 0.23 * this.options.cycleDuration;
    this.startTime = Date.now() - startTimeOffset;

    // Hide loading overlay immediately
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add("hidden");
      this.loadingOverlay.style.display = "none";
    }

    // Start the animation
    this.animate();

    // Setup components in the background
    this.setupStars();
    this.setupCelestialBodies();
    this.createBuildings();
    this.createHouses();
    this.setupClouds();
    this.createStreetlamps();
    this.ufoRandomMovement();
    
    // Trigger airplane movement
    this.airplaneMovement();
  }

  handleLoadingError(errorMessage) {
    // Display error in loading text
    if (this.loadingText) {
      this.loadingText.textContent = `${errorMessage}. Retrying...`;
      this.loadingText.style.color = "red";
    }

    // Wait a moment and try to continue loading
    setTimeout(() => {
      // Force initialization to complete even with errors
      this.loadingComplete = true;

      // Start at 5:30am (5.5/24 = 0.23 of the day)
      const startTimeOffset = 0.23 * this.options.cycleDuration;
      this.startTime = Date.now() - startTimeOffset;

      // Hide loading overlay
      if (this.loadingOverlay) {
        this.loadingOverlay.classList.add("hidden");
        setTimeout(() => {
          this.loadingOverlay.style.display = "none";
        }, 500);
      }

      // Make sure we're not in pause mode
      this.isPlaying = true;

      // Try to start animation anyway
      this.animate();

      // Trigger initial UFO movement
      this.ufoRandomMovement();
    }, 2000);
  }

  ensureDomElementsExist() {
    // Make sure all required DOM elements exist
    this.sceneContainer = document.getElementById("scene-container");
    this.cityscape = document.getElementById("cityscape");
    this.sky = document.getElementById("sky");
    this.sun = document.getElementById("sun");
    this.moon = document.getElementById("moon");
    this.starContainer = document.getElementById("stars");
    this.cloudContainer = document.getElementById("clouds");

    // Check if any essential elements are missing
    if (!this.sceneContainer || !this.sky || !this.cityscape) {
      console.error("Essential DOM elements missing");
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

    // No need to force visibility anymore - updateCelestialBodies will show/hide based on time

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
    // Clear existing buildings
    const existingBuildings = this.cityscape.querySelectorAll(".building");
    existingBuildings.forEach((building) => building.remove());

    const buildingCount = Math.floor(Math.random() * 10) + 8; // 10-18 buildings
    const containerWidth = window.innerWidth;
    const minSpacing = 100; // Minimum space between buildings

    // Create array of x positions
    const positions = [];
    for (let i = 0; i < buildingCount; i++) {
      let x;
      do {
        x = Math.random() * (containerWidth - 150); // 150px is max building width
      } while (positions.some((pos) => Math.abs(pos - x) < minSpacing));
      positions.push(x);
    }

    positions.forEach((x, i) => {
      const building = document.createElement("div");
      building.className = "building";

      // Random height between 100 and 500 pixels
      const height = Math.random() * 400 + 100;
      building.style.height = `${height}px`;

      // Random width between 100 and 150 pixels
      const width = Math.random() * 50 + 100;
      building.style.width = `${width}px`;

      // Position building
      building.style.left = `${x}px`;

      // Random z-index between 1 and 10 (buildings always behind houses)
      building.style.zIndex = Math.floor(Math.random() * 10) + 1;

      // Create window container for flex layout
      const windowContainer = document.createElement("div");
      windowContainer.className = "window-container";
      building.appendChild(windowContainer);

      // Calculate number of floors and windows based on building dimensions
      const buildingPadding = 15;
      const windowHeight = 35;
      const windowWidth = 25;
      const windowGap = 6;

      // Calculate available space for windows
      const availableHeight = height - buildingPadding * 2;
      const availableWidth = width - buildingPadding * 2;

      // Calculate number of floors and windows that will fit
      const floorHeight = windowHeight + windowGap;
      const floors = Math.floor(availableHeight / floorHeight);
      const windowsPerFloor = Math.floor(
        (availableWidth + windowGap) / (windowWidth + windowGap)
      );

      // Create floors and windows
      for (let floor = 0; floor < floors; floor++) {
        const floorDiv = document.createElement("div");
        floorDiv.className = "floor";

        for (let w = 0; w < windowsPerFloor; w++) {
          const window = document.createElement("div");
          window.className = "window";

          // Assign a random transition class to each window
          const transitionClass = `window-transition-${
            Math.floor(Math.random() * 6) + 1
          }`;
          window.classList.add(transitionClass);

          // Windows start unlit - our updateWindowLights method will handle lighting
          floorDiv.appendChild(window);
        }

        windowContainer.appendChild(floorDiv);
      }

      this.cityscape.appendChild(building);
    });
  }

  createHouses() {
    // Clear existing houses
    const existingHouses = this.cityscape.querySelectorAll(".house");
    existingHouses.forEach((house) => house.remove());

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
    for (let i = 0; i < houseCount; i++) {
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
      // Windows start unlit - our updateWindowLights method will handle lighting
      house.appendChild(leftWindow);

      const rightWindow = document.createElement("div");
      rightWindow.className = "house-window-right";
      // Windows start unlit - our updateWindowLights method will handle lighting
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
    }
  }

  setupCelestialBodies() {
    log("Setting up celestial bodies");

    // Check if elements exist
    if (!this.sun) {
      this.sun = document.getElementById("sun");
      if (!this.sun) {
        log("ERROR: Sun element not found");
        return;
      }
    }

    if (!this.moon) {
      this.moon = document.getElementById("moon");
      if (!this.moon) {
        log("ERROR: Moon element not found");
        return;
      }
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
    }

    log("Celestial bodies setup complete");
  }

  setupStars() {
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

    // Create random stars
    const starCount = Math.floor(Math.random() * 50) + 100; // 100-150 stars
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className =
        "star " + ["small", "medium", "large"][Math.floor(Math.random() * 3)];
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 70 + "%"; // Keep stars in upper 70% of sky
      star.style.animationDelay = Math.random() * 2 + "s";
      this.starContainer.appendChild(star);
    }

    // Initially hide stars
    this.starContainer.style.opacity = "0";
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
        dawn: document.querySelector('.sky-layer.dawn'),
        day: document.querySelector('.sky-layer.day'),
        dusk: document.querySelector('.sky-layer.dusk'),
        night: document.querySelector('.sky-layer.night')
      };

      // Reset all layers to hidden first
      Object.values(skyLayers).forEach(layer => {
        if (layer) {
          layer.classList.add('hidden');
          layer.style.opacity = 0;
        }
      });

      // Update sky colors based on time of day
      if (currentTime >= 5 && currentTime < 7) {
        // Dawn: 5am-7am
        currentPhase = "dawn";
        if (skyLayers.dawn) {
          skyLayers.dawn.classList.remove('hidden');
          skyLayers.dawn.style.opacity = 1;
          
          // Gradually show day behind dawn as we approach 7am
          const progress = (currentTime - 5) / 2; // 0 to 1 over 2 hours
          if (skyLayers.day) {
            skyLayers.day.classList.remove('hidden');
            skyLayers.day.style.opacity = progress;
          }
        }
      } else if (currentTime >= 7 && currentTime < 18) {
        // Day: 7am-6pm
        currentPhase = "day";
        if (skyLayers.day) {
          skyLayers.day.classList.remove('hidden');
          skyLayers.day.style.opacity = 1;
        }
      } else if (currentTime >= 18 && currentTime < 20) {
        // Dusk: 6pm-8pm
        currentPhase = "dusk";
        if (skyLayers.dusk) {
          skyLayers.dusk.classList.remove('hidden');
          skyLayers.dusk.style.opacity = 1;
          
          // Gradually show night behind dusk as we approach 8pm
          const progress = (currentTime - 18) / 2; // 0 to 1 over 2 hours
          if (skyLayers.night) {
            skyLayers.night.classList.remove('hidden');
            skyLayers.night.style.opacity = progress;
          }
        }
      } else {
        // Night: 8pm-5am
        currentPhase = "night";
        if (skyLayers.night) {
          skyLayers.night.classList.remove('hidden');
          skyLayers.night.style.opacity = 1;
        }
      }

      // Update lamp lights based on time of day
      if (this.lampLights && this.lampLights.length > 0) {
        this.lampLights.forEach((light) => {
          // Keep streetlamps on at night, dusk, and until 8am
          if (
            currentPhase === "night" ||
            currentPhase === "dusk" ||
            (currentPhase === "dawn" && currentTime < 8)
          ) {
            light.classList.add("night");
            light.classList.remove("day");
          } else {
            light.classList.add("day");
            light.classList.remove("night");
          }
        });
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

      // Get all windows
      const buildingWindows = document.querySelectorAll(".building .window");
      const houseWindows = document.querySelectorAll(".house .window");

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

      // Calculate how many windows should be lit
      const totalBuildingWindows = buildingWindows.length;
      const targetLitCount = Math.floor(totalBuildingWindows * litPercentage);

      // Count currently lit windows
      const currentlyLitWindows = document.querySelectorAll(
        ".building .window.lit"
      ).length;

      // If we need to turn on more windows
      if (currentlyLitWindows < targetLitCount) {
        // Get all unlit windows
        const unlitWindows = Array.from(buildingWindows).filter(
          (w) => !w.classList.contains("lit")
        );

        // Shuffle array to randomize which windows get turned on
        this.shuffleArray(unlitWindows);

        // Turn on enough windows to reach target
        const windowsToLight = unlitWindows.slice(
          0,
          targetLitCount - currentlyLitWindows
        );
        windowsToLight.forEach((window) => {
          window.classList.add("lit");
        });
      }
      // If we need to turn off windows
      else if (currentlyLitWindows > targetLitCount) {
        // Get all lit windows
        const litWindows = Array.from(buildingWindows).filter((w) =>
          w.classList.contains("lit")
        );

        // Shuffle array to randomize which windows get turned off
        this.shuffleArray(litWindows);

        // Turn off enough windows to reach target
        const windowsToTurnOff = litWindows.slice(
          0,
          currentlyLitWindows - targetLitCount
        );
        windowsToTurnOff.forEach((window) => {
          window.classList.remove("lit");
        });
      }

      // Handle house windows separately - simpler logic
      houseWindows.forEach((window) => {
        // Houses have lights on during evening and night (5pm-11pm)
        const shouldBeLit = hours >= 17 && hours < 23;

        if (shouldBeLit && !window.classList.contains("lit")) {
          window.classList.add("lit");
        } else if (!shouldBeLit && window.classList.contains("lit")) {
          window.classList.remove("lit");
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
    // Where (h,k) is the vertex of the parabola

    // We want the vertex to be at the center of the screen horizontally (h = viewportWidth/2)
    // and at y=10px vertically (k = 10)
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

    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Pause all celestial animations
    this.sun.style.animationPlayState = "paused";
    this.moon.style.animationPlayState = "paused";

    // Pause UFO animation if present
    if (this.ufo) {
      this.ufo.style.animationPlayState = "paused";
    }

    // Pause cloud animations
    if (this.clouds && this.clouds.length) {
      this.clouds.forEach((cloud) => {
        if (cloud) {
          cloud.style.transition = "none";
          // Get current left position
          const computedStyle = window.getComputedStyle(cloud);
          cloud.style.left = computedStyle.left;
        }
      });
    }

    // Store the exact moment we paused
    this.pausedAt = Date.now();
  }

  startAnimation() {
    log(`startAnimation called, isPlaying: ${this.isPlaying}`);

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
    } catch (error) {
      // Catch any errors to prevent page crashes
      console.error("Error in animation loop:", error);
    }

    // Request next frame - do this outside try/catch to ensure animation continues
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Set a flag to indicate animation is running
    this.animationRunning = true;
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

    // Resume celestial animations
    this.sun.style.animationPlayState = "running";
    this.moon.style.animationPlayState = "running";

    // Resume UFO animation
    if (this.ufo) {
      this.ufo.style.animationPlayState = "running";
      this.ufo.style.animationDelay = "0s"; // Reset animation delay to ensure it resumes properly
    }

    this.ufoRandomMovement();

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

  pauseAnimation() {
    if (!this.isPlaying) {
      return;
    }

    // Set isPlaying to false BEFORE cancelling animation frame to prevent race conditions
    this.isPlaying = false;

    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Pause all celestial animations
    this.sun.style.animationPlayState = "paused";
    this.moon.style.animationPlayState = "paused";

    // Pause UFO animation if present
    if (this.ufo) {
      this.ufo.style.animationPlayState = "paused";
    }

    // Pause cloud animations
    if (this.clouds && this.clouds.length) {
      this.clouds.forEach((cloud) => {
        if (cloud) {
          cloud.style.transition = "none";
          // Get current left position
          const computedStyle = window.getComputedStyle(cloud);
          cloud.style.left = computedStyle.left;
        }
      });
    }

    // Store the exact moment we paused
    this.pausedAt = Date.now();
  }

  // Airplane
  airplaneMovement() {
    // Set airplane movement
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
  }
  // UFO movement
  ufoRandomMovement() {
    // Set ufo random movement
    if (this.ufo) {
      // First, remove all previous animation classes
      this.ufo.classList.remove(
        "up",
        "down",
        "zoomOffRight",
        "zoomOffLeft",
        "fadeIn"
      );

      // Generate a random value between 0 and 1
      const randomValue = Math.random();

      // Reset any inline styles that might interfere
      this.ufo.style.right = "";

      // stop ufo movement is it is above the screen vh0
      if (this.ufo.getBoundingClientRect().top < 5) {
        // Pause the animation
        this.ufo.style.animationPlayState = "paused";

        // Reset position after a random delay (5-10 seconds)
        window.setTimeout(() => {
          // Move the UFO back into view
          this.ufo.classList.remove("up");
          this.ufo.classList.add("down");

          // Resume animation after position is reset
          this.ufo.style.animationPlayState = "running";
        }, 5000 + Math.random() * 5000);

        // Exit the function to prevent other movement changes
        return;
      }

      if (randomValue < 0.4) {
        // 40% chance to move up
        this.ufo.style.animationDirection = "normal";
        this.ufo.classList.add("up");
        console.log("UFO moving up");
      } else if (randomValue < 0.8) {
        // 40% chance to move down
        this.ufo.style.animationDirection = "reverse";
        this.ufo.classList.add("down");
        console.log("UFO moving down");
      } else if (randomValue < 0.9) {
        // 10% chance to zoom off right
        this.ufo.classList.add("zoomOffRight");
        console.log("UFO zooming right");

        // Reset position after animation
        setTimeout(() => {
          if (this.ufo) {
            this.ufo.classList.remove("zoomOffRight");
            this.ufo.classList.add("fadeIn");
            setTimeout(() => {
              if (this.ufo) {
                this.ufo.classList.remove("fadeIn");
              }
            }, 1000);
          }
        }, 3000);
      } else {
        // 10% chance to zoom off left
        this.ufo.classList.add("zoomOffLeft");
        console.log("UFO zooming left");

        // Reset position after animation
        setTimeout(() => {
          if (this.ufo) {
            this.ufo.classList.remove("zoomOffLeft");
            this.ufo.classList.add("fadeIn");
            setTimeout(() => {
              if (this.ufo) {
                this.ufo.classList.remove("fadeIn");
              }
            }, 1000);
          }
        }, 3000);
      }
    }
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
          dawnColor = this.interpolateColor("#1a1a2e", "#d88ae3", adjustedProgress);
        } else {
          // Second half: purple to light blue
          const adjustedProgress = (progress - 0.5) * 2; // Scale 0.5-1 to 0-1
          dawnColor = this.interpolateColor("#d88ae3", "#87ceeb", adjustedProgress);
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
          duskColor = this.interpolateColor("#87ceeb", "#d88ae3", adjustedProgress);
        } else {
          // Second half: purple to dark blue
          const adjustedProgress = (progress - 0.5) * 2; // Scale 0.5-1 to 0-1
          duskColor = this.interpolateColor("#d88ae3", "#0f0c29", adjustedProgress);
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
}
