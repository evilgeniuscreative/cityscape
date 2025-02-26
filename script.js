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
        this.topPadding = 20; // Distance from viewport top
        this.transitionDuration = 10; // seconds
        this.dayColor = '#87CEEB';    // Sky blue
        this.sunsetColor = '#FF7F50'; // Coral
        this.nightColor = '#1a1a2e';  // Dark blue
        this.lastTransitionTime = null;
        this.setupScene();
        this.setupControls();
        this.setupResizeHandler();
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
        this.createHouses();
        this.createStreetlamps();
        this.setupCelestialBodies();
        this.setupClouds();
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
        const cloudCount = Math.floor(Math.random() * 4) + 4; // 4-7 clouds
        for (let i = 0; i < cloudCount; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.style.left = `${Math.random() * 100}%`;
            cloud.style.top = `${Math.random() * 40}%`;
            cloud.style.width = `${Math.random() * 100 + 50}px`;
            cloud.style.height = `${Math.random() * 30 + 20}px`;
            this.sky.appendChild(cloud);
        }
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

        playPauseBtn.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
        });

        toggleClockBtn.addEventListener('click', () => {
            const digitalClock = document.getElementById('digital-clock');
            const analogClock = document.getElementById('analog-clock');
            const isDigital = digitalClock.classList.contains('active');

            digitalClock.classList.toggle('active');
            analogClock.classList.toggle('active');
            toggleClockBtn.textContent = isDigital ? 'Switch to Digital' : 'Switch to Analog';
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
        if (isDaytime) {
            // Calculate sun position using parabola equation: y = -a(x-h)² + k
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const sunX = -30 + (width + 60) * cycleProgress;
            
            const topMargin = 30; // Keep 30px from top
            const a = 2 * (height - topMargin) / (width * width); // Controls parabola width
            const h = width / 2;  // Peak is at center of screen
            const k = height - topMargin * 4; // Peak is 30px from top
            const normalizedX = sunX + 30;
            const sunY = -a * Math.pow(normalizedX - h, 2) + k;
            
            this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            this.sun.style.display = 'block';
            this.moon.style.display = 'none';
            
            this.sky.classList.remove('sky-day');
            this.sky.classList.add('sky-night');
            this.starContainer.style.display = 'none';
        } else {
            // Calculate moon position using same parabola
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
            
            this.sky.classList.remove('sky-night');
 
            this.sky.classList.remove('sky-night');
            this.sky.classList.add('sky-day');
            this.starContainer.style.display = 'block';
        }

        // Update clock
        const totalMinutes = isDaytime ? 
            Math.floor((cycleProgress * 720)) : // 0:00 to 12:00 during day
            Math.floor((cycleProgress * 720) + 720); // 12:00 to 24:00 during night
        this.updateClock(totalMinutes);

        // Update nighttime flag
        this.isDark = !isDaytime;

        // Animate UFO
        if (isNight && Math.random() < 0.001) {
            this.spawnUFO();
        }

        // Animate clouds
        document.querySelectorAll('.cloud').forEach((cloud, index) => {
            const left = parseFloat(cloud.style.left) || 0;
            cloud.style.left = `${(left + 0.1) % 120 - 20}%`;
        });

        requestAnimationFrame(this.animateScene.bind(this));
    }

    spawnUFO() {
        const ufo = document.getElementById('ufo');
        ufo.style.display = 'block';
        ufo.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
                <div style="position: absolute; top: 0; left: 10%; width: 80%; height: 20px; background: #1a1a2e; border-radius: 50%;"></div>
                <div style="position: absolute; top: 10px; left: 0; width: 100%; height: 30px; background: #4169E1; border-radius: 50%;"></div>
            </div>
        `;

        let position = 0;
        let verticalOffset = 0;

        const animateUFO = () => {
            position += 2;
            verticalOffset = Math.sin(position / 30) * -60;
            ufo.style.transform = `translate(${-position}px, ${verticalOffset}px)`;

            if (position < window.innerWidth + 80) {
                requestAnimationFrame(animateUFO);
            } else {
                ufo.style.display = 'none';
            }
        };

        animateUFO();
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
        requestAnimationFrame(this.animateScene.bind(this));
    }
}

// Start the scene when the page loads
window.addEventListener('load', () => {
    new CityScene();
});
