// Configuration
const CYCLE_DURATION = 120000; // Milliseconds for one 24-hour cycle (2 minutes)
const DEBUG = false; // Enable/disable debug logging

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
  initScene();
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
    // Set default options
    this.options = {
      debug: false,
      cycleDuration: 120000, // 2 minutes for a full day cycle
      cloudCount: 5,
      starCount: 100,
      ...options,
    };

    // Initialize state
    this.isPlaying = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedAt = null;
    this.lastPhase = null;
    this.clouds = [];
    this.animationFrameId = null;
    this.isClockVisible = true;
    this.isInitialized = false;
    this.loadingComplete = false;

    // Store references to event handlers for proper cleanup
    this.eventHandlers = {
      visibilityChange: null,
      playPauseClick: null,
      resetClick: null,
      speedChange: null,
      clockToggle: null,
      resize: null
    };

    // Initialize the scene
    this.init();
  }

  init() {
    // Show loading spinner
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Get references to DOM elements
    this.sceneContainer = document.getElementById("scene-container");
    this.cityscape = document.getElementById("cityscape");
    this.sky = document.getElementById("sky");
    this.sun = document.getElementById("sun");
    this.moon = document.getElementById("moon");
    this.starContainer = document.getElementById("stars");
    this.cloudContainer = document.getElementById("clouds");
    
    // Clock elements
    this.clockDisplay = document.getElementById("clock");
    this.digitalClock = document.getElementById("digital-clock");
    this.hourHand = document.querySelector(".hour-hand");
    this.minuteHand = document.querySelector(".minute-hand");
    
    // Controls
    this.clockToggleBtn = document.getElementById("toggle-clock");
    this.playPauseBtn = document.getElementById("play-pause");
    this.resetBtn = document.getElementById("reset");
    this.speedSlider = document.getElementById("speed-slider");

    // Setup the scene elements
    this.setupStars();
    this.setupCelestialBodies();
    this.createBuildings();
    this.createHouses();
    this.setupClouds();
    this.createStreetlamps();
    this.setupEventListeners();

    // Set initial state
    this.isInitialized = true;
    
    // Hide loading spinner and start the animation at 5:30am (0.23 of the day)
    setTimeout(() => {
      this.loadingComplete = true;
      
      // Start at 5:30am (5.5/24 = 0.23 of the day)
      const startTimeOffset = 0.23 * this.options.cycleDuration;
      this.startTime = Date.now() - startTimeOffset;
      
      // Hide loading overlay
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
      }
      
      // Start animation
      this.play();
      
      // Initial update to set correct state
      const timeOfDay = (startTimeOffset % this.options.cycleDuration) / this.options.cycleDuration;
      this.updatePhases(timeOfDay);
      this.updateCelestialBodies(timeOfDay);
      this.updateClock(timeOfDay);
    }, 1500); // Show loading for at least 1.5 seconds
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
    document.addEventListener("visibilitychange", this.eventHandlers.visibilityChange);

    // Play/Pause button handler
    if (this.playPauseBtn) {
      this.eventHandlers.playPauseClick = () => {
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      };
      this.playPauseBtn.addEventListener("click", this.eventHandlers.playPauseClick);
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
      this.eventHandlers.speedChange = (e) => {
        // Get current progress through the day
        const now = Date.now();
        const elapsed = now - this.startTime;
        const currentProgress =
          (elapsed % this.options.cycleDuration) / this.options.cycleDuration;

        // Update cycle duration based on slider value
        const newDuration = parseFloat(e.target.value);
        this.options.cycleDuration = newDuration;
        
        // Adjust start time to maintain current time of day
        this.startTime = now - currentProgress * this.options.cycleDuration;
        
        // Force update of celestial bodies to match new speed
        const timeOfDay = currentProgress;
        this.updateCelestialBodies(timeOfDay);
      };
      this.speedSlider.addEventListener("input", this.eventHandlers.speedChange);
    }

    // Clock toggle handler
    if (this.clockToggleBtn) {
      this.eventHandlers.clockToggle = () => {
        if (this.clockDisplay) {
          this.isClockVisible = !this.isClockVisible;
          this.clockDisplay.style.display = this.isClockVisible ? "block" : "none";
          this.clockToggleBtn.textContent = this.isClockVisible ? "Hide Clock" : "Show Clock";
        }
      };
      this.clockToggleBtn.addEventListener("click", this.eventHandlers.clockToggle);
    }

    // Window resize handler
    this.eventHandlers.resize = () => {
      // Force update of celestial bodies on resize to maintain correct positions
      if (this.startTime) {
        const now = Date.now();
        const elapsed = now - this.startTime;
        const timeOfDay = (elapsed % this.options.cycleDuration) / this.options.cycleDuration;
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
          if (Math.random() < 0.3) {
            window.classList.add("lit");
          }
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

      // Add windows with random lighting
      const leftWindow = document.createElement("div");
      leftWindow.className = "house-window-left";
      if (Math.random() < 0.3) {
        leftWindow.classList.add("lit");
      }
      house.appendChild(leftWindow);

      const rightWindow = document.createElement("div");
      rightWindow.className = "house-window-right";
      if (Math.random() < 0.3) {
        rightWindow.classList.add("lit");
      }
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
      log("ERROR: Sun element not found, creating it");
      this.sun = document.createElement("div");
      this.sun.id = "sun";
      document.getElementById("scene-container").appendChild(this.sun);
    }

    if (!this.moon) {
      log("ERROR: Moon element not found, creating it");
      this.moon = document.createElement("div");
      this.moon.id = "moon";
      document.getElementById("scene-container").appendChild(this.moon);
    }

    // Ensure they have proper styling
    this.sun.className = "sun";
    this.moon.className = "moon";

    // Add moon craters if they don't exist
    if (this.moon.querySelectorAll('.moon-crater').length === 0) {
      for (let i = 0; i < 4; i++) {
        const crater = document.createElement('div');
        crater.className = 'moon-crater';
        this.moon.appendChild(crater);
      }
    }

    log("Celestial bodies setup complete");
  }

  setupStars() {
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
    // Ensure celestial bodies exist
    if (!this.sun || !this.moon) {
      log(
        "ERROR: Celestial bodies missing in updateCelestialBodies, recreating"
      );
      this.setupCelestialBodies();
      return;
    }

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
      if (!this.sun.classList.contains('visible')) {
        this.sun.style.opacity = "1";
        this.sun.classList.add('visible');
      }
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate x position - linear from left to right
      // Start at -500px, end at viewportWidth + 500px
      const totalWidth = viewportWidth + 1000; // Add 500px on each side
      const xPos = -500 + (totalWidth * sunProgress);
      
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
      this.sun.classList.remove('visible');
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
      if (!this.moon.classList.contains('visible')) {
        this.moon.style.opacity = "1";
        this.moon.classList.add('visible');
      }
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate x position - linear from left to right
      // Start at -500px, end at viewportWidth + 500px
      const totalWidth = viewportWidth + 1000; // Add 500px on each side
      const xPos = -500 + (totalWidth * moonProgress);
      
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
      this.moon.classList.remove('visible');
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
    const currentTime = timeOfDay * 24;
    let currentPhase;

    // Determine current phase based on new timing requirements
    if (currentTime >= 18 && currentTime < 19) {
      currentPhase = "dusk";
    } else if (currentTime >= 19 || currentTime < 5) {
      currentPhase = "night";
    } else if (currentTime >= 5 && currentTime < 7) {
      currentPhase = "dawn";
    } else if (currentTime >= 7 && currentTime < 18) {
      currentPhase = "day";
    }

    // Only update DOM if phase changed
    if (this.lastPhase !== currentPhase) {
      const allLayers = document.querySelectorAll(".sky-layer");
      if (allLayers.length > 0) {
        // First, mark the new phase layer for display
        allLayers.forEach((layer) => {
          if (layer.classList.contains(currentPhase)) {
            layer.classList.remove("hidden");
            // Set opacity to 0 initially for smooth fade-in
            layer.style.opacity = "0";

            // Force reflow to ensure transition works
            void layer.offsetWidth;

            // Fade in the new layer
            setTimeout(() => {
              layer.style.opacity = "1";
            }, 10);
          }
        });

        // Handle previous phase layer - keep visible but fade out
        if (this.lastPhase) {
          const oldLayers = document.querySelectorAll(
            `.sky-layer.${this.lastPhase}`
          );
          oldLayers.forEach((layer) => {
            // Start fade out
            layer.style.opacity = "0";

            // Set a timer to hide it completely after fade
            setTimeout(() => {
              if (layer && layer.style && layer.style.opacity === "0") {
                layer.classList.add("hidden");
              }
            }, 10000); // 10 seconds matching CSS transition time
          });
        }

        this.lastPhase = currentPhase;
      }

      // Update scene container class
      if (this.sceneContainer) {
        if (currentPhase === "night" || currentPhase === "dusk") {
          this.sceneContainer.classList.add("scene-night");
          this.sceneContainer.classList.remove("scene-day");
        } else {
          this.sceneContainer.classList.add("scene-day");
          this.sceneContainer.classList.remove("scene-night");
        }
      }
    }

    // Handle specific transition cases - with safety checks

    // Smooth transitions for dusk (6pm-8pm)
    if (currentPhase === "dusk") {
      const nightLayer = document.querySelector(".sky-layer.night");
      if (nightLayer) {
        // Dusk is from 18-20, map to 0-1 for opacity
        const duskProgress = Math.max(0, Math.min(1, (currentTime - 18) / 2));
        nightLayer.classList.remove("hidden");
        nightLayer.style.opacity = duskProgress.toFixed(2);
      }
    }

    // Smooth transitions for dawn (5am-7am)
    if (currentPhase === "dawn") {
      const dayLayer = document.querySelector(".sky-layer.day");
      if (dayLayer) {
        // Dawn is from 5-7, map to 0-1 for day layer opacity
        const dawnProgress = Math.max(0, Math.min(1, (currentTime - 5) / 2));
        dayLayer.classList.remove("hidden");
        dayLayer.style.opacity = dawnProgress.toFixed(2);
      }

      // Fade out night layer during dawn
      const nightLayer = document.querySelector(".sky-layer.night");
      if (nightLayer) {
        const nightFade = Math.max(0, Math.min(1, 1 - (currentTime - 5) / 2));
        nightLayer.classList.remove("hidden");
        nightLayer.style.opacity = nightFade.toFixed(2);
      }
    }

    // Handle lamp light transitions
    const lampLights = document.querySelectorAll(".lamp-light");
    if (lampLights.length > 0) {
      lampLights.forEach((light) => {
        // Keep streetlamps on at night, dusk, and until 8am
        if (currentPhase === "night" || currentPhase === "dusk" || 
            (currentPhase === "dawn" && currentTime < 8)) {
          light.classList.add("night");
          light.classList.remove("day");
        } else {
          light.classList.add("day");
          light.classList.remove("night");
        }
      });
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
    if (this.digitalClock) {
      this.digitalClock.textContent = `${hours12}:${String(minutes).padStart(
        2,
        "0"
      )} ${ampm}`;
    }

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
    const a = maxDistance > 0 ? (viewportHeight - k) / (maxDistance * maxDistance) : 0.001;
    
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
    if (this.isPaused) {
      // Resume from paused state
      const pauseDuration = Date.now() - this.pausedAt;
      this.startTime += pauseDuration;
      this.isPaused = false;
    }
    
    this.isPlaying = true;
    
    // Update button text
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = "Pause";
    }
    
    // Start animation loop
    this.animate();
  }

  pause() {
    this.isPlaying = false;
    this.isPaused = true;
    this.pausedAt = Date.now();
    
    // Update button text
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = "Play";
    }
    
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
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
    if (this.sun) this.sun.style.display = "block";
    if (this.moon) this.moon.style.display = "block";

    // Apply immediate updates
    this.updatePhases(timeOfDay);
    this.updateCelestialBodies(timeOfDay);
    this.updateClock(timeOfDay);
    this.updateClouds();

    // Start animation loop
    log("Starting animation loop");
    this.animate();
  }

  animate() {
    // Don't continue if animation is paused
    if (!this.isPlaying) {
      return;
    }

    // Calculate current time of day (0-1 representing midnight to midnight)
    const now = Date.now();
    const elapsed = now - this.startTime;
    const timeOfDay = (elapsed % this.options.cycleDuration) / this.options.cycleDuration;

    // Update scene elements based on time of day
    this.updatePhases(timeOfDay);
    this.updateCelestialBodies(timeOfDay);
    this.updateClock(timeOfDay);
    this.updateClouds();

    // Debug tracking
    if (DEBUG) {
      const millisecondTracking = document.getElementById(
        "millisecond-tracking"
      );
      if (millisecondTracking) {
        millisecondTracking.textContent = `Elapsed: ${elapsed.toFixed(
          0
        )}ms | Cycle: ${this.options.cycleDuration}ms | Progress: ${(
          timeOfDay * 100
        ).toFixed(1)}%`;
      }
    }

    // Cancel any existing animation frame before requesting a new one
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  cleanup() {
    log("Cleaning up CityScene");
    
    // Stop animation
    this.isPlaying = false;
    
    // Cancel any pending animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove all event listeners
    if (this.eventHandlers.visibilityChange) {
      document.removeEventListener("visibilitychange", this.eventHandlers.visibilityChange);
    }
    
    if (this.playPauseBtn && this.eventHandlers.playPauseClick) {
      this.playPauseBtn.removeEventListener("click", this.eventHandlers.playPauseClick);
    }
    
    if (this.resetBtn && this.eventHandlers.resetClick) {
      this.resetBtn.removeEventListener("click", this.eventHandlers.resetClick);
    }
    
    if (this.speedSlider && this.eventHandlers.speedChange) {
      this.speedSlider.removeEventListener("input", this.eventHandlers.speedChange);
    }
    
    if (this.clockToggleBtn && this.eventHandlers.clockToggle) {
      this.clockToggleBtn.removeEventListener("click", this.eventHandlers.clockToggle);
    }
    
    if (this.eventHandlers.resize) {
      window.removeEventListener("resize", this.eventHandlers.resize);
    }
    
    // Clear event handler references
    this.eventHandlers = {
      visibilityChange: null,
      playPauseClick: null,
      resetClick: null,
      speedChange: null,
      clockToggle: null,
      resize: null
    };
    
    // Remove all clouds
    if (this.cloudContainer) {
      while (this.cloudContainer.firstChild) {
        this.cloudContainer.removeChild(this.cloudContainer.firstChild);
      }
    }
    this.clouds = [];
    
    // Reset state
    this.isInitialized = false;
    this.loadingComplete = false;
    this.startTime = null;
    this.pausedAt = null;
    this.lastPhase = null;
    
    log("CityScene cleanup complete");
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
    if (this.sun) {
      // Pause sun animation
      this.sun.style.animationPlayState = "paused";
    }

    if (this.moon) {
      // Pause moon animation
      this.moon.style.animationPlayState = "paused";
    }

    // Pause UFO animation if present
    const ufo = document.querySelector(".ufo");
    if (ufo) {
      ufo.style.animationPlayState = "paused";
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

  resumeAnimation() {
    if (this.isPlaying) {
      return;
    }

    // Resume celestial animations
    if (this.sun) {
      // Resume sun animation
      this.sun.style.animationPlayState = "running";
    }

    if (this.moon) {
      // Resume moon animation
      this.moon.style.animationPlayState = "running";
    }

    // Resume UFO animation
    const ufo = document.querySelector(".ufo");
    if (ufo) {
      ufo.style.animationPlayState = "running";
    }

    // Resume cloud animations
    if (this.clouds && this.clouds.length) {
      this.clouds.forEach((cloud) => {
        if (cloud) {
          cloud.style.transition = "";
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
}
