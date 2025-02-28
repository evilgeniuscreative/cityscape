// Configuration
const CYCLE_DURATION = 40000; // Milliseconds for one 24-hour cycle (40 seconds)
const DEBUG = true; // Enable/disable debug logging

// Helper for debug logging
function log(message) {
    if (DEBUG) console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

// Track active instance
let activeScene = null;
let restartInProgress = false;

// Initialize scene only after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    log('DOM fully loaded, initializing scene');
    if (!activeScene) {
        activeScene = new CityScene();
    }
});

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
        
        // Start animation
        log('Starting animation');
        this.startAnimation();
        log('CityScene constructor completed');
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

        // Setup restart button
        const restartButton = document.getElementById('restart');
        if (restartButton) {
            log('Adding restart button event listener');
            restartButton.addEventListener('click', () => {
                log('Restart button clicked');
                
                // Prevent multiple restarts
                if (restartInProgress) {
                    log('Restart already in progress, ignoring click');
                    return;
                }
                
                // Disable button during restart
                restartInProgress = true;
                restartButton.disabled = true;
                restartButton.style.opacity = '0.5';
                
                log('Beginning restart process');
                try {
                    // Stop current scene
                    log('Cleaning up current scene');
                    this.cleanup();
                    
                    log('Setting timeout for new scene creation');
                    setTimeout(() => {
                        try {
                            log('Creating new scene instance');
                            // Create new scene
                            activeScene = new CityScene();
                            
                            // Reset button
                            log('Resetting restart button');
                            restartButton.disabled = false;
                            restartButton.style.opacity = '1';
                            restartInProgress = false;
                        } catch (innerError) {
                            log(`Error during scene creation: ${innerError.message}`);
                            console.error('Error creating new scene:', innerError);
                            
                            // Reset button on error
                            restartButton.disabled = false;
                            restartButton.style.opacity = '1';
                            restartInProgress = false;
                        }
                    }, 100);
                } catch (error) {
                    log(`Error during restart: ${error.message}`);
                    console.error('Error during restart:', error);
                    
                    // Reset button on error
                    restartButton.disabled = false;
                    restartButton.style.opacity = '1';
                    restartInProgress = false;
                }
            });
        } else {
            log('WARNING: Restart button not found in DOM');
        }

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
                    digitalClock.style.cssText = 'display: none !important;';
                    analogClock.style.display = 'block';
                    toggleButton.style.cssText = 'box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2);';
                } else {
                    digitalClock.style.cssText = 'display: block !important;';
                    analogClock.style.display = 'none';
                    toggleButton.style.cssText = '';
                }
            });
            
            // Set initial state
            digitalClock.style.cssText = 'display: block !important;';
            analogClock.style.display = 'none';
            toggleButton.style.cssText = '';
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
        log('Initializing DOM elements');
        
        // Get references to DOM elements
        this.sceneContainer = document.getElementById('scene-container');
        if (!this.sceneContainer) {
            log('ERROR: Scene container not found!');
            throw new Error('Scene container not found');
        }

        log('Getting sky element reference');
        this.sky = document.getElementById('sky');
        if (!this.sky) {
            log('Sky element not found, creating it');
            this.sky = document.createElement('div');
            this.sky.id = 'sky';
            this.sceneContainer.appendChild(this.sky);
        }
        
        log('Getting sun element reference');
        this.sun = document.getElementById('sun');
        if (!this.sun) {
            log('Sun element not found, will be created later');
        }
        
        log('Getting moon element reference');
        this.moon = document.getElementById('moon');
        if (!this.moon) {
            log('Moon element not found, will be created later');
        }
        
        log('Getting star container reference');
        this.starContainer = document.getElementById('stars');
        if (!this.starContainer) {
            log('Star container not found, creating it');
            this.starContainer = document.createElement('div');
            this.starContainer.id = 'stars';
            this.sceneContainer.appendChild(this.starContainer);
        }
        
        log('Getting cityscape element reference');
        this.cityscape = document.getElementById('cityscape');
        if (!this.cityscape) {
            log('Cityscape element not found, will be created later');
        }
        
        // Get building and window references if they exist
        this.buildings = document.querySelectorAll('.building');
        this.windows = document.querySelectorAll('.window');
        
        // Get clock elements
        log('Getting clock element references');
        this.digitalClock = document.getElementById('digital-clock');
        if (!this.digitalClock) {
            log('WARNING: Digital clock not found');
        }
        
        this.analogClock = document.getElementById('analog-clock');
        if (!this.analogClock) {
            log('WARNING: Analog clock not found');
        } else {
            this.hourHand = this.analogClock.querySelector('.hour-hand');
            this.minuteHand = this.analogClock.querySelector('.minute-hand');
            
            if (!this.hourHand || !this.minuteHand) {
                log('WARNING: Clock hands not found');
            }
        }
        
        // Speed control elements
        log('Getting speed control references');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedDisplay = document.getElementById('speedDisplay');
        
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
        
        this.moon.style.display = 'block';
        this.moon.style.position = 'absolute';
        this.moon.style.width = '50px';
        this.moon.style.height = '50px';
        this.moon.style.borderRadius = '50%';
        this.moon.style.backgroundColor = '#ddd';
        this.moon.style.boxShadow = '0 0 20px #ddd';
        this.moon.style.zIndex = '2';
        
        // Set initial positions for sun and moon
        this.sun.style.transform = `translate(-150vw, ${window.innerHeight * 0.7}px)`;
        this.moon.style.transform = `translate(-150vw, ${window.innerHeight * 0.7}px)`;
        
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
        
        // Make sure they're visible
        this.sun.style.display = 'block';
        this.moon.style.display = 'block';
        
        // Calculate positions
        const { x: sunX, y: sunY } = this.calculateCelestialPosition(timeOfDay);
        const { x: moonX, y: moonY } = this.calculateCelestialPosition((timeOfDay + 0.5) % 1);
        
        // Update positions
        this.sun.style.transform = `translate(${sunX}vw, ${sunY}px)`;
        this.moon.style.transform = `translate(${moonX}vw, ${moonY}px)`;
        
        // Calculate sun brightness based on height (higher = brighter)
        const maxHeight = window.innerHeight * 0.8;
        const minY = window.innerHeight - maxHeight;
        const sunHeight = Math.min(Math.max(sunY, minY), window.innerHeight);
        const sunBrightness = 1 - Math.abs((sunHeight - minY) / maxHeight - 0.5) * 2;
        
        // Update sun appearance
        const baseSunColor = [255, 221, 0];
        const sunsetColor = [255, 140, 0];
        const sunColor = this.interpolateColor(
            sunsetColor,
            baseSunColor,
            sunBrightness
        );
        
        // Apply color and glow
        const rgbSunColor = `rgb(${sunColor[0]}, ${sunColor[1]}, ${sunColor[2]})`;
        this.sun.style.backgroundColor = rgbSunColor;
        this.sun.style.boxShadow = `0 0 ${30 * sunBrightness}px ${rgbSunColor}, 0 0 ${60 * sunBrightness}px rgb(255, 187, 0)`;
        
        // Update stars based on sun position
        const starOpacity = timeOfDay > 0.75 || timeOfDay < 0.25 ? 1 : 0;
        this.starContainer.style.opacity = starOpacity.toString();
        
        if (Math.random() < 0.01) {
            log(`Sun position: (${sunX.toFixed(1)}, ${sunY.toFixed(1)}), Moon position: (${moonX.toFixed(1)}, ${moonY.toFixed(1)})`);
        }
    }

    updatePhases(timeOfDay) {
        const currentTime = timeOfDay * 24;
        let currentPhase;

        // Determine current phase
        if (currentTime >= 19 && currentTime < 20) {
            currentPhase = 'dusk';
        } else if (currentTime >= 20 || currentTime < 5) {
            currentPhase = 'night';
        } else if (currentTime >= 5 && currentTime < 7) {
            currentPhase = 'dawn';
        } else if (currentTime >= 7 && currentTime < 18) {
            currentPhase = 'day';
        }

        // Only update DOM if phase changed and elements exist
        if (this.lastPhase !== currentPhase) {
            const allLayers = document.querySelectorAll('.sky-layer');
            if (allLayers.length > 0) {
                allLayers.forEach(layer => {
                    if (currentPhase === 'dusk' && layer.classList.contains('night')) {
                        return;
                    }
                    const shouldBeVisible = layer.classList.contains(currentPhase);
                    layer.classList.toggle('hidden', !shouldBeVisible);
                });
                
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

        // Handle dusk transition
        if (currentPhase === 'dusk') {
            const nightLayer = document.querySelector('.sky-layer.night');
            if (nightLayer) {
                const duskProgress = (currentTime - 19);
                nightLayer.style.opacity = duskProgress.toFixed(2);
                nightLayer.classList.remove('hidden');
            }
        }

        // Handle lamp light transitions
        const lampDown = document.getElementById('lamp-down');
        if (lampDown) {
            if (currentPhase === 'night' || currentPhase === 'dusk') {
                lampDown.classList.add('night');
                lampDown.classList.remove('day');
            } else {
                lampDown.classList.add('day');
                lampDown.classList.remove('night');
            }
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

    calculateCelestialPosition(progress) {
        log(`Calculating celestial position for progress: ${progress.toFixed(3)}`);
        
        // Normalize progress to be between 0 and 1
        progress = (progress + 1) % 1;
        
        // Calculate horizontal position (percentage of viewport width)
        const horizontalRange = 120; // -10% to 110% of viewport width
        const x = (progress * horizontalRange) - 10; // Start at -10% viewport width
        
        // Calculate vertical position (pixels)
        const windowHeight = window.innerHeight;
        const minHeight = windowHeight * 0.1; // Highest point (10% down from top)
        const maxHeight = windowHeight * 0.7; // Lowest point (70% down from top)
        const heightRange = maxHeight - minHeight;
        
        // Create a parabolic path that starts and ends at maxHeight
        // and reaches minHeight at progress = 0.5
        const verticalProgress = 1 - Math.sin(progress * Math.PI);
        const y = minHeight + (verticalProgress * heightRange / 2);
        
        log(`Calculated position: x=${x.toFixed(1)}vw, y=${y.toFixed(1)}px`);
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
        } else {
            log('Sun element not found for reset');
        }
        
        if (this.moon) {
            log('Resetting moon');
            this.moon.style.display = 'none';
            this.moon.style.transform = '';
        } else {
            log('Moon element not found for reset');
        }
        
        if (this.starContainer) {
            log('Resetting star container');
            this.starContainer.style.opacity = '0';
        } else {
            log('Star container not found for reset');
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
        
        // Reset state
        this.lastPhase = null;
        
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
