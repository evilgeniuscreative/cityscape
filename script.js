class CityScene {
    constructor() {
        this.isPlaying = true;
        this.isDark = false; // Track if it's nighttime
        this.dayDuration = 20000; // 20 seconds in milliseconds
        this.nightDuration = 20000; // 20 seconds in milliseconds
        this.totalCycleDuration = this.dayDuration + this.nightDuration;
        this.startTime = Date.now();
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.topPadding = 20;
        this.transitionDuration = 10;
        this.dayColor = 'skyblue';
        this.sunsetColor = 'linear-gradient(to right, #ffaf50 0%, #ff7e00 50%, #d9534f 100%)'; 
        this.nightColor = '#1a1a2e'; 
        this.lastTransitionTime = null;
        this.sky = document.getElementById('sky');
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');
        this.clock = document.getElementById('clock');
        this.starContainer = null;
        this.cityscape = document.getElementById('cityscape');
        this.clouds = [];
        this.minClouds = 4;
        this.cloudDirection = Math.random() < 0.5 ? 'left' : 'right';
        this.baseCloudSpeed = 40;
        
        this.setupScene();
        this.setupResizeHandler();
        this.animateScene();
    }

    setupScene() {
        this.createBuildings();
        this.createHouses();
        this.createStreetlamps();
        this.createStars();
        this.setupCelestialBodies();
        this.setupClouds();
        this.setupClock();
        this.setupControls();
    }

    createBuildings() {
        const buildingCount = Math.floor(window.innerWidth / 100);
        const spacing = window.innerWidth / buildingCount;
        
        for (let i = 0; i < buildingCount; i++) {
            const building = document.createElement('div');
            building.className = 'building';
            
            // Random height between 100 and 300 pixels
            const height = Math.random() * 200 + 100;
            building.style.height = `${height}px`;
            
            // Random width between 60 and 120 pixels
            const width = Math.random() * 60 + 60;
            building.style.width = `${width}px`;
            
            // Position building with spacing
            building.style.left = `${i * spacing}px`;
            
            // Add windows
            const windowRows = Math.floor(height / 30);
            const windowCols = Math.floor(width / 30);
            
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    const windowEl = document.createElement('div');
                    windowEl.className = 'window';
                    windowEl.style.top = `${row * 30 + 10}px`;
                    windowEl.style.left = `${col * 30 + 10}px`;
                    building.appendChild(windowEl);
                }
            }

            // Add street lamp
            const lamp = document.createElement('div');
            lamp.className = 'street-lamp';
            const lampLight = document.createElement('div');
            lampLight.className = 'lamp-light';
            lamp.appendChild(lampLight);
            building.appendChild(lamp);
            
            this.cityscape.appendChild(building);
        }
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

    createStars() {
        const starCount = 100;
        const starContainer = document.createElement('div');
        starContainer.id = 'stars';
        starContainer.style.position = 'absolute';
        starContainer.style.width = '100%';
        starContainer.style.height = '100%';
        starContainer.style.overflow = 'hidden';
        starContainer.style.display = 'none';
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Random position
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 40}%`; // Top 40% of sky
            
            // Random size (1-3px)
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // Random twinkle delay
            star.style.animationDelay = `${Math.random() * 2}s`;
            
            starContainer.appendChild(star);
        }
        
        this.sky.appendChild(starContainer);
        this.starContainer = starContainer;
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
        
        // Random cloud size
        const width = Math.random() * 100 + 100; // 100-200px
        const height = width * 0.6; // Maintain aspect ratio
        
        cloud.style.cssText = `
            position: absolute;
            width: ${width}px;
            height: ${height}px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50px;
            z-index: 2;
            filter: blur(3px);
        `;
        
        // Add cloud puffs
        for (let i = 0; i < 3; i++) {
            const puff = document.createElement('div');
            puff.style.cssText = `
                position: absolute;
                width: ${width * 0.6}px;
                height: ${height * 0.6}px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                top: ${height * 0.2}px;
                left: ${width * 0.2 * i}px;
            `;
            cloud.appendChild(puff);
        }
        
        // Set initial position
        const y = Math.random() * (window.innerHeight * 0.3); // Top 30% of screen
        let startX;
        
        if (isInitial) {
            // Place randomly across screen for initial clouds
            startX = Math.random() * window.innerWidth;
        } else {
            // Start from appropriate edge based on direction
            startX = this.cloudDirection === 'left' ? window.innerWidth + width : -width;
        }
        
        cloud.style.transform = `translate(${startX}px, ${y}px)`;
        
        // Random speed variation (±25% of base speed)
        const speedVariation = 1 + (Math.random() * 0.5 - 0.25); // 0.75 to 1.25
        const speed = this.baseCloudSpeed * speedVariation;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / (speed * 1000);
            
            if (progress >= 1) {
                this.sky.removeChild(cloud);
                const index = this.clouds.indexOf(cloud);
                if (index > -1) {
                    this.clouds.splice(index, 1);
                }
                // Create a new cloud if below minimum
                if (this.clouds.length < this.minClouds) {
                    this.createCloud(false);
                }
                return;
            }
            
            // Calculate position based on direction
            const distance = window.innerWidth + width * 2;
            const x = this.cloudDirection === 'left' 
                ? startX - (distance * progress)
                : startX + (distance * progress);
            
            cloud.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(animate);
        };
        
        this.sky.appendChild(cloud);
        this.clouds.push(cloud);
        requestAnimationFrame(animate);
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
            this.isPlaying = !this.isPlaying;
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

    updateClock(time) {
        const hours = Math.floor(time / 60);
        const minutes = Math.floor(time % 60);
        
        // Update digital clock with 24-hour format
        this.digitalClock.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        // Update analog clock (convert 24h to 12h for analog display)
        const analogHours = hours % 12 || 12;
        const hourAngle = (analogHours + minutes / 60) * 30;
        const minuteAngle = minutes * 6;
        
        this.hourHand.style.transform = `rotate(${hourAngle}deg)`;
        this.minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    }

    animateScene() {
        if (!this.isPlaying) return;

        const currentTime = Date.now();
        const elapsed = (currentTime - this.startTime) % this.totalCycleDuration;
        const isDaytime = elapsed < this.dayDuration;
        const cycleProgress = isDaytime ? 
            elapsed / this.dayDuration : 
            (elapsed - this.dayDuration) / this.nightDuration;

        // Ensure minimum number of clouds
        while (this.clouds.length <= this.minClouds) {
            this.createCloud(false);
        }

        // Update celestial bodies and sky
        if (isDaytime) { // DAY TIME
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const sunX = -30 + (width + 60) * cycleProgress;
            
            const topMargin = 30;
            const a = 2 * (height - topMargin) / (width * width);
            const h = width / 2;
            const k = height - topMargin * 4;
            const normalizedX = sunX + 30;
            const sunY = -a * Math.pow(normalizedX - h, 2) + k;
            
            this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            this.sun.style.display = 'block';
            this.moon.style.display = 'none';
            
            // During day, show day sky
            if (!this.sky.classList.contains('sky-day')) {
                this.sky.classList.remove('sky-night');
                this.sky.classList.add('sky-day');
            }
            this.starContainer.style.display = 'none';

            // Turn off street lamps during day
            document.querySelectorAll('.lamp-light').forEach(light => {
                light.style.boxShadow = 'none';
                light.style.backgroundColor = '#444';
            });

        } else { // NIGHT TIME
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const moonX = -30 + (width + 60) * cycleProgress;
            
            const topMargin = 30;
            const a = 2 * (height - topMargin) / (width * width);
            const h = width / 2;
            const k = height - topMargin * 4;
            const normalizedX = moonX + 30;
            const moonY = -a * Math.pow(normalizedX - h, 2) + k;
            
            this.moon.style.transform = `translate(${moonX}px, ${-moonY}px)`;
            this.moon.style.display = 'block';
            this.sun.style.display = 'none';
            
            // During night, show night sky
            if (!this.sky.classList.contains('sky-night')) {
                this.sky.classList.remove('sky-day');
                this.sky.classList.add('sky-night');
            }
            this.starContainer.style.display = 'block';

            // Turn on street lamps at night
            document.querySelectorAll('.lamp-light').forEach(light => {
                light.style.boxShadow = '0 0 20px 10px rgba(255, 244, 180, 0.8)';
                light.style.backgroundColor = '#fff4b4';
            });
        }

        // Update clock
        const totalMinutes = isDaytime ? 
            Math.floor((cycleProgress * 720)) : 
            Math.floor((cycleProgress * 720) + 720);
        this.updateClock(totalMinutes);

        // Update nighttime flag
        this.isDark = !isDaytime;

        // Random UFO appearance during night
        if (this.isDark && Math.random() < 0.001) {
            this.spawnUFO();
        }

        requestAnimationFrame(this.animateScene.bind(this));
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
