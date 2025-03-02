// Configuration
const CYCLE_DURATION = 40000; // Milliseconds for one 24-hour cycle (40 seconds)
const DEBUG = true; // Enable/disable debug logging

// Helper for debug logging
function log(message) {
    if (DEBUG) {
        console.log(`[CityLights] ${message}`);
    }
}

// Track active instance
let activeScene = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    log('Document loaded, initializing scene');
    initScene();
});

// Core initialization function
function initScene() {
    log('Initializing new scene');
    
    // Clean up any existing scene
    if (activeScene) {
        log('Cleaning up existing scene');
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
        log('Scene initialized successfully');
    } catch (e) {
        log(`Error creating scene: ${e.message}`);
        console.error(e);
    }
}

class CityScene {
    constructor() {
        log('CityScene constructor started');
        
        // Basic initialization
        this.cycleDuration = CYCLE_DURATION;
        this.isPlaying = true; // Start in playing state
        this.startTime = Date.now();
        this.isDark = false;
        this.clouds = [];
        this.minClouds = 3;
        this.maxClouds = 6;
        this.lastPhase = null;
        this.animationFrameId = null;
        this.pausedAt = null;
        
        // Initialize scene
        log('Initializing scene elements');
        this.initializeElements();
        this.setupEventListeners();
        this.setupScene();
        this.setupCelestialBodies();
        this.setupStars();
        this.setupClouds();
        
        // Start animation with forced reset to beginning of cycle
        log('Starting animation');
        this.resetAnimation();
        log('CityScene constructor completed');
    }

    // New method to reset animation to beginning of cycle
    resetAnimation() {
        log('Resetting animation to beginning of cycle');
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
        log('Setting up event listeners');
        
        // Page visibility change handler
        document.addEventListener('visibilitychange', () => {
            log(`Visibility changed: ${document.hidden ? 'hidden' : 'visible'}`);
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });

        // Setup play/pause button
        const playPauseButton = document.getElementById('playPause');
        if (playPauseButton) {
            log('Adding play/pause button event listener');
            
            // Set initial button state based on isPlaying value
            playPauseButton.textContent = this.isPlaying ? 'Pause' : 'Play';
            log(`Set initial play/pause button state: ${this.isPlaying ? 'Pause' : 'Play'}`);
            
            playPauseButton.addEventListener('click', () => {
                log('Play/pause button clicked');
                if (this.isPlaying) {
                    log('Animation is playing, pausing');
                    this.pauseAnimation();
                    playPauseButton.textContent = 'Play';
                } else {
                    log('Animation is paused, resuming');
                    this.resumeAnimation();
                    playPauseButton.textContent = 'Pause';
                }
            });
        } else {
            log('WARNING: Play/pause button not found in DOM');
        }

        // Setup clock toggle
        const toggleButton = document.getElementById('toggleClock');
        const digitalClock = document.getElementById('digital-clock');
        const analogClock = document.getElementById('analog-clock');
        
        if (toggleButton && digitalClock && analogClock) {
            let isAnalog = false;
            
            toggleButton.addEventListener('click', () => {
                isAnalog = !isAnalog;
                
                if (isAnalog) {
                    digitalClock.classList.remove('active');
                    analogClock.classList.add('active');
                    toggleButton.classList.add('active');
                } else {
                    digitalClock.classList.add('active');
                    analogClock.classList.remove('active');
                    toggleButton.classList.remove('active');
                }
            });
            
            // Set initial state
            digitalClock.classList.add('active');
            analogClock.classList.remove('active');
            toggleButton.classList.remove('active');
        }

        // Setup speed control if it exists
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const now = Date.now();
                const elapsed = now - this.startTime;
                const currentProgress = (elapsed % this.cycleDuration) / this.cycleDuration;
                
                const newDuration = parseFloat(e.target.value);
                this.cycleDuration = newDuration;
                this.startTime = now - (currentProgress * this.cycleDuration);
                
                const speedDisplay = document.getElementById('speedDisplay');
                if (speedDisplay) {
                    const minutes = Math.floor(newDuration / 60000);
                    const seconds = Math.floor((newDuration % 60000) / 1000);
                    speedDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            });
        }
    }

    initializeElements() {
        log('Initializing element references');
        
        // Scene container
        this.sceneContainer = document.getElementById('scene-container');
        
        // Store viewport dimensions for calculations
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        
        // Scene-specific elements
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');
        this.starContainer = document.getElementById('stars');
        this.clouds = [];
        this.cloudContainer = document.getElementById('clouds');
        
        // Clock elements
        this.digitalClock = document.getElementById('digital-clock');
        this.analogClock = document.getElementById('analog-clock');
        
        // Initialize hour and minute hand references
        if (this.analogClock) {
            this.hourHand = this.analogClock.querySelector('.hour-hand');
            this.minuteHand = this.analogClock.querySelector('.minute-hand');
            
            if (!this.hourHand || !this.minuteHand) {
                log('ERROR: Hour or minute hand not found in analog clock');
            } else {
                log('Analog clock hands initialized successfully');
            }
        }
        
        log('Element initialization complete');
    }

    setupScene() {
        // Create cityscape container if it doesn't exist
        if (!this.cityscape) {
            this.cityscape = document.createElement('div');
            this.cityscape.id = 'cityscape';
            document.getElementById('scene-container').appendChild(this.cityscape);
        }
        
        this.createBuildings();
        this.createHouses();
        this.createStreetlamps();
    }

    createBuildings() {
        // Clear existing buildings
        const existingBuildings = this.cityscape.querySelectorAll('.building');
        existingBuildings.forEach(building => building.remove());

        const buildingCount = Math.floor(Math.random() * 10) + 8; // 10-18 buildings
        const containerWidth = window.innerWidth;
        const minSpacing = 100; // Minimum space between buildings
        
        // Create array of x positions
        const positions = [];
        for (let i = 0; i < buildingCount; i++) {
            let x;
            do {
                x = Math.random() * (containerWidth - 150); // 150px is max building width
            } while (positions.some(pos => Math.abs(pos - x) < minSpacing));
            positions.push(x);
        }
        
        positions.forEach((x, i) => {
            const building = document.createElement('div');
            building.className = 'building';
            
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
            const windowContainer = document.createElement('div');
            windowContainer.className = 'window-container';
            building.appendChild(windowContainer);
            
            // Calculate number of floors and windows based on building dimensions
            const buildingPadding = 15;
            const windowHeight = 35;
            const windowWidth = 25;
            const windowGap = 6;
            
            // Calculate available space for windows
            const availableHeight = height - (buildingPadding * 2);
            const availableWidth = width - (buildingPadding * 2);
            
            // Calculate number of floors and windows that will fit
            const floorHeight = windowHeight + windowGap;
            const floors = Math.floor(availableHeight / floorHeight);
            const windowsPerFloor = Math.floor((availableWidth + windowGap) / (windowWidth + windowGap));
            
            // Create floors and windows
            for (let floor = 0; floor < floors; floor++) {
                const floorDiv = document.createElement('div');
                floorDiv.className = 'floor';
                
                for (let w = 0; w < windowsPerFloor; w++) {
                    const window = document.createElement('div');
                    window.className = 'window';
                    if (Math.random() < 0.3) {
                        window.classList.add('lit');
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
        const existingHouses = this.cityscape.querySelectorAll('.house');
        existingHouses.forEach(house => house.remove());

        const houseColors = ['#FFB6C1', '#FFEB3B', '#64B5F6', '#FA8072', '#FFA726', '#81C784', '#BA68C8'];
        const roofColors = ['#212121', '#795548', '#BDBDBD', '#2E7D32', '#C62828', '#4527A0', '#1565C0'];
        const doorColors = ['#D32F2F', '#FBC02D', '#6A1B9A', '#1565C0', '#4E342E'];

        const houseCount = Math.floor(Math.random() * 6) + 6; // 6-11 houses
        const containerWidth = window.innerWidth;
        const minSpacing = 130; // Minimum space between houses
        
        // Create array of x positions
        const positions = [];
        for (let i = 0; i < houseCount; i++) {
            let x;
            do {
                x = Math.random() * (containerWidth - 120); // 120px is house width
            } while (positions.some(pos => Math.abs(pos - x) < minSpacing));
            positions.push(x);
        }
        
        positions.forEach((x, i) => {
            const house = document.createElement('div');
            house.className = 'house';
            
            // Random height between 80 and 110 pixels
            const height = Math.random() * 30 + 80;
            house.style.height = `${height}px`;
            
            // Random colors
            const houseColor = houseColors[Math.floor(Math.random() * houseColors.length)];
            const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];
            const doorColor = doorColors[Math.floor(Math.random() * doorColors.length)];
            
            // Create roof
            const roof = document.createElement('div');
            roof.className = 'roof';
            roof.style.backgroundColor = roofColor;
            house.appendChild(roof);
            
            // Create door
            const door = document.createElement('div');
            door.className = 'door';
            door.style.backgroundColor = doorColor;
            house.appendChild(door);
            
            // Set house color and position
            house.style.backgroundColor = houseColor;
            house.style.left = `${x}px`;
            
            // Fixed z-index of 20 (houses always in front of buildings)
            house.style.zIndex = 20;
            
            // Add windows with random lighting
            const leftWindow = document.createElement('div');
            leftWindow.className = 'house-window-left';
            if (Math.random() < 0.3) {
                leftWindow.classList.add('lit');
            }
            house.appendChild(leftWindow);
            
            const rightWindow = document.createElement('div');
            rightWindow.className = 'house-window-right';
            if (Math.random() < 0.3) {
                rightWindow.classList.add('lit');
            }
            house.appendChild(rightWindow);
            
            this.cityscape.appendChild(house);
        });
    }

    createStreetlamps() {
        // Clear existing lamps
        const existingLamps = this.cityscape.querySelectorAll('.streetlamp');
        existingLamps.forEach(lamp => lamp.remove());

        const spacing = 150; // Fixed spacing of 150px
        const lampCount = Math.ceil(window.innerWidth / spacing);
        
        for (let i = 0; i <= lampCount; i++) {
            const lamp = document.createElement('div');
            lamp.className = 'streetlamp';
            lamp.style.left = `${i * spacing}px`;
            
            const light = document.createElement('div');
            light.className = 'lamp-light day';
            
            const down = document.createElement('div');
            down.className = 'lamp-down';
            
            lamp.appendChild(light);
            lamp.appendChild(down);
            
            this.cityscape.appendChild(lamp);
        }
    }

    setupCelestialBodies() {
        log('Setting up celestial bodies');
        
        // Check if elements exist
        if (!this.sun) {
            log('ERROR: Sun element not found, creating it');
            this.sun = document.createElement('div');
            this.sun.id = 'sun';
            document.getElementById('scene-container').appendChild(this.sun);
        }
        
        if (!this.moon) {
            log('ERROR: Moon element not found, creating it');
            this.moon = document.createElement('div');
            this.moon.id = 'moon';
            document.getElementById('scene-container').appendChild(this.moon);
        }
        
        // Ensure they're visible and have proper styling
        this.sun.style.display = 'block';
        this.sun.style.position = 'absolute';
        this.sun.style.width = '60px';
        this.sun.style.height = '60px';
        this.sun.style.borderRadius = '50%';
        this.sun.style.backgroundColor = '#ffdd00';
        this.sun.style.boxShadow = '0 0 30px #ffdd00, 0 0 60px #ffbb00';
        this.sun.style.zIndex = '2';
        this.sun.style.transition = 'transform 10s linear, opacity 10s ease-in-out';
        this.sun.style.opacity = '0';
        
        this.moon.style.display = 'block';
        this.moon.style.position = 'absolute';
        this.moon.style.width = '50px';
        this.moon.style.height = '50px';
        this.moon.style.borderRadius = '50%';
        this.moon.style.backgroundColor = '#ddd';
        this.moon.style.boxShadow = '0 0 20px #ddd';
        this.moon.style.zIndex = '2';
        this.moon.style.transition = 'transform 10s linear, opacity 10s ease-in-out';
        this.moon.style.opacity = '0';
        
        // Set initial positions for sun and moon
        // Start 20vw left of viewport
        this.sun.style.transform = 'translate(-20vw, 100vh)';
        this.moon.style.transform = 'translate(-20vw, 100vh)';
        
        log('Celestial bodies setup complete');
    }

    setupStars() {
        // Clear existing stars
        while (this.starContainer.firstChild) {
            this.starContainer.removeChild(this.starContainer.firstChild);
        }

        // Create random stars
        const starCount = Math.floor(Math.random() * 50) + 100; // 100-150 stars
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star ' + ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 70 + '%'; // Keep stars in upper 70% of sky
            star.style.animationDelay = Math.random() * 2 + 's';
            this.starContainer.appendChild(star);
        }
        
        // Initially hide stars
        this.starContainer.style.opacity = '0';
    }

    setupClouds() {
        // Clear existing clouds
        const existingClouds = document.querySelectorAll('.cloud');
        existingClouds.forEach(cloud => cloud.remove());
        this.clouds = [];

        // Create initial clouds
        for (let i = 0; i < this.minClouds; i++) {
            this.createCloud(true);
        }
    }

    updateCelestialBodies(timeOfDay) {
        // For performance, only log occasionally
        if (Math.random() < 0.01) {
            log(`Updating celestial bodies for timeOfDay: ${timeOfDay.toFixed(3)}`);
        }
        
        // Ensure celestial bodies exist and are displayed
        if (!this.sun || !this.moon) {
            log('ERROR: Celestial bodies missing in updateCelestialBodies, recreating');
            this.setupCelestialBodies();
            return;
        }
        
        // Calculate which bodies should be visible
        // Sun: visible from dawn (5) through dusk (19)
        // Moon: visible from dusk (19) through dawn (7)
        const hourOfDay = timeOfDay * 24;
        
        // Calculate positions - align with phases in updatePhases method
        // Sun rises at dawn (5am), peaks at noon, sets at dusk (7pm)
        // Moon rises at dusk (7pm), peaks at midnight, sets just before dawn (5am)
        let sunProgress, moonProgress;
        
        // Constants for position and fading calculations
        const startVw = -20;
        const endVw = 120;
        const fadeStartVw = 95; // Start fading when 5vw from right edge
        
        // Calculate the progress value that corresponds to fadeStartVw
        const fadeStartProgress = (fadeStartVw - startVw) / (endVw - startVw);
        
        // Sun opacity calculation
        let sunOpacity = 0;
        
        // Calculate sun visibility and progress
        if (hourOfDay >= 5 && hourOfDay <= 19) {
            // Sun is visible during day - map 5am->7pm to 0->1 progress
            sunProgress = (hourOfDay - 5) / 14;
            
            // Only fade when setting and within 5vw of the right edge
            if (sunProgress >= fadeStartProgress) {
                // Map fadeStartProgress->1 to 1->0 opacity
                sunOpacity = 1 - ((sunProgress - fadeStartProgress) / (1 - fadeStartProgress));
            } else {
                // Full opacity during the rest of the day
                sunOpacity = 1;
            }
        }
        
        // Moon opacity calculation
        let moonOpacity = 0;
        
        // Calculate moon visibility and progress
        if (hourOfDay >= 17 || hourOfDay <= 7) {
            // Moon is visible during night - map 5pm->7am to 0->1 progress
            moonProgress = hourOfDay >= 17 ? 
                (hourOfDay - 17) / 14 : // 5pm to midnight
                ((hourOfDay + 7) / 14);  // midnight to 7am
            
            // Only fade when setting and within 5vw of the right edge
            if (moonProgress >= fadeStartProgress) {
                // Map fadeStartProgress->1 to 1->0 opacity
                moonOpacity = 1 - ((moonProgress - fadeStartProgress) / (1 - fadeStartProgress));
            } else {
                // Full opacity during the rest of the night
                moonOpacity = 1;
            }
        }
        
        // Update positions and opacity based on calculated progress
        if (sunProgress !== undefined) {
            const { x: sunX, y: sunY } = this.calculateCelestialPosition(sunProgress, 'sun');
            this.sun.style.transform = `translate(${sunX}vw, ${sunY}px)`;
            this.sun.style.opacity = sunOpacity.toFixed(2);
            
            // Only update sun appearance if visible
            if (sunOpacity > 0) {
                // Calculate sun brightness based on height
                const brightness = Math.min(1, 1 - (sunY / this.viewportHeight));
                
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
                this.sun.style.boxShadow = `0 0 ${30 * brightness}px ${rgbSunColor}, 0 0 ${60 * brightness}px rgb(255, 187, 0)`;
            }
        }
        
        if (moonProgress !== undefined) {
            const { x: moonX, y: moonY } = this.calculateCelestialPosition(moonProgress, 'moon');
            this.moon.style.transform = `translate(${moonX}vw, ${moonY}px)`;
            this.moon.style.opacity = moonOpacity.toFixed(2);
        }
        
        // Update stars based on time of day (stars fade in at dusk and fade out at dawn)
        let starOpacity = 0;
        if (hourOfDay >= 19 || hourOfDay < 5) {
            // Night: full opacity
            starOpacity = 1;
        } else if (hourOfDay >= 5 && hourOfDay < 7) {
            // Dawn: fade out (7-5)/2 = 1 -> 0
            starOpacity = 1 - ((hourOfDay - 5) / 2);
        } else if (hourOfDay >= 17 && hourOfDay < 19) {
            // Dusk: fade in (19-17)/2 = 0 -> 1
            starOpacity = (hourOfDay - 17) / 2;
        }
        
        this.starContainer.style.opacity = starOpacity.toString();
    }

    updatePhases(timeOfDay) {
        const currentTime = timeOfDay * 24;
        let currentPhase;

        // Determine current phase
        if (currentTime >= 18 && currentTime < 20) {
            currentPhase = 'dusk';
        } else if (currentTime >= 20 || currentTime < 5) {
            currentPhase = 'night';
        } else if (currentTime >= 5 && currentTime < 7) {
            currentPhase = 'dawn';
        } else if (currentTime >= 7 && currentTime < 18) {
            currentPhase = 'day';
        }

        // Only update DOM if phase changed
        if (this.lastPhase !== currentPhase) {
            const allLayers = document.querySelectorAll('.sky-layer');
            if (allLayers.length > 0) {
                if (this.lastPhase) {
                    log(`Phase transition: ${this.lastPhase} -> ${currentPhase}`);
                }
                
                // First, mark the new phase layer for display
                allLayers.forEach(layer => {
                    if (layer.classList.contains(currentPhase)) {
                        layer.classList.remove('hidden');
                        // Set opacity to 0 initially for smooth fade-in
                        layer.style.opacity = '0';
                        
                        // Force reflow to ensure transition works
                        void layer.offsetWidth;
                        
                        // Fade in the new layer
                        setTimeout(() => {
                            layer.style.opacity = '1';
                        }, 10);
                    }
                });
                
                // Handle previous phase layer - keep visible but fade out
                if (this.lastPhase) {
                    const oldLayers = document.querySelectorAll(`.sky-layer.${this.lastPhase}`);
                    oldLayers.forEach(layer => {
                        // Start fade out
                        layer.style.opacity = '0';
                        
                        // Set a timer to hide it completely after fade
                        setTimeout(() => {
                            if (layer.style.opacity === '0') {
                                layer.classList.add('hidden');
                            }
                        }, 10000); // 10 seconds matching CSS transition time
                    });
                }
                
                this.lastPhase = currentPhase;
            }

            // Update scene container class
            if (this.sceneContainer) {
                if (currentPhase === 'night' || currentPhase === 'dusk') {
                    this.sceneContainer.classList.add('night');
                    this.sceneContainer.classList.remove('day');
                } else {
                    this.sceneContainer.classList.add('day');
                    this.sceneContainer.classList.remove('night');
                }
            }
        }

        // Handle specific transition cases
        
        // Smooth transitions for dusk (6pm-8pm)
        if (currentPhase === 'dusk') {
            const nightLayer = document.querySelector('.sky-layer.night');
            if (nightLayer) {
                // Dusk is from 18-20, map to 0-1 for opacity
                const duskProgress = (currentTime - 18) / 2;
                nightLayer.classList.remove('hidden');
                nightLayer.style.opacity = duskProgress.toFixed(2);
            }
        }
        
        // Smooth transitions for dawn (5am-7am)
        if (currentPhase === 'dawn') {
            const dayLayer = document.querySelector('.sky-layer.day');
            if (dayLayer) {
                // Dawn is from 5-7, map to 0-1 for day layer opacity
                const dawnProgress = (currentTime - 5) / 2;
                dayLayer.classList.remove('hidden');
                dayLayer.style.opacity = dawnProgress.toFixed(2);
            }
            
            // Fade out night layer during dawn
            const nightLayer = document.querySelector('.sky-layer.night');
            if (nightLayer) {
                nightLayer.classList.remove('hidden');
                nightLayer.style.opacity = (1 - ((currentTime - 5) / 2)).toFixed(2);
            }
        }

        // Handle lamp light transitions
        const lampLights = document.querySelectorAll('.lamp-light');
        if (lampLights.length > 0) {
            lampLights.forEach(light => {
                if (currentPhase === 'night' || currentPhase === 'dusk') {
                    light.classList.add('night');
                    light.classList.remove('day');
                } else {
                    light.classList.add('day');
                    light.classList.remove('night');
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
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Update digital clock
        if (this.digitalClock) {
            this.digitalClock.textContent = `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
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
                log(`Updating clock - Time: ${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`);
                log(`Hour hand angle: ${hourAngle}deg, Minute hand angle: ${minuteAngle}deg`);
            }
        } else if (Math.random() < 0.01) {
            // Log if hands are missing, but only occasionally
            log('WARNING: Hour or minute hand references missing in updateClock');
            log(`hourHand exists: ${!!this.hourHand}, minuteHand exists: ${!!this.minuteHand}`);
        }
    }

    updateClouds() {
        const remainingClouds = [];
        
        for (const cloud of this.clouds) {
            const left = parseFloat(cloud.style.left);
            const speed = parseFloat(cloud.dataset.speed);
            
            if (left <= 120) {
                cloud.style.left = (left + speed) + '%';
                remainingClouds.push(cloud);
            } else {
                cloud.remove();
            }
        }

        this.clouds = remainingClouds;

        // Add new clouds if needed
        if (Math.random() < 0.01 && this.clouds.length < this.maxClouds) {
            this.createCloud(true);
        } else if (this.clouds.length < this.minClouds) {
            this.createCloud(true);
        }
    }

    calculateCelestialPosition(progress, body) {
        // For performance, only log occasionally
        if (Math.random() < 0.01) {
            log(`Calculating celestial position for progress: ${progress.toFixed(3)}`);
        }
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate horizontal position - using vw units
        // Start: -20vw, End: 120vw (100vw + 20vw)
        const startVw = -20;
        const endVw = 120;
        const xInVw = startVw + (progress * (endVw - startVw));
        
        // Calculate vertical position using a parabola
        // Start and end at bottom of screen, peak at 5vh from top at center
        
        // Normalize x from 0-1 to -1 to 1 (center at 0)
        const normalizedX = (progress * 2) - 1;
        
        // Using quadratic function: y = a*x^2 + b
        // When x = -1 or x = 1, y should be near bottom of screen
        // When x = 0, y should be 5vh from top
        
        const bottomY = viewportHeight - 10; // 10px from bottom
        const topY = viewportHeight * 0.05; // 5vh from top
        
        // Solve for 'a': a = (bottom - top) / 1^2 = bottom - top
        const a = bottomY - topY;
        
        // Calculate parabola: y = a*x^2 + top
        // This will give us a parabola that passes through:
        // (-1, bottom), (0, top), (1, bottom)
        const y = (a * normalizedX * normalizedX) + topY;
        
        if (Math.random() < 0.01) {
            log(`Calculated celestial position: x=${xInVw.toFixed(1)}vw, y=${y.toFixed(1)}px`);
        }
        
        return { x: xInVw, y };
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
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        return {
            r: parseInt(ctx.fillStyle.slice(1, 3), 16),
            g: parseInt(ctx.fillStyle.slice(3, 5), 16),
            b: parseInt(ctx.fillStyle.slice(5, 7), 16)
        };
    }

    startAnimation() {
        log(`startAnimation called, isPlaying: ${this.isPlaying}`);
        
        // Reset animation state
        this.isPlaying = true;
        this.startTime = Date.now();
        log('Animation started, isPlaying set to true');
        
        // Force initial updates immediately
        const timeOfDay = 0; // Start at midnight
        log(`Forcing initial update with timeOfDay: ${timeOfDay}`);
        
        // Make celestial bodies visible before updating positions
        if (this.sun) this.sun.style.display = 'block';
        if (this.moon) this.moon.style.display = 'block';
        
        // Apply immediate updates
        this.updatePhases(timeOfDay);
        this.updateCelestialBodies(timeOfDay);
        this.updateClock(timeOfDay);
        this.updateClouds();
        
        // Start animation loop
        log('Starting animation loop');
        this.animate();
    }
    
    animate() {
        if (!this.isPlaying) {
            log('animate() called while not playing, exiting animation loop');
            return;
        }
        
        try {
            // Calculate time of day
            const elapsed = Date.now() - this.startTime;
            const timeOfDay = (elapsed % this.cycleDuration) / this.cycleDuration;
            
            // For performance, only log occasionally
            if (Math.random() < 0.01) {
                log(`Animation frame, timeOfDay: ${timeOfDay.toFixed(3)}`);
            }
            
            // Update all components
            this.updatePhases(timeOfDay);
            this.updateCelestialBodies(timeOfDay);
            this.updateClock(timeOfDay);
            this.updateClouds();
            
            // Continue animation loop if still playing
            if (this.isPlaying) {
                // Store frame ID and request next frame
                this.animationFrameId = requestAnimationFrame(() => this.animate());
            } else {
                log('Animation stopped during frame, cancelling loop');
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        } catch (error) {
            log(`Error in animation loop: ${error.message}`);
            console.error('Animation error:', error);
        }
    }

    createCloud(randomizePosition = false) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        // Random cloud properties
        const width = 100 + Math.random() * 100;
        const height = 40 + Math.random() * 30;
        const speed = 0.02 + Math.random() * 0.03;
        
        cloud.style.width = width + 'px';
        cloud.style.height = height + 'px';
        cloud.style.top = (Math.random() * 40) + '%';
        
        if (randomizePosition) {
            cloud.style.left = (Math.random() * 100) + '%';
        } else {
            cloud.style.left = '-20%';
        }
        
        // Store cloud properties
        cloud.dataset.speed = speed;
        
        document.getElementById('clouds').appendChild(cloud);
        this.clouds.push(cloud);
        
        // Remove excess clouds
        if (this.clouds.length > this.maxClouds) {
            const oldCloud = this.clouds.shift();
            oldCloud.remove();
        }
    }

    cleanup() {
        log('Cleanup started - preparing to reset scene');
        
        // Stop animation
        this.isPlaying = false;
        if (this.animationFrameId) {
            log(`Cancelling animation frame ID: ${this.animationFrameId}`);
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Reset all animations
        log('Resetting all animations');
        const animatedElements = document.querySelectorAll('.animated, .sky-layer');
        log(`Found ${animatedElements.length} animated elements to reset`);
        animatedElements.forEach((element, index) => {
            if (element) {
                element.style.animation = 'none';
                element.style.transition = 'none';
                if (index < 3) log(`Reset animation for element: ${element.className}`);
            }
        });

        // Reset sun and moon
        log('Resetting celestial bodies');
        if (this.sun) {
            log('Resetting sun');
            this.sun.style.display = 'none';
            this.sun.style.transform = '';
        }
        
        if (this.moon) {
            log('Resetting moon');
            this.moon.style.display = 'none';
            this.moon.style.transform = '';
        }
        
        // Reset star container
        if (this.starContainer) {
            log('Resetting star container');
            this.starContainer.style.opacity = '0';
        }
        
        // Reset sky layers
        log('Resetting sky layers');
        const allLayers = document.querySelectorAll('.sky-layer');
        log(`Found ${allLayers.length} sky layers to reset`);
        allLayers.forEach((layer, index) => {
            if (layer) {
                layer.classList.add('hidden');
                layer.style.opacity = '';
                layer.style.animation = 'none';
                if (index < 3) log(`Reset sky layer: ${layer.className}`);
            }
        });

        // Clear clouds
        log('Clearing clouds');
        if (this.clouds && Array.isArray(this.clouds)) {
            log(`Removing ${this.clouds.length} clouds`);
            this.clouds.forEach((cloud, index) => {
                try {
                    if (cloud && cloud.parentElement) {
                        cloud.parentElement.removeChild(cloud);
                        if (index < 3) log(`Removed cloud ${index}`);
                    }
                } catch (error) {
                    log(`Error removing cloud ${index}: ${error.message}`);
                }
            });
            this.clouds = [];
        } else {
            log('No clouds array found for cleanup');
        }

        // Reset UFO
        const ufo = document.querySelector('.ufo');
        if (ufo) {
            log('Resetting UFO');
            ufo.style.animation = 'none';
            ufo.style.display = 'none';
        } else {
            log('UFO element not found for reset');
        }

        try {
            // Force reflow to apply all animation removals
            document.body.offsetHeight;
            log('Forced reflow to apply style changes');
        } catch (error) {
            log(`Error during reflow: ${error.message}`);
        }
        
        // Reset internal state
        this.lastPhase = null;
        this.startTime = null;
        this.pausedAt = null;
        
        log('Cleanup complete');
    }

    pauseAnimation() {
        log(`pauseAnimation called, isPlaying: ${this.isPlaying}`);
        if (!this.isPlaying) {
            log('Animation already paused, skipping pauseAnimation');
            return;
        }
        
        log('Pausing animation, cancelling animation frame');
        
        // Set isPlaying to false BEFORE cancelling animation frame to prevent race conditions
        this.isPlaying = false;
        
        // Cancel any pending animation frame
        if (this.animationFrameId) {
            log(`Cancelling animation frame ID: ${this.animationFrameId}`);
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Pause all celestial animations
        if (this.sun) {
            this.sun.style.transition = 'none';
            // Store current position
            this.pausedSunPosition = this.sun.style.transform;
        }
        
        if (this.moon) {
            this.moon.style.transition = 'none';
            // Store current position
            this.pausedMoonPosition = this.moon.style.transform;
        }
        
        // Pause UFO animation if present
        const ufo = document.querySelector('.ufo');
        if (ufo) {
            log('Pausing UFO animation');
            ufo.style.animationPlayState = 'paused';
        }
        
        // Pause cloud animations
        if (this.clouds && this.clouds.length) {
            this.clouds.forEach(cloud => {
                if (cloud) {
                    cloud.style.transition = 'none';
                    // Get current left position
                    const computedStyle = window.getComputedStyle(cloud);
                    cloud.style.left = computedStyle.left;
                }
            });
        }
        
        // Store the exact moment we paused
        this.pausedAt = Date.now();
        log(`Animation paused at: ${this.pausedAt}`);
    }

    resumeAnimation() {
        log(`resumeAnimation called, isPlaying: ${this.isPlaying}`);
        if (this.isPlaying) {
            log('Animation already playing, skipping resumeAnimation');
            return;
        }
        
        // Resume celestial animations
        if (this.sun) {
            this.sun.style.transition = '';
        }
        
        if (this.moon) {
            this.moon.style.transition = '';
        }
        
        // Resume UFO animation
        const ufo = document.querySelector('.ufo');
        if (ufo) {
            log('Resuming UFO animation');
            ufo.style.animationPlayState = 'running';
        }
        
        // Resume cloud animations
        if (this.clouds && this.clouds.length) {
            this.clouds.forEach(cloud => {
                if (cloud) {
                    cloud.style.transition = '';
                }
            });
        }
        
        // Adjust start time to account for pause duration
        if (this.pausedAt) {
            const pauseDuration = Date.now() - this.pausedAt;
            log(`Pause duration: ${pauseDuration}ms`);
            this.startTime += pauseDuration;
            log(`Adjusted startTime to: ${this.startTime}`);
            this.pausedAt = null;
        } else {
            log('No pausedAt timestamp found, using current startTime');
        }
        
        // Set isPlaying to true and restart animation
        this.isPlaying = true;
        log('Animation resumed, isPlaying set to true');
        this.animate();
    }
}
