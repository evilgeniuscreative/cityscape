// Configuration
const CYCLE_DURATION = 180000; // Milliseconds for one 24-hour cycle (24 seconds)

// Load fresh uncached files every time

window.onload = function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const src = script.src;
      if (src) {
        script.src = src + '?v=' + Date.now();
      }
    }
  };

class CityScene {
    constructor() {
        // Prevent multiple instances
        if (window.citySceneInstance) {
            console.warn('CityScene already exists');
            return window.citySceneInstance;
        }
        window.citySceneInstance = this;

        // Configuration
        this.cycleDuration = CYCLE_DURATION;
        this.isPlaying = false;
        this.startTime = Date.now();
        this.isDark = false;
        this.clouds = [];
        this.minClouds = 3;
        this.maxClouds = 6;
        this.lastPhase = null;
        this.animationFrameId = null;
        this.lastAnimationTimestamp = 0;

        // Setup cleanup handlers
        window.addEventListener('unload', () => this.cleanup());
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('pagehide', () => this.cleanup());

        try {
            this.initializeElements();
            this.setupScene();
            this.setupCelestialBodies();
            this.setupStars();
            this.setupClouds();
            this.setupEventListeners();
            this.startAnimation();
        } catch (error) {
            console.error('Error initializing CityScene:', error);
            this.cleanup();
        }
    }

    initializeElements() {
        // Get references to DOM elements
        this.sceneContainer = document.getElementById('scene-container');
        if (!this.sceneContainer) throw new Error('Scene container not found');

        this.sky = document.getElementById('sky');
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');
        this.starContainer = document.getElementById('stars');
        this.cityscape = document.getElementById('cityscape');
        this.buildings = document.querySelectorAll('.building');
        this.windows = document.querySelectorAll('.window');
        
        // Get clock elements
        this.digitalClock = document.getElementById('digital-clock');
        this.analogClock = document.getElementById('analog-clock');
        this.hourHand = this.analogClock?.querySelector('.hour-hand');
        this.minuteHand = this.analogClock?.querySelector('.minute-hand');
        
        // Speed control elements
        this.speedSlider = document.getElementById('speedSlider');
        this.speedDisplay = document.getElementById('speedDisplay');
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
        // Set initial positions for sun and moon
        this.sun.style.transform = `translate(-150vw, ${window.innerHeight * 0.7}px)`;
        this.moon.style.transform = `translate(-150vw, ${window.innerHeight * 0.7}px)`;
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

    setupEventListeners() {
        // Setup clock toggle
        const toggleButton = document.getElementById('toggleClock');
        toggleButton.addEventListener('click', () => {
            this.digitalClock.classList.toggle('active');
            this.analogClock.classList.toggle('active');
        });

        // Setup speed control
        this.speedSlider.addEventListener('input', (e) => {
            const newDuration = parseInt(e.target.value);
            // Store current progress before changing duration
            const now = Date.now();
            const elapsed = now - this.startTime;
            const currentProgress = (elapsed % this.cycleDuration) / this.cycleDuration;
            
            // Update duration
            this.cycleDuration = newDuration;
            
            // Adjust start time to maintain current position in cycle
            this.startTime = now - (currentProgress * this.cycleDuration);
            
            // Update display
            const minutes = (newDuration / 1000 / 60).toFixed(1);
            this.speedDisplay.textContent = `Cycle: ${minutes} minutes`;
        });
    }

    calculateCelestialPosition(progress) {
        // Map progress (0-1) to x position across viewport width (-10 to 110)
        const x = progress * 120 - 10; // Start off-screen left, end off-screen right
        
        // Parabola parameters
        const h = 50;  // vertex x-coordinate (center of viewport)
        const k = 10;  // vertex y-coordinate (10vh from top - apogee)
        const a = 0.02;  // coefficient for steeper curve
        
        // Calculate y position
        // y = ax² + bx + c form of parabola
        // When x = -10 or 110, y should be ~90vh
        // When x = 50, y should be 10vh (k)
        const y = a * Math.pow(x - h, 2) + k;
        
        return { x, y };
    }

    animateScene(timestamp) {
        if (!this.isPlaying) return;

        // Throttle animations to 60fps
        if (timestamp - this.lastAnimationTimestamp < 16) {
            this.animationFrameId = requestAnimationFrame((t) => this.animateScene(t));
            return;
        }
        this.lastAnimationTimestamp = timestamp;

        try {
            const elapsed = Date.now() - this.startTime;
            const timeOfDay = (elapsed % this.cycleDuration) / this.cycleDuration;
            
            this.updatePhases(timeOfDay);
            this.updateCelestialBodies(timeOfDay);
            this.updateClouds();
            this.updateClock(timeOfDay);

            this.animationFrameId = requestAnimationFrame((t) => this.animateScene(t));
        } catch (error) {
            console.error('Animation error:', error);
            this.cleanup();
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

        // Only update DOM if phase changed
        if (this.lastPhase !== currentPhase) {
            const allLayers = document.querySelectorAll('.sky-layer');
            allLayers.forEach(layer => {
                if (currentPhase === 'dusk' && layer.classList.contains('night')) {
                    return;
                }
                const shouldBeVisible = layer.classList.contains(currentPhase);
                layer.classList.toggle('hidden', !shouldBeVisible);
            });
            
            this.lastPhase = currentPhase;
        }

        // Handle dusk transition`
        if (currentPhase === 'dusk') {
            const nightLayer = document.querySelector('.sky-layer.night');
            if (nightLayer) {
                const duskProgress = (currentTime - 19);
                nightLayer.style.opacity = duskProgress.toFixed(2);
                nightLayer.classList.remove('hidden');
            }
        }

        // Handle lamp light and other day/night transitions

        const lampDown = document.getElementById('lamp-down');
    
        if(currentPhase === 'night' || currentPhase === 'dusk') {
            lampDown.classList.add('night');
            lampDown.classList.remove('day');
            this.sceneContainer.classList.add('night');
            this.sceneContainer.classList.remove('day');
        } else {
            lampDown.classList.add('day');
            lampDown.classList.remove('night');
            this.sceneContainer.classList.add('day');
            this.sceneContainer.classList.remove('night');
        }
    }

    updateCelestialBodies(timeOfDay) {
        // Update sun
        if (timeOfDay >= 7/24 && timeOfDay < 18/24) {
            const sunProgress = (timeOfDay - 7/24) * (24/11);
            const pos = this.calculateCelestialPosition(sunProgress);
            this.sun.style.transform = `translate(${pos.x}vw, ${pos.y}vh)`;
            this.sun.style.display = 'block';
        } else {
            this.sun.style.display = 'none';
        }

        // Update moon
        if (timeOfDay >= 20/24 || timeOfDay < 7/24) {
            const moonProgress = timeOfDay >= 20/24 ? 
                (timeOfDay - 20/24) * (24/11) : 
                ((timeOfDay + 4/24) * (24/11));
            const pos = this.calculateCelestialPosition(moonProgress);
            this.moon.style.transform = `translate(${pos.x}vw, ${pos.y}vh)`;
            this.moon.style.display = 'block';
        } else {
            this.moon.style.display = 'none';
        }

        // Update stars
        const isNight = timeOfDay >= 21/24 || timeOfDay < 5/24;
        this.starContainer.style.opacity = isNight ? '1' : '0';

    }

    updateClouds() {
        // Create a new array for updated clouds
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
        if (Math.random() < 0.005 && this.clouds.length < this.maxClouds) {
            this.createCloud(false);
        } else if (this.clouds.length < this.minClouds) {
            this.createCloud(false);
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

    startAnimation() {
        if (this.isPlaying) return;
        
        const now = new Date();
        const currentHour = now.getHours();
        const isDayTime = currentHour >= 6 && currentHour < 18;
        
        if (!isDayTime) {
            this.startTime = Date.now() - this.cycleDuration;
            this.isDark = true;
            if (this.sceneContainer) {
                this.sceneContainer.classList.remove('scene-day');
                this.sceneContainer.classList.add('scene-night');
            }
        }
        
        this.isPlaying = true;
        this.lastAnimationTimestamp = 0;
        this.animationFrameId = requestAnimationFrame((t) => this.animateScene(t));
    }

    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Reset all sky layers to their initial state
        const allLayers = document.querySelectorAll('.sky-layer');
        allLayers.forEach(layer => {
            layer.classList.add('hidden');
            layer.style.opacity = '';
        });
        // Reset celestial bodies
        if (this.sun) this.sun.style.display = 'none';
        if (this.moon) this.moon.style.display = 'none';
        if (this.starContainer) this.starContainer.style.opacity = '0';
        // Clear the singleton instance
        window.citySceneInstance = null;
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
}

// Start the scene when the page loads
window.addEventListener('load', () => {
    new CityScene();
});
