class CityScene {
    constructor() {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeScene();
        });
    }

    initializeScene() {
        // Initialize DOM elements
        this.cityscape = document.getElementById('cityscape');
        this.sky = document.getElementById('sky');
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');
        this.starContainer = document.getElementById('stars');
        this.digitalClock = document.getElementById('digital-clock');
        this.analogClock = document.querySelector('.analog-clock');
        this.hourHand = document.querySelector('.hour-hand');
        this.minuteHand = document.querySelector('.minute-hand');

        // Initialize state
        this.clouds = [];
        this.minClouds = 3;
        this.isPlaying = false;
        this.isDark = false;
        this.startTime = Date.now();
        this.pausedTime = 0;
        this.totalPausedTime = 0;
        this.cloudDirection = Math.random() < 0.5 ? 'left' : 'right';
        this.baseCloudSpeed = 0.5; // Reduced speed for smoother movement
        
        // 24 hour cycle in milliseconds
        this.totalCycleDuration = 30000; // 30 seconds = 24 hours
        
        // Day is from 6am to 8pm (14 hours)
        const dayHours = 14;
        const totalHours = 24;
        this.dayDuration = (dayHours / totalHours) * this.totalCycleDuration;
        this.nightDuration = this.totalCycleDuration - this.dayDuration;

        // Create clock markers
        for (let i = 0; i < 12; i++) {
            const marker = document.createElement('div');
            marker.className = 'clock-marker';
            const angle = (i * 30) - 90; // -90 to start at 12 o'clock
            const radius = 45; // Slightly inside the clock face
            const x = 50 + radius * Math.cos(angle * Math.PI / 180);
            const y = 50 + radius * Math.sin(angle * Math.PI / 180);
            marker.style.left = `${x}%`;
            marker.style.top = `${y}%`;
            this.analogClock.appendChild(marker);
        }

        // Setup the scene
        this.setupScene();
        this.setupEventListeners();
        
        // Create initial clouds
        for (let i = 0; i < this.minClouds; i++) {
            this.createCloud(true);
        }
        
        // Start the animation
        this.isPlaying = true;
        requestAnimationFrame(this.animateScene.bind(this));
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
        const containerWidth = window.innsunerWidth;
        
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
        window.className = 'window';
        
        // Add data attribute for state tracking
        window.dataset.state = 'day';
        window.dataset.lastStateChange = Date.now().toString();
        
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
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        const width = Math.random() * 100 + 100; // Cloud width between 100-200px
        cloud.style.width = `${width}px`;
        cloud.style.height = `${width * 0.6}px`;
        
        // Set initial position
        const startX = isInitial ? Math.random() * window.innerWidth : 
                      (this.cloudDirection === 'left' ? window.innerWidth : -width);
        const y = Math.random() * (window.innerHeight * 0.3); // Top 30% of screen
        
        cloud.style.left = `${startX}px`;
        cloud.style.top = `${y}px`;
        
        // Set cloud speed
        const speed = (Math.random() * 0.3 + this.baseCloudSpeed);
        cloud.dataset.speed = speed;
        cloud.dataset.direction = this.cloudDirection;
        
        this.sky.appendChild(cloud);
        this.clouds.push(cloud);
    }

    moveCloud(cloud) {
        const speed = parseFloat(cloud.dataset.speed);
        const direction = cloud.dataset.direction;
        const currentX = parseFloat(cloud.style.left);
        
        let newX;
        if (direction === 'left') {
            newX = currentX - speed;
            if (newX < -parseFloat(cloud.style.width)) {
                cloud.remove();
                this.clouds = this.clouds.filter(c => c !== cloud);
                this.createCloud(); // Create a new cloud to replace the removed one
                return;
            }
        } else {
            newX = currentX + speed;
            if (newX > window.innerWidth) {
                cloud.remove();
                this.clouds = this.clouds.filter(c => c !== cloud);
                this.createCloud(); // Create a new cloud to replace the removed one
                return;
            }
        }
        
        cloud.style.left = `${newX}px`;
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
        const windows = document.querySelectorAll('.window');
        const currentTime = Date.now();
        
        windows.forEach(window => {
            const lastChange = parseInt(window.dataset.lastStateChange);
            const state = window.dataset.state;
            
            // Day to Night transition (8 PM = 1200 minutes)
            if (cycleMinutes >= 1200 && state === 'day') {
                window.dataset.state = 'night';
                window.dataset.lastStateChange = currentTime.toString();
                window.classList.add('window-night');
                
                // 80% chance to turn light on
                if (Math.random() < 0.8) {
                    window.classList.add('window-night-on');
                }
            }
            // Night to Day transition (6 AM = 360 minutes)
            else if (cycleMinutes >= 360 && cycleMinutes < 361 && state === 'night') {
                window.dataset.state = 'day';
                window.dataset.lastStateChange = currentTime.toString();
                window.classList.remove('window-night', 'window-night-on');
            }
            // Random light changes during night (1 AM - 3 AM = 60-180 minutes)
            else if (state === 'night' && cycleMinutes >= 60 && cycleMinutes <= 180) {
                const timeSinceLastChange = currentTime - lastChange;
                
                // Only allow changes every 2 seconds
                if (timeSinceLastChange > 2000) {
                    if (window.classList.contains('window-night-on')) {
                        // 0.5% chance to turn off
                        if (Math.random() < 0.005) {
                            window.classList.remove('window-night-on');
                            window.dataset.lastStateChange = currentTime.toString();
                        }
                    } else {
                        // 0.1% chance to turn on
                        if (Math.random() < 0.001) {
                            window.classList.add('window-night-on');
                            window.dataset.lastStateChange = currentTime.toString();
                        }
                    }
                }
            }
        });
    }

    togglePlay() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.pausedTime = Date.now();
        } else {
            this.totalPausedTime += Date.now() - this.pausedTime;
            this.isPlaying = true;
            requestAnimationFrame(this.animateScene.bind(this));
        }
    }

    animateScene() {
        if (!this.isPlaying) return;

        const currentTime = Date.now();
        const adjustedTime = currentTime - this.totalPausedTime;
        const elapsed = (adjustedTime - this.startTime) % this.totalCycleDuration;
        
        // Calculate current time in minutes (0-1440)
        const totalMinutes = 1440; // 24 hours
        const cycleMinutes = (elapsed / this.totalCycleDuration) * totalMinutes;
        
        // Time constants (in minutes)
        const duskStart = 1200;    // 8:00 PM
        const duskEnd = 1260;      // 9:00 PM
        const moonriseTime = 1260; // 9:00 PM
        const moonsetTime = 300;   // 5:00 AM
        const dawnStart = 300;     // 5:00 AM
        const dawnEnd = 360;       // 6:00 AM

        // Calculate transition progress
        const duskProgress = (cycleMinutes >= duskStart && cycleMinutes <= duskEnd) 
            ? (cycleMinutes - duskStart) / (duskEnd - duskStart)
            : (cycleMinutes >= duskEnd ? 1 : 0);

        const dawnProgress = (cycleMinutes >= dawnStart && cycleMinutes <= dawnEnd)
            ? (cycleMinutes - dawnStart) / (dawnEnd - dawnStart)
            : (cycleMinutes >= dawnEnd || cycleMinutes < dawnStart ? 0 : 1);

        // Update windows
        this.updateWindows(cycleMinutes);
        
        // Move clouds
        this.clouds.forEach(cloud => this.moveCloud(cloud));
        
        // Create new clouds if needed
        if (this.clouds.length < this.minClouds) {
            this.createCloud();
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const topMargin = 30;
        const a = 2 * (height - topMargin) / (width * width);
        const h = width / 2;
        const k = height - topMargin * 4;

        // Night time (8 PM - 6 AM)
        if (cycleMinutes >= duskStart || cycleMinutes < dawnEnd) {
            // Calculate moon position
            let moonProgress = 0;
            
            if (cycleMinutes >= moonriseTime) {
                // After moonrise until midnight
                const minutesSinceMoonrise = cycleMinutes - moonriseTime;
                const totalMoonMinutes = moonsetTime + (1440 - moonriseTime);
                moonProgress = minutesSinceMoonrise / totalMoonMinutes;
            } else if (cycleMinutes < moonsetTime) {
                // After midnight until moonset
                const minutesSinceMidnight = cycleMinutes;
                const totalMoonMinutes = moonsetTime + (1440 - moonriseTime);
                moonProgress = (minutesSinceMidnight + (1440 - moonriseTime)) / totalMoonMinutes;
            }

            // Only show moon between moonrise and moonset
            if (cycleMinutes >= moonriseTime || cycleMinutes < moonsetTime) {
                const moonX = -30 + (width + 60) * moonProgress;
                const normalizedX = moonX + 30;
                const moonY = -a * Math.pow(normalizedX - h, 2) + k;
                
                this.moon.style.transform = `translate(${moonX}px, ${-moonY}px)`;
                this.moon.style.display = 'block';
                this.moon.style.opacity = 1;
            } else {
                this.moon.style.display = 'none';
            }

            // Handle dusk transition
            if (cycleMinutes >= duskStart && cycleMinutes <= duskEnd) {
                // Fade out sun during dusk
                this.sun.style.opacity = 1 - duskProgress;
                this.sun.style.display = 'block';
                
                // Transition sky color
                this.sky.style.backgroundColor = this.interpolateColor(
                    'skyblue',
                    '#1a1a2e',
                    duskProgress
                );
                
                // Fade in stars
                this.starContainer.style.display = 'block';
                this.starContainer.style.opacity = duskProgress;
                
                // Gradually turn on street lamps
                document.querySelectorAll('.lamp-light').forEach(light => {
                    const intensity = 0.8 * duskProgress;
                    light.style.boxShadow = `0 0 20px ${10 * duskProgress}px rgba(255, 244, 180, ${intensity})`;
                    light.style.backgroundColor = `rgba(255, 244, 180, ${intensity})`;
                });
            } else if (cycleMinutes >= dawnStart && cycleMinutes <= dawnEnd) {
                // Handle dawn transition
                this.sun.style.opacity = dawnProgress;
                this.sun.style.display = 'block';
                
                // Transition sky color
                this.sky.style.backgroundColor = this.interpolateColor(
                    '#1a1a2e',
                    'skyblue',
                    dawnProgress
                );
                
                // Fade out stars
                this.starContainer.style.opacity = 1 - dawnProgress;
                
                // Gradually turn off street lamps
                document.querySelectorAll('.lamp-light').forEach(light => {
                    const intensity = 0.8 * (1 - dawnProgress);
                    light.style.boxShadow = `0 0 20px ${10 * (1 - dawnProgress)}px rgba(255, 244, 180, ${intensity})`;
                    light.style.backgroundColor = `rgba(255, 244, 180, ${intensity})`;
                });
            } else {
                // Full night
                this.sun.style.display = 'none';
                this.starContainer.style.display = 'block';
                this.starContainer.style.opacity = 1;
                
                document.querySelectorAll('.lamp-light').forEach(light => {
                    light.style.boxShadow = '0 0 20px 10px rgba(255, 244, 180, 0.8)';
                    light.style.backgroundColor = '#fff4b4';
                });
            }
        } else { // Day time (6 AM - 8 PM)
            const dayProgress = cycleMinutes / duskStart;
            const sunX = -30 + (width + 60) * dayProgress;
            const normalizedX = sunX + 30;
            const sunY = -a * Math.pow(normalizedX - h, 2) + k;
            
            this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            this.sun.style.opacity = 1;
            this.sun.style.display = 'block';
            this.moon.style.display = 'none';
            
            this.sky.style.backgroundColor = 'skyblue';
            this.starContainer.style.display = 'none';
            
            document.querySelectorAll('.lamp-light').forEach(light => {
                light.style.boxShadow = 'none';
                light.style.backgroundColor = '#FFFFFF';
            });
        }

        // Update clock
        const displayMinutes = Math.floor(cycleMinutes);
        this.updateClock(displayMinutes);

        // Update nighttime flag
        this.isDark = cycleMinutes >= duskStart || cycleMinutes < dawnEnd;

        if (this.isPlaying) {
            requestAnimationFrame(this.animateScene.bind(this));
        }
    }

    interpolateColor(color1, color2, factor) {
        // Convert colors to RGB
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        // Interpolate each component
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(color) {
        // Handle named colors
        if (color === 'skyblue') return { r: 135, g: 206, b: 235 };
        
        // Handle hex colors
        const hex = color.replace('#', '');
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16)
        };
    }

    spawnUFO() {
        if (this.ufo) return;
        
        const ufo = document.createElement('div');
        ufo.className = 'ufo';
        
        // UFO body styles
        ufo.style.width = '80px';
        ufo.style.height = '40px';
        ufo.style.position = 'absolute';
        ufo.style.zIndex = '5'; // Above buildings
        
        // Random starting position: either left or right side
        const startFromLeft = Math.random() < 0.5;
        const startX = startFromLeft ? -100 : window.innerWidth + 100;
        const endX = startFromLeft ? window.innerWidth + 100 : -100;
        
        // Random vertical position in top 40% of screen
        const minY = 50;
        const maxY = window.innerHeight * 0.4;
        let currentY = Math.random() * (maxY - minY) + minY;
        
        // Random speed between 5 and 15 seconds for full crossing
        const duration = (Math.random() * 10 + 5) * 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.sky.removeChild(ufo);
                this.ufo = null;
                return;
            }
            
            // Linear horizontal movement
            const x = startX + (endX - startX) * progress;
            
            // Add slight vertical wobble
            const wobbleAmount = 20;
            const wobbleSpeed = 5;
            currentY += Math.sin(progress * Math.PI * wobbleSpeed) * wobbleAmount * (elapsed / duration);
            currentY = Math.max(minY, Math.min(maxY, currentY));
            
            ufo.style.transform = `translate(${x}px, ${currentY}px)`;
            requestAnimationFrame(animate);
        };
        
        this.sky.appendChild(ufo);
        this.ufo = ufo;
        requestAnimationFrame(animate);
    }

    startAnimation() {
        requestAnimationFrame(this.animateScene.bind(this));
    }
}

// Start the scene when the page loads
window.addEventListener('load', () => {
    new CityScene();
});
