class CityScene {
    constructor() {
        this.sceneContainer = document.getElementById('scene-container');
        this.isPlaying = false;
        this.isDark = false;
        this.dayDuration = 20000;    // 20 seconds for day
        this.nightDuration = 20000;  // 20 seconds for night
        this.totalCycleDuration = this.dayDuration + this.nightDuration;
        this.startTime = Date.now();
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.topPadding = 20;
        this.dayColor = '#87CEEB';
        this.sunsetColor = '#FF7F50';
        this.nightColor = '#1a1a2e';
        this.lastTransitionTime = null;
        this.clouds = [];
        this.minClouds = 3;
        
        // Get DOM elements
        this.cityscape = document.getElementById('cityscape');
        this.sky = document.getElementById('sky');
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');
        this.starContainer = document.getElementById('stars');
        this.digitalClock = document.getElementById('digital-clock');
        this.analogClock = document.querySelector('.analog-clock');
        
        // Initialize scene state
        this.sceneContainer.classList.add('scene-day');
        this.digitalClock.classList.add('active');
        
        this.setupScene();
        this.startAnimation();
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
        this.createClouds();
        this.createHouses();
        this.createStreetlamps();
        this.setupCelestialBodies();
        this.setupClock();
        this.setupControls();
    }

    createBuildings() {
        const buildingCount = Math.floor(Math.random() * 8) + 8; // 8-12 buildings
        const containerWidth = window.innerWidth;
        const spacing = containerWidth / buildingCount;

        for (let i = 0; i < buildingCount; i++) {
            const height = Math.random() * 600 + 50;
            const width = Math.random() * 50 + 100;
            
            const building = document.createElement('div');
            building.className = 'building';

            building.style.left = `${i * spacing}px`;
            building.style.width = `${width}px`;
            building.style.height = `${height}px`;

            // Add windows
            const windowsHorizontal = Math.floor((width - 12) / 31); // 31 = window width + spacing
            const windowsVertical = Math.floor((height - 12) / 46); // 46 = window height + spacing

            for (let row = 0; row < windowsVertical; row++) {
                for (let col = 0; col < windowsHorizontal; col++) {
                    const window = document.createElement('div');
                    window.className = 'window';
                    building.appendChild(window);
                }
            }

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

    createStars() {
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 60}%`;
            this.sky.appendChild(star);
        }
    }

    createClouds() {
        const cloudCount = Math.floor(Math.random() * 3) + 3; // 3-5 clouds
        for (let i = 0; i < cloudCount; i++) {
            this.createCloud(true);
        }
    }

    createCloud(randomPosition = false) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        // Random cloud dimensions
        const width = Math.random() * 100 + 80;
        const height = width * 0.6;
        cloud.style.width = `${width}px`;
        cloud.style.height = `${height}px`;
        
        // Random vertical position
        const maxTop = Math.min(window.innerHeight * 0.4, 300);
        const top = Math.random() * maxTop;
        cloud.style.top = `${top}px`;
        
        // Horizontal position
        if (randomPosition) {
            cloud.style.left = `${Math.random() * 100}%`;
        } else {
            cloud.style.left = '100%';
        }
        
        // Add to scene and track
        this.clouds.push(cloud);
        document.getElementById('clouds').appendChild(cloud);
        
        return cloud;
    }

    setupCelestialBodies() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Calculate initial positions based on current time
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        
        // Calculate progress through day/night cycle
        const dayStart = 6 * 60;  // 6:00 AM
        const nightStart = 18 * 60;  // 6:00 PM
        
        let progress;
        let isDaytime = false;
        
        if (totalMinutes >= dayStart && totalMinutes < nightStart) {
            // Daytime
            progress = (totalMinutes - dayStart) / (nightStart - dayStart);
            isDaytime = true;
        } else {
            // Nighttime
            if (totalMinutes >= nightStart) {
                progress = (totalMinutes - nightStart) / (24 * 60 - nightStart + dayStart);
            } else {
                progress = (totalMinutes + 24 * 60 - nightStart) / (24 * 60 - nightStart + dayStart);
            }
        }
        
        // Set initial positions
        const totalWidth = width + 600;
        const h = width / 2;
        const k = height * 0.8;
        const a = 0.8 / (totalWidth * 0.7);

        if (isDaytime) {
            const sunX = -300 + totalWidth * progress;
            const sunY = -a * Math.pow(sunX - h, 2) + k;
            this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            this.sun.style.display = 'block';
            this.moon.style.display = 'none';
            document.querySelector('.sky-layer.night').classList.add('hidden');
            document.querySelector('.sky-layer.day').classList.remove('hidden');
        } else {
            const moonX = -300 + totalWidth * progress;
            const moonY = -a * Math.pow(moonX - h, 2) + k;
            this.moon.style.transform = `translate(${moonX}px, ${-moonY}px)`;
            this.moon.style.display = 'block';
            this.sun.style.display = 'none';
            document.querySelector('.sky-layer.night').classList.remove('hidden');
            document.querySelector('.sky-layer.day').classList.add('hidden');
        }
        
        // Set initial sky state
        if (isDaytime) {
            this.sky.classList.remove('sky-night');
            this.sky.classList.add('sky-day');
            if (this.starContainer) {
                this.starContainer.style.display = 'none';
            }
        } else {
            this.sky.classList.remove('sky-day');
            this.sky.classList.add('sky-night');
            if (this.starContainer) {
                this.starContainer.style.display = 'block';
            }
        }
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

        playPauseBtn.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
            if (this.isPlaying) {
                this.startTime = Date.now() - (this.totalCycleDuration * (this.isDark ? 0.5 : 0));
                requestAnimationFrame(this.animateScene.bind(this));
            }
        });

        toggleClockBtn.addEventListener('click', () => {
            this.digitalClock.classList.toggle('active');
            this.analogClock.classList.toggle('active');
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
            // Recalculate positions immediately on resize
            if (this.sun && this.moon) {
                const simulatedMinutes = this.getCurrentSimulatedMinutes();
                this.updateCelestialPositions(simulatedMinutes);
            }
        });
    }

    updateClock(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        // Update digital clock
        const digitalClock = document.getElementById('digital-clock');
        if (digitalClock) {
            digitalClock.textContent = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
        }

        // Update analog clock
        const hourHand = document.querySelector('.hour-hand');
        const minuteHand = document.querySelector('.minute-hand');
        
        if (hourHand && minuteHand) {
            const hourAngle = ((hours % 12) * 30) + (mins * 0.5);
            const minuteAngle = mins * 6;
            
            hourHand.style.transform = `rotate(${hourAngle}deg)`;
            minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        }
    }

    animateScene() {
        if (!this.isPlaying) return;

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const totalMinutes = hours * 60 + minutes + seconds / 60;
        
        // Calculate day/night cycle
        const dayStart = 6 * 60;  // 6:00 AM
        const nightStart = 18 * 60;  // 6:00 PM
        
        let progress;
        let isDaytime = false;
        
        if (totalMinutes >= dayStart && totalMinutes < nightStart) {
            // Daytime
            progress = (totalMinutes - dayStart) / (nightStart - dayStart);
            isDaytime = true;
        } else {
            // Nighttime
            if (totalMinutes >= nightStart) {
                progress = (totalMinutes - nightStart) / (24 * 60 - nightStart + dayStart);
            } else {
                progress = (totalMinutes + 24 * 60 - nightStart) / (24 * 60 - nightStart + dayStart);
            }
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Calculate arc parameters
        const totalWidth = width + 600;
        const h = width / 2;
        const k = height * 0.8;
        const a = 0.8 / (totalWidth * 0.7);

        if (isDaytime) {
            const sunX = -300 + totalWidth * progress;
            const sunY = -a * Math.pow(sunX - h, 2) + k;
            
            this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            this.sun.style.display = 'block';
            this.moon.style.display = 'none';
            
            document.querySelector('.sky-layer.night').classList.add('hidden');
            document.querySelector('.sky-layer.day').classList.remove('hidden');
            if (this.starContainer) {
                this.starContainer.style.display = 'none';
            }
        } else {
            const moonX = -300 + totalWidth * progress;
            const moonY = -a * Math.pow(moonX - h, 2) + k;
            
            this.moon.style.transform = `translate(${moonX}px, ${-moonY}px)`;
            this.moon.style.display = 'block';
            this.sun.style.display = 'none';
            
            document.querySelector('.sky-layer.night').classList.remove('hidden');
            document.querySelector('.sky-layer.day').classList.add('hidden');
            if (this.starContainer) {
                this.starContainer.style.display = 'block';
            }
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

    startAnimation() {
        // Start with proper timing based on current time of day
        const now = new Date();
        const currentHour = now.getHours();
        const isDayTime = currentHour >= 6 && currentHour < 18;
        
        if (!isDayTime) {
            this.startTime = Date.now() - this.dayDuration;
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
