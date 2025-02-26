class CityScene {
    constructor() {
        this.totalCycleDuration = 14400; // 40 seconds for full day/night cycle
        // Start at midnight (0 minutes) with an offset to position moon at center
        this.startTime = Date.now() - (this.totalCycleDuration * (360/1440)); // Position for midnight
        this.totalPausedTime = 0;
        this.lastPauseTime = null;
        this.isPlaying = false;
        this.minClouds = 3;
        this.clouds = [];
        this.windowStates = new Map(); // Track window states through the night
        this.lastStateUpdate = null;

        // Time periods in minutes (1440 total)
        this.timePeriods = {
            DAWN_START: 300,    // 5 AM
            DAWN_END: 420,      // 7 AM
            DAY_START: 450,     // 7 AM
            DAY_END: 1020,      // 5 PM
            DUSK_START: 1050,   // 5 PM
            DUSK_END: 1140,     // 7 PM
        };

        // Calculate how many real milliseconds each game minute takes
        this.millisecondsPerGameMinute = this.totalCycleDuration / 1440;

        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeScene());
        } else {
            this.initializeScene();
        }
    }

    initializeScene() {
        // Initialize DOM elements
        this.sceneContainer = document.getElementById('scene-container');
        this.sky = document.getElementById('sky');
        this.starContainer = document.getElementById('stars');
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');
        this.cloudContainer = document.getElementById('clouds');
        this.cityscape = document.getElementById('cityscape');
        
        // Controls
        this.playPauseButton = document.getElementById('playPause');
        this.toggleClockButton = document.getElementById('toggleClock');
        this.digitalClock = document.getElementById('digital-clock');
        this.analogClock = document.getElementById('analog-clock');
        this.hourHand = this.analogClock.querySelector('.hour-hand');
        this.minuteHand = this.analogClock.querySelector('.minute-hand');

        // Initialize state
        this.clouds = [];
        
        // Setup scene components
        this.setupScene();
        this.setupEventListeners();
        
        // Initialize clouds at random positions
        for (let i = 0; i < this.minClouds; i++) {
            this.createCloud(true);
        }

        // Start animation
        this.play();
    }

    setupEventListeners() {
        const playPauseBtn = document.getElementById('playPause');
        const toggleClockBtn = document.getElementById('toggleClock');

        playPauseBtn.addEventListener('click', () => {
            this.togglePlay();
            playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
        });

        toggleClockBtn.addEventListener('click', () => {
            const digitalClock = document.getElementById('digital-clock');
            const analogClock = document.getElementById('analog-clock');
            
            if (digitalClock.classList.contains('active')) {
                digitalClock.classList.remove('active');
                analogClock.classList.add('active');
                toggleClockBtn.textContent = 'Show Digital';
            } else if (analogClock.classList.contains('active')) {
                analogClock.classList.remove('active');
                toggleClockBtn.textContent = 'Show Clock';
            } else {
                digitalClock.classList.add('active');
                analogClock.classList.remove('active');
                toggleClockBtn.textContent = 'Show Analog';
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
        });
    }

    setupScene() {
        this.starContainer = document.getElementById('stars');
        const numberOfStars = 300;
        
        for (let i = 0; i < numberOfStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Random size between 1 and 3 pixels
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // Position anywhere in the viewport
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            
            // Random twinkle delay
            star.style.animationDelay = `${Math.random() * 1}s`;
            
            this.starContainer.appendChild(star);
        }

        // Start animation if not already playing
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.animateScene();
        }
        
        this.createBuildings();
        this.createHouses();
        this.createStreetlamps();
        this.setupCelestialBodies();
        this.setupClouds();
        this.setupClock();
        this.setupControls();
    }

    createBuildings() {
        const buildingCount = Math.floor(Math.random() * 4) + 8; // 8-11 buildings
        const containerWidth = window.innerWidth;
        
        for (let i = 0; i < buildingCount; i++) {
            const building = document.createElement('div');
            building.className = 'building';
            
            // Width calculation for 2-4 windows per row
            const minCols = 2; // Minimum 2 columns
            const maxCols = 4;
            const totalCols = minCols + Math.floor(Math.random() * (maxCols - minCols + 1));
            
            // Window and spacing dimensions
            const windowWidth = 20;
            const windowHeight = 30;
            const windowGap = 10;
            const buildingPadding = 15; // 15px padding on all sides
            
            // Calculate rows to ensure it's divisible by 3
            const minRows = 3; // Minimum number of window rows (must be divisible by 3)
            const maxExtraRows = 6; // Maximum additional rows (must be divisible by 3)
            
            // Generate random number of rows that's divisible by 3
            const extraRows = Math.floor(Math.random() * (maxExtraRows / 3)) * 3;
            const totalRows = minRows + extraRows;
            
            // Create window container
            const windowContainer = document.createElement('div');
            windowContainer.className = 'window-container';
            
            // Create windows in a grid layout
            for (let row = 0; row < totalRows; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'window-row';
                for (let col = 0; col < totalCols; col++) {
                    const windowEl = this.createWindow(rowDiv);
                }
                windowContainer.appendChild(rowDiv);
            }
            
            // Calculate exact height based on rows plus padding
            const contentHeight = (totalRows * windowHeight) + ((totalRows - 1) * windowGap);
            const buildingHeight = contentHeight + (buildingPadding * 2);
            
            // Calculate width based on columns plus padding
            const contentWidth = (totalCols * windowWidth) + ((totalCols - 1) * windowGap);
            const buildingWidth = Math.max(contentWidth + (buildingPadding * 2), 120);
            
            building.style.width = `${buildingWidth}px`;
            building.style.height = `${buildingHeight}px`;
            
            building.appendChild(windowContainer);
            this.cityscape.appendChild(building);
        }
    }

    createWindow(building) {
        const window = document.createElement('div');
        window.className = 'window day';
        window.dataset.windowId = Math.random().toString(36).substr(2, 9); // Assign a unique ID
        building.appendChild(window);
        return window;
    }

    createHouses() {
        const houseCount = Math.floor(Math.random() * 4) + 5; // 5-8 houses
        const containerWidth = window.innerWidth;
        const spacing = containerWidth / houseCount;

        for (let i = 0; i < houseCount; i++) {
            const house = document.createElement('div');
            house.className = 'house';
            house.style.left = `${i * spacing}px`;
            
            // Random house colors
            const wallColor = `hsl(${Math.random() * 360}, 70%, 70%)`;
            const roofColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
            const doorColor = `hsl(${Math.random() * 360}, 70%, 40%)`;

            house.style.backgroundColor = wallColor;
            house.innerHTML = `
                <div class="roof" style="background: ${roofColor}; clip-path: polygon(0 100%, 50% 0, 100% 100%)"></div>
                <div style="position: absolute; bottom: 0; left: 40%; width: 20px; height: 40px; background: ${doorColor}"></div>
                <div class="window house-window-left"></div>
                <div class="window house-window-right"></div>`;

            this.cityscape.appendChild(house);
        }
    }

    createStreetlamps() {
        const lampCount = Math.floor(window.innerWidth / 150); // One lamp every 150px
        const spacing = window.innerWidth / lampCount;

        for (let i = 0; i < lampCount; i++) {
            const lamp = document.createElement('div');
            lamp.className = 'streetlamp';
            lamp.style.left = `${i * spacing}px`;
            
            const light = document.createElement('div');
            light.className = 'lamp-light';
            lamp.appendChild(light);
            
            this.cityscape.appendChild(lamp);
        }
    }

    setupClouds() {
        // Initial cloud creation
        for (let i = 0; i < this.minClouds; i++) {
            this.createCloud(true);
        }
    }

    createCloud(isInitial = false) {
        const cloudCluster = document.createElement('div');
        cloudCluster.className = 'cloud';
        
        // Random cloud properties
        const baseSize = Math.random() * 100 + 50; // 50-150px
        const height = Math.random() * 200 + 50; // 50-250px from top
        
        // Create 3-5 cloud parts
        const numParts = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < numParts; i++) {
            const part = document.createElement('div');
            part.className = 'cloud-part';
            
            // Random size and position for each part
            const partSize = baseSize * (0.6 + Math.random() * 0.4);
            const xOffset = (i - numParts/2) * (baseSize * 0.4);
            const yOffset = (Math.random() - 0.5) * (baseSize * 0.2);
            
            part.style.width = `${partSize}px`;
            part.style.height = `${partSize}px`;
            part.style.left = `${xOffset}px`;
            part.style.top = `${yOffset}px`;
            part.style.filter = 'blur(3px)';
            
            cloudCluster.appendChild(part);
        }
        
        // Position the whole cloud cluster
        cloudCluster.style.top = `${height}px`;
        
        if (isInitial) {
            const randomX = Math.random() * window.innerWidth;
            cloudCluster.style.left = `${randomX}px`;
        } else {
            cloudCluster.style.left = '-200px';
        }

        // Random speed within 30% of base speed
        const baseSpeed = 20; // Base duration in seconds
        const speedVariation = baseSpeed * 0.3;
        const duration = baseSpeed + (Math.random() * 2 - 1) * speedVariation;
        cloudCluster.style.setProperty('--float-duration', `${duration}s`);

        // Add animation end listener
        cloudCluster.addEventListener('animationend', () => {
            cloudCluster.remove();
            this.clouds = this.clouds.filter(c => c !== cloudCluster);
            if (this.clouds.length < this.minClouds) {
                this.createCloud();
            }
        });

        this.cloudContainer.appendChild(cloudCluster);
        this.clouds.push(cloudCluster);
        
        // Stagger animation start
        setTimeout(() => {
            cloudCluster.classList.add('floating');
        }, isInitial ? Math.random() * 2000 : 0);
    }

    setupCelestialBodies() {
        this.sun.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
                <div style="position: absolute; left: 15px; top: 20px; width: 8px; height: 8px; background: black; border-radius: 50%;"></div>
                <div style="position: absolute; right: 15px; top: 20px; width: 8px; height: 8px; background: black; border-radius: 50%;"></div>
                <div style="position: absolute; left: 18px; top: 35px; width: 24px; height: 10px; border: 2px solid black; border-radius: 0 0 10px 10px; border-top: none;"></div>
            </div>`;
        
        this.sun.style.width = '60px';
        this.sun.style.height = '60px';
        this.sun.style.background = '#FFD700';
        this.sun.style.borderRadius = '50%';
        this.sun.style.position = 'absolute';
        this.sun.style.zIndex = '1'; // Behind buildings and clouds
        
        // Create moon craters
        const craters = [
            { x: '20%', y: '30%', size: '12px' },
            { x: '60%', y: '40%', size: '15px' },
            { x: '35%', y: '60%', size: '10px' },
            { x: '70%', y: '25%', size: '8px' },
            { x: '45%', y: '70%', size: '14px' }
        ];

        this.moon.innerHTML = craters.map(crater => `
            <div style="
                position: absolute;
                left: ${crater.x};
                top: ${crater.y};
                width: ${crater.size};
                height: ${crater.size};
                background: #8B8B8B;
                border-radius: 50%;
                box-shadow: inset 1px 1px 3px rgba(0,0,0,0.3);
            "></div>
        `).join('');
        
        this.moon.style.width = '60px';
        this.moon.style.height = '60px';
        this.moon.style.background = '#A9A9A9'; // Medium grey
        this.moon.style.borderRadius = '50%';
        this.moon.style.position = 'absolute';
        this.moon.style.zIndex = '1'; // Behind buildings and clouds
    }

    setupClock() {
        this.digitalClock = document.getElementById('digital-clock');
        this.analogClock = document.getElementById('analog-clock');
        this.hourHand = this.analogClock.querySelector('.hour-hand');
        this.minuteHand = this.analogClock.querySelector('.minute-hand');
    }

    setupControls() {
        const playPauseBtn = document.getElementById('playPause');
        const toggleClockBtn = document.getElementById('toggleClock');

        if (!playPauseBtn || !toggleClockBtn) {
            console.error('Control buttons not found');
            return;
        }

        // Remove any existing event listeners
        playPauseBtn.replaceWith(playPauseBtn.cloneNode(true));
        toggleClockBtn.replaceWith(toggleClockBtn.cloneNode(true));

        // Get the fresh elements
        const newPlayPauseBtn = document.getElementById('playPause');
        const newToggleClockBtn = document.getElementById('toggleClock');

        newPlayPauseBtn.addEventListener('click', () => {
            this.togglePlay();
            newPlayPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
        });

        newToggleClockBtn.addEventListener('click', () => {
            const digitalClock = document.getElementById('digital-clock');
            const analogClock = document.getElementById('analog-clock');
            
            if (!digitalClock || !analogClock) {
                console.error('Clock elements not found');
                return;
            }

            const isDigital = digitalClock.classList.contains('active');
            digitalClock.classList.toggle('active');
            analogClock.classList.toggle('active');
            analogClock.classList.toggle('hidden');
            newToggleClockBtn.textContent = isDigital ? 'Switch to Digital' : 'Switch to Analog';
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
        });
    }

    updateClock(totalMinutes) {
        // Update digital clock
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = Math.floor(totalMinutes % 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        document.getElementById('digital-clock').textContent = 
            `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        document.getElementById('millisecond-tracking').textContent = totalMinutes;

        // Update analog clock
        const hourHand = document.querySelector('.hour-hand');
        const minuteHand = document.querySelector('.minute-hand');
        
        // Calculate angles
        const hourAngle = ((hours % 12) * 30) + (minutes / 2); // 30 degrees per hour, plus minute contribution
        const minuteAngle = minutes * 6; // 6 degrees per minute
        
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }

    updateWindows(cycleMinutes) {
        const isNight = cycleMinutes >= 1200 || cycleMinutes < 360; // 8 PM to 6 AM
        
        document.querySelectorAll('.window').forEach(window => {
            const windowId = window.dataset.windowId;
            
            if (isNight) {
                window.classList.add('night');
                window.classList.remove('day');
                
                // Check if we already decided this window's state for tonight
                if (!this.windowStates.has(windowId)) {
                    // 30% chance of light being on
                    const lightOn = Math.random() < 0.3;
                    this.windowStates.set(windowId, lightOn);
                }
                
                // Apply stored state
                if (this.windowStates.get(windowId)) {
                    window.classList.add('light-on');
                } else {
                    window.classList.remove('light-on');
                }
            } else {
                // Reset window states during day
                window.classList.remove('night', 'light-on');
                window.classList.add('day');
                this.windowStates.delete(windowId);
            }
        });
    }

    togglePlay() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.lastPauseTime = Date.now();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            if (this.lastPauseTime) {
                this.totalPausedTime += Date.now() - this.lastPauseTime;
                this.lastPauseTime = null;
            }
            requestAnimationFrame(this.animateScene.bind(this));
        }
    }

    animateScene() {
        if (!this.isPlaying) return;

        const currentTime = Date.now();
        const adjustedTime = currentTime - this.totalPausedTime;
        const elapsed = (adjustedTime - this.startTime) % this.totalCycleDuration;
        const cycleMinutes = (elapsed / this.totalCycleDuration) * 1440;

        // Throttle state updates to every 100ms
        if (!this.lastStateUpdate || currentTime - this.lastStateUpdate >= 100) {
            this.updateTimeBasedClasses(cycleMinutes);
            this.lastStateUpdate = currentTime;
        }

        this.updateWindows(cycleMinutes);
        this.updateCelestialObjects(cycleMinutes);
        this.updateClock(Math.floor(cycleMinutes));

        if (this.isPlaying) {
            requestAnimationFrame(this.animateScene.bind(this));
        }
    }

    updateTimeBasedClasses(cycleMinutes) {
        // Normalize minutes to 24-hour cycle
        cycleMinutes = cycleMinutes % 1440;
        
        // Get current and next states
        const currentState = this.getCurrentTimeState(cycleMinutes);
        const nextState = this.getNextTimeState(currentState);
        
        // Update sky layers
        const layers = document.querySelectorAll('.sky-layer');
        layers.forEach(layer => {
            const state = layer.classList.contains('night') ? 'night' :
                         layer.classList.contains('dawn') ? 'dawn' :
                         layer.classList.contains('day') ? 'day' : 'dusk';
            
            // Current state is visible
            if (state === currentState) {
                layer.classList.remove('hidden');
                layer.style.zIndex = '4';
            }
            // Next state is positioned just below
            else if (state === nextState) {
                layer.classList.add('hidden');
                layer.style.zIndex = '3';
            }
            // Other states are moved to bottom
            else {
                layer.classList.add('hidden');
                layer.style.zIndex = '1';
            }
        });

        // Update scene container class for other elements (buildings, windows)
        if (this.sceneContainer.className !== currentState) {
            this.sceneContainer.className = currentState;
        }

        // Update celestial objects visibility
        if (cycleMinutes >= this.timePeriods.DAWN_START && cycleMinutes < this.timePeriods.DUSK_END) {
            this.sun.classList.add('celestial-visible');
            this.sun.classList.remove('celestial-hidden');
            this.moon.classList.add('celestial-hidden');
            this.moon.classList.remove('celestial-visible');
        } else {
            this.sun.classList.add('celestial-hidden');
            this.sun.classList.remove('celestial-visible');
            this.moon.classList.add('celestial-visible');
            this.moon.classList.remove('celestial-hidden');
        }

        // Update stars opacity
        const starsOpacity = (cycleMinutes >= this.timePeriods.DUSK_START || cycleMinutes < this.timePeriods.DAWN_END) ? '1' : '0';
        if (this.starContainer.style.opacity !== starsOpacity) {
            this.starContainer.style.opacity = starsOpacity;
        }
    }

    getNextTimeState(currentState) {
        const states = ['night', 'dawn', 'day', 'dusk'];
        const currentIndex = states.indexOf(currentState);
        return states[(currentIndex + 1) % states.length];
    }

    getCurrentTimeState(cycleMinutes) {
        // Dawn: 5 AM (300) to 7 AM (420)
        // Day: 7 AM (420) to 5 PM (1020)
        // Dusk: 5 PM (1020) to 7 PM (1140)
        // Night: 7 PM (1140) to 5 AM (300)
        
        if (cycleMinutes >= 300 && cycleMinutes < 420) {
            return 'dawn';
        } else if (cycleMinutes >= 420 && cycleMinutes < 1020) {
            return 'day';
        } else if (cycleMinutes >= 1020 && cycleMinutes < 1140) {
            return 'dusk';
        } else {
            return 'night';
        }
    }

    updateCelestialObjects(cycleMinutes) {
        // Normalize minutes to 24-hour cycle
        cycleMinutes = cycleMinutes % 1440;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const topMargin = 30;
        const orbitWidth = width + 400;
        const startX = -200;

        // Moon movement (visible from 7 PM to 7 AM)
        if (cycleMinutes >= 1140 || cycleMinutes < 420) {
            let moonProgress;
            if (cycleMinutes >= 1140) {
                moonProgress = (cycleMinutes - 1140) / 960;
            } else {
                moonProgress = (cycleMinutes + 300) / 960;
            }
            
            moonProgress = Math.max(0, Math.min(1, moonProgress));
            const moonX = startX + (orbitWidth * moonProgress);
            const moonY = this.calculateCelestialY(moonX + 200, width, height, topMargin);
            
            this.moon.style.transform = `translate(${moonX}px, ${-moonY}px)`;
            this.moon.classList.remove('celestial-hidden');
            this.moon.classList.add('celestial-visible');
            
            // Fade out moon during dawn
            if (cycleMinutes >= 300 && cycleMinutes < 420) {
                const fadeProgress = (cycleMinutes - 300) / 120;
                this.moon.style.opacity = Math.max(0, 1 - fadeProgress);
            } else {
                this.moon.style.opacity = 1;
            }
        } else {
            this.moon.classList.add('celestial-hidden');
            this.moon.classList.remove('celestial-visible');
        }

        // Sun movement (5 AM to 7 PM)
        if (cycleMinutes >= 300 && cycleMinutes < 1140) {
            const sunProgress = (cycleMinutes - 300) / 840; // 14 hours of sun
            const sunX = startX + (orbitWidth * sunProgress);
            const sunY = this.calculateCelestialY(sunX + 200, width, height, topMargin);
            
            this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            this.sun.classList.remove('celestial-hidden');
            this.sun.classList.add('celestial-visible');
            
            // Fade in/out sun during dawn/dusk
            if (cycleMinutes >= 300 && cycleMinutes < 420) { // Dawn
                const fadeProgress = (cycleMinutes - 300) / 120;
                this.sun.style.opacity = Math.min(1, fadeProgress);
            } else if (cycleMinutes >= 1020 && cycleMinutes < 1140) { // Dusk
                const fadeProgress = (cycleMinutes - 1020) / 120;
                this.sun.style.opacity = Math.max(0, 1 - fadeProgress);
            } else {
                this.sun.style.opacity = 1;
            }
        } else {
            this.sun.classList.add('celestial-hidden');
            this.sun.classList.remove('celestial-visible');
        }
    }

    calculateCelestialY(x, width, height, topMargin) {
        // Adjusted parabolic path for smoother arc
        const a = 1.2 * (height - topMargin) / (width * width);
        const h = width / 2;
        const k = height - topMargin * 2;
        return -a * Math.pow(x - h, 2) + k;
    }

    // ... rest of the code remains the same ...
}

// Start the scene when the page loads
window.addEventListener('load', () => {
    new CityScene();
});
