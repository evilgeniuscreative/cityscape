class CityScene {
    constructor() {
        this.isPlaying = true;
        this.isDark = false; // Track if it's nighttime
        this.dayDuration = 30000; // 30 seconds in milliseconds
        this.nightDuration = 30000; // 30 seconds in milliseconds
        this.totalCycleDuration = this.dayDuration + this.nightDuration;
        this.startTime = Date.now();
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.topPadding = 20;
        this.transitionDuration = 10;
        this.dayColor = '#87CEEB';    // Sky blue
        this.sunsetColor = 'linear-gradient(to right, #ffaf50 0%, #ff7e00 50%, #d9534f 100%)'; 
        this.nightColor = '#1a1a2e';  // Dark blue
        this.lastTransitionTime = null;
        this.sky = document.getElementById('sky');
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');
        this.clock = document.getElementById('clock');
        this.stars = Array.from(document.getElementsByClassName('star'));
        this.cityscape = document.getElementById('cityscape');
        this.setupScene();
        this.setupResizeHandler();
        this.startAnimation();
    }

    setupScene() {
        this.createBuildings();
        this.createHouses();
        this.createStreetlamps();
        this.createStars();
        this.createClouds();
        this.setupCelestialBodies();
        this.setupClock();
        this.setupControls();
    }

    createBuildings() {
        const buildingCount = Math.floor(Math.random() * 5) + 8; // 8-12 buildings
        const containerWidth = window.innerWidth;
        const spacing = containerWidth / buildingCount;

        for (let i = 0; i < buildingCount; i++) {
            const height = Math.random() * 300 + 150;
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
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 60}%`;
            this.sky.appendChild(star);
        }
    }

    createClouds() {
        this.minClouds = 6;
        this.maxClouds = 12;
        this.clouds = new Set(); // Track active clouds
        
        // Initial cloud placement
        const initialCount = Math.floor(Math.random() * (this.maxClouds - this.minClouds + 1)) + this.minClouds;
        const screenSegments = initialCount + 1;
        
        for (let i = 0; i < initialCount; i++) {
            this.createCloudGroup(true, i, screenSegments);
        }

        // Continuously monitor and maintain cloud count
        setInterval(() => {
            this.maintainCloudCount();
        }, 1000); // Check every second
    }

    maintainCloudCount() {
        // Remove any finished clouds from tracking
        for (const cloud of this.clouds) {
            if (!document.body.contains(cloud)) {
                this.clouds.delete(cloud);
            }
        }

        // Add new clouds if below minimum
        while (this.clouds.size < this.minClouds) {
            this.createCloudGroup(false);
        }

        // Randomly add more clouds if below max
        if (this.clouds.size < this.maxClouds && Math.random() < 0.3) {
            this.createCloudGroup(false);
        }
    }

    createCloudGroup(isInitial, index = 0, totalSegments = 1) {
        const cloudContainer = document.createElement('div');
        cloudContainer.style = "left:110%";
        cloudContainer.className = 'cloud-container';
        
        // All clouds get random duration
        const duration = 60 * (0.8 + Math.random() * 0.4); // 48-72 seconds (±20%)
        
        if (isInitial) {
            // Initial placement: distribute across screen
            const segmentWidth = 100 / totalSegments;
            const basePosition = segmentWidth * (index + 0.5);
            const randomOffset = (Math.random() - 0.5) * segmentWidth * 0.8;
            const startPosition = basePosition + randomOffset;
            
            // Calculate remaining animation time based on position
            const remainingDistance = 120 + startPosition; // Distance to travel (including offscreen)
            const remainingDuration = (remainingDistance / 120) * duration;
            
            cloudContainer.style.animation = `float ${remainingDuration}s linear`;
            cloudContainer.style.left = `${startPosition}%`;
        } else {
            // New clouds: start from right edge and animate left
            cloudContainer.style.animation = `float ${duration}s linear`;
        }
        
        // Random height within top portion of sky
        cloudContainer.style.top = `${Math.random() * 35}%`;
        
        // Create 2-4 pieces for each cloud
        const pieces = Math.floor(Math.random() * 3) + 2;
        const baseWidth = Math.random() * 100 + 50;
        const baseHeight = Math.random() * 30 + 20;
        
        for (let j = 0; j < pieces; j++) {
            const cloudPiece = document.createElement('div');
            cloudPiece.className = 'cloud';
            
            const widthVariation = baseWidth * (0.6 + Math.random() * 0.8);
            const heightVariation = baseHeight * (0.6 + Math.random() * 0.8);
            
            const xOffset = j * (baseWidth * 0.3) - (baseWidth * 0.3);
            const yOffset = (Math.random() - 0.5) * 20;
            
            cloudPiece.style.width = `${widthVariation}px`;
            cloudPiece.style.height = `${heightVariation}px`;
            cloudPiece.style.left = `${xOffset}px`;
            cloudPiece.style.top = `${yOffset}px`;
            cloudPiece.style.position = 'absolute';
            cloudPiece.style.borderRadius = '20px';
            
            cloudContainer.appendChild(cloudPiece);
        }

        // Track cloud and handle removal
        this.clouds.add(cloudContainer);
        cloudContainer.addEventListener('animationend', () => {
            this.clouds.delete(cloudContainer);
            cloudContainer.remove();
        });
        
        this.sky.appendChild(cloudContainer);
    }

    setupCelestialBodies() {
        this.sun.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
                <div style="position: absolute; left: 15px; top: 20px; width: 8px; height: 8px; background: black; border-radius: 50%;"></div>
                <div style="position: absolute; right: 15px; top: 20px; width: 8px; height: 8px; background: black; border-radius: 50%;"></div>
                <div style="position: absolute; left: 50%; top: 35px; width: 10px; height: 10px; background: black; border-radius: 50%; transform: translateX(-50%);"></div>
            </div>`;
        
        this.sun.style.width = '60px';
        this.sun.style.height = '60px';
        this.sun.style.background = '#FFD700';
        this.sun.style.borderRadius = '50%';
        this.sun.style.position = 'absolute';
        this.sun.style.zIndex = '2';
        
        this.moon.style.width = '60px';
        this.moon.style.height = '60px';
        this.moon.style.background = '#F5F5F5';
        this.moon.style.borderRadius = '50%';
        this.moon.style.position = 'absolute';
        this.moon.style.zIndex = '2';
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

        // Update celestial bodies
        if (isDaytime) {
            // Calculate sun position using parabola equation: y = -a(x-h)² + k
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // x position: map progress (0-1) to screen width plus offscreen padding
            const sunX = -30 + (width + 60) * cycleProgress;
            
            // Calculate y position using parabola
            const a = 4 * (height - 20) / (width * width); // Controls parabola width
            const h = width / 2;  // Peak is at center of screen
            const k = height - 20; // Peak is 20px from top
            const normalizedX = sunX + 30; // Adjust x to account for initial offset
            const sunY = -a * Math.pow(normalizedX - h, 2) + k;
            
            this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            this.sun.style.display = 'block';
            this.moon.style.display = 'none';
        } else {
            // Calculate moon position using same parabola
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const moonX = -30 + (width + 60) * cycleProgress;
            
            const a = 4 * (height - 20) / (width * width);
            const h = width / 2;
            const k = height - 20;
            const normalizedX = moonX + 30;
            const moonY = -a * Math.pow(normalizedX - h, 2) + k;
            
            this.moon.style.transform = `translate(${moonX}px, ${-moonY}px)`;
            this.moon.style.display = 'block';
            this.sun.style.display = 'none';
        }

        // Update sky color
        const skyHue = isDaytime ? 
            this.interpolateColor('#87CEEB', '#FF8C00', cycleProgress) : // Day to sunset
            this.interpolateColor('#000033', '#000033', cycleProgress);  // Night stays dark blue

        this.sky.style.backgroundColor = skyHue;

        // Update stars
        this.stars.forEach(star => {
            star.style.display = isDaytime ? 'none' : 'block';
        });

        // Update clock
        const totalMinutes = isDaytime ? 
            Math.floor((cycleProgress * 720)) : // 0:00 to 12:00 during day
            Math.floor((cycleProgress * 720) + 720); // 12:00 to 24:00 during night
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
        if (!this.isDark) return; // Only spawn at night
        
        const ufo = document.getElementById('ufo');
        if (!ufo || ufo.style.display === 'block') return;

        // Randomly choose direction (left-to-right or right-to-left)
        const goingRight = Math.random() < 0.5;
        
        ufo.style.display = 'block';
        ufo.innerHTML = `
            <div style="
                position: relative;
                width: 120px;
                height: 50px;
            ">
                <!-- Glass dome -->
                <div style="
                    position: absolute;
                    top: -25px;
                    left: 35px;
                    width: 50px;
                    height: 25px;
                    background: linear-gradient(to bottom, 
                        rgba(173, 216, 230, 0.9) 0%,
                        rgba(173, 216, 230, 0.7) 50%,
                        rgba(173, 216, 230, 0.4) 100%);
                    border-radius: 25px 25px 0 0;
                    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.8);
                "></div>
                <!-- Saucer body -->
                <div style="
                    position: absolute;
                    top: 0;
                    width: 120px;
                    height: 20px;
                    background: linear-gradient(to bottom, #DDD 0%, #999 100%);
                    border-radius: 60px 60px 0 0;
                "></div>
                <!-- Bottom section -->
                <div style="
                    position: absolute;
                    top: 20px;
                    width: 120px;
                    height: 15px;
                    background: linear-gradient(to bottom, #999 0%, #666 100%);
                    border-radius: 0 0 60px 60px;
                "></div>
                <!-- Bottom lights -->
                ${Array.from({length: 5}, (_, i) => `
                    <div style="
                        position: absolute;
                        bottom: 5px;
                        left: ${15 + i * 22}px;
                        width: 8px;
                        height: 8px;
                        background: rgba(255, 255, 100, 0.8);
                        border-radius: 50%;
                        box-shadow: 0 0 5px rgba(255, 255, 100, 0.8);
                    "></div>
                `).join('')}
            </div>`;

        // Initial position
        const startX = goingRight ? -120 : window.innerWidth + 120;
        const startY = Math.random() * (window.innerHeight * 0.4 - 75) + 20; // Top 40% of screen
        ufo.style.transform = `translate(${startX}px, ${startY}px)`;
        
        // Random speed (±50% variation)
        const baseDuration = 8; // base seconds to cross screen
        const duration = baseDuration * (0.5 + Math.random()); // 4-12 seconds
        
        let currentY = startY;
        let lastMoveTime = 0;
        
        const animate = (currentTime) => {
            if (!document.body.contains(ufo)) return;
            
            const progress = (currentTime - startTime) / (duration * 1000);
            if (progress >= 1) {
                ufo.style.display = 'none';
                return;
            }
            
            // Random vertical movement (max once per second)
            if (currentTime - lastMoveTime > 1000) { // 1 second cooldown
                if (Math.random() < 0.3) { // 30% chance to move
                    const moveAmount = (Math.random() - 0.5) * 75 * 2; // -75 to +75px
                    currentY = Math.max(20, Math.min(window.innerHeight * 0.4 - 75, currentY + moveAmount));
                    lastMoveTime = currentTime;
                }
            }
            
            const x = goingRight ? 
                startX + (window.innerWidth + 240) * progress :
                startX - (window.innerWidth + 240) * progress;
                
            ufo.style.transform = `translate(${x}px, ${currentY}px)`;
            requestAnimationFrame(animate);
        };
        
        const startTime = performance.now();
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
