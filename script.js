// Configuration
const CYCLE_DURATION = 180000; // Milliseconds for one 24-hour cycle (24 seconds)

class CityScene {
    constructor() {
        // Configuration
        this.cycleDuration = CYCLE_DURATION; // Milliseconds for one 24-hour cycle
        
        this.isPlaying = false;
        this.startTime = Date.now();
        this.isDark = false;
        this.clouds = [];
        this.minClouds = 3;
        this.maxClouds = 6;
        this.lastPhase = null; // Initialize lastPhase property

        // Get references to DOM elements
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
        this.hourHand = this.analogClock.querySelector('.hour-hand');
        this.minuteHand = this.analogClock.querySelector('.minute-hand');
        
        // Initialize scene
        this.setupScene();
        
        // Initialize components
        this.setupCelestialBodies();
        this.setupStars();
        this.setupClouds();
        
        // Start animation
        this.isPlaying = true;
        this.animateScene();
        
        // Setup clock toggle
        const toggleButton = document.getElementById('toggleClock');
        toggleButton.addEventListener('click', () => {
            this.digitalClock.classList.toggle('active');
            this.analogClock.classList.toggle('active');
        });

        // Setup speed control
        this.speedSlider = document.getElementById('speedSlider');
        this.speedDisplay = document.getElementById('speedDisplay');
        this.setupSpeedControl();
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

        const buildingCount = Math.floor(Math.random() * 6) + 8; // 8-12 buildings
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
            
            // Random height between 100 and 300 pixels
            const height = Math.random() * 200 + 100;
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
            
            // Add windows
            const floorHeight = 40; // Height of each floor including gap
            const floors = Math.floor((height - 20) / floorHeight); // Account for padding
            const windowWidth = 20; // Width of each window including gap
            const windowsPerFloor = Math.floor((width - 25) / windowWidth); // Account for padding
            
            for (let floor = 0; floor < floors; floor++) {
                const floorDiv = document.createElement('div');
                floorDiv.className = 'floor';
                
                
                for (let w = 0; w < windowsPerFloor; w++) {
                    const window = document.createElement('div');
                    window.className = 'window';
                    // Random chance for window to be lit
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

        const houseCount = Math.floor(Math.random() * 6) + 3; // 3-8 houses
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
            light.className = 'lamp-light';
            
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

    setupSpeedControl() {
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

    animateScene() {
        if (!this.isPlaying) return;

        const now = Date.now();
        const elapsed = now - this.startTime;
        const timeOfDay = (elapsed % this.cycleDuration) / this.cycleDuration;

        // Convert timeOfDay to hours for easier calculations
        const virtualHours = timeOfDay * 24;

        // Update streetlight colors based on time
        const lampLights = document.querySelectorAll('.lamp-light, .lamp-down');
        const isDay = virtualHours >= 7 && virtualHours < 18; // 7am to 6pm
        lampLights.forEach(light => {
            light.classList.toggle('day', isDay);
            light.classList.toggle('night', !isDay);
        });

        // Update clock
        const virtualHours12 = Math.floor(timeOfDay * 24);
        const virtualMinutes = Math.floor((timeOfDay * 24 * 60) % 60);
        const ampm = virtualHours12 >= 12 ? 'PM' : 'AM';
        const hours12 = virtualHours12 % 12 || 12;
        
        // Update digital clock
        this.digitalClock.textContent = `${hours12}:${String(virtualMinutes).padStart(2, '0')} ${ampm}`;
        
        // Update analog clock
        const hourAngle = ((virtualHours12 % 12) / 12) * 360 + (virtualMinutes / 60) * 30;
        const minuteAngle = (virtualMinutes / 60) * 360;
        
        this.hourHand.style.transform = `rotate(${hourAngle}deg)`;
        this.minuteHand.style.transform = `rotate(${minuteAngle}deg)`;

        // Keep existing sky layer transitions
        const skyLayers = {
            dawn: [5/24, 7/24],      // 5am to 7am
            day: [7/24, 18/24],      // 7am to 6pm
            dusk: [18/24, 20/24],    // 6pm to 8pm
            // moonrise: [20/24, 21/24], // 8pm to 9pm
            night: [20/24, 5/24]      // 9pm to 5am
        };

        // Determine current phase
        const currentTime = timeOfDay * 24; // Convert to hours
        let currentPhase;

        // Debug log current time
        console.log(`Current time: ${currentTime.toFixed(2)} hours`);

        // Check for dusk-to-night transition (between 7pm and 8pm)
        if (currentTime >= 19 && currentTime < 20) {
            currentPhase = 'dusk';
            // Gradually increase night layer opacity during dusk
            const nightLayer = document.querySelector('.sky-layer.night');
            const duskProgress = (currentTime - 19) / 1; // Progress from 0 to 1 during dusk hour
            if (nightLayer) {
                nightLayer.style.opacity = duskProgress.toFixed(2);
                nightLayer.classList.remove('hidden');
                console.log(`Night layer opacity: ${duskProgress.toFixed(2)}`);
            }
        }
        // Regular phase checks
        else if (currentTime >= 20 || currentTime < 5) {
            currentPhase = 'night';
        } else if (currentTime >= 5 && currentTime < 7) {
            currentPhase = 'dawn';
        } else if (currentTime >= 7 && currentTime < 18) {
            currentPhase = 'day';
        } 
        
        // else if (currentTime >= 20 && currentTime < 21) {
        //     currentPhase = 'moonrise';
        // }

        console.log(`Selected phase: ${currentPhase}`);

        // Store last phase to prevent unnecessary updates
        if (this.lastPhase !== currentPhase) {
            console.log(`Phase changing from ${this.lastPhase} to ${currentPhase}`);
            
            // Update all layers at once based on current phase
            const allLayers = document.querySelectorAll('.sky-layer');
            allLayers.forEach(layer => {
                const shouldBeVisible = layer.classList.contains(currentPhase);
                const isVisible = !layer.classList.contains('hidden');
                
                // Don't hide night layer during dusk transition
                if (currentPhase === 'dusk' && layer.classList.contains('night')) {
                    return;
                }
                
                if (shouldBeVisible !== isVisible) {
                    layer.classList.toggle('hidden');
                    console.log(`${layer.classList[1]}: ${shouldBeVisible ? 'showing' : 'hiding'}`);
                }
            });
            
            this.lastPhase = currentPhase;
        }

        // Sun animation (7am to 6pm)
        if (timeOfDay >= 7/24 && timeOfDay < 18/24) {
            const sunProgress = (timeOfDay - 7/24) * (24/11); // Scale to 0-1 over 11-hour period
            const pos = this.calculateCelestialPosition(sunProgress);
            
            this.sun.style.transform = `translate(${pos.x}vw, ${pos.y}vh)`;
            this.sun.style.display = 'block';
        } else {
            this.sun.style.display = 'none';
        }

        // Moon animation (8pm to 7am)
        if (timeOfDay >= 20/24 || timeOfDay < 7/24) {
            let moonProgress;
            if (timeOfDay >= 20/24) {
                // 8pm to midnight (4 hours)
                moonProgress = (timeOfDay - 20/24) * (24/11);
            } else {
                // midnight to 7am (7 hours)
                moonProgress = ((timeOfDay + 4/24) * (24/11));
            }
            
            const pos = this.calculateCelestialPosition(moonProgress);
            
            this.moon.style.transform = `translate(${pos.x}vw, ${pos.y}vh)`;
            this.moon.style.display = 'block';
        } else {
            this.moon.style.display = 'none';
        }

        // Show/hide stars during night (with transition)
        const isNight = timeOfDay >= 21/24 || timeOfDay < 5/24; // 9pm to 5am
        this.starContainer.style.opacity = isNight ? '1' : '0';

        // Animate clouds
        this.clouds.forEach((cloud, index) => {
            const left = parseFloat(cloud.style.left);
            const speed = parseFloat(cloud.dataset.speed);
            
            if (left > 120) {
                cloud.remove();
                this.clouds.splice(index, 1);
                
                if (this.clouds.length < this.minClouds) {
                    this.createCloud(false);
                }
            } else {
                cloud.style.left = (left + speed) + '%';
            }
        });

        if (Math.random() < 0.005 && this.clouds.length < this.maxClouds) {
            this.createCloud(false);
        }

        requestAnimationFrame(() => this.animateScene());
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
        // Start with proper timing based on current time of day
        const now = new Date();
        const currentHour = now.getHours();
        const isDayTime = currentHour >= 6 && currentHour < 18;
        
        if (!isDayTime) {
            this.startTime = Date.now() - this.cycleDuration;
            this.isDark = true;
            this.sceneContainer.classList.remove('scene-day');
            this.sceneContainer.classList.add('scene-night');
        }
        
        requestAnimationFrame(this.animateScene.bind(this));
    }
}

// Start the scene when the page loads
window.addEventListener('load', () => {
    new CityScene();
});
