class CityScene {
    constructor() {
        this.isPlaying = true;
        this.isDay = true;
        this.dayDuration = 30000; // 30 seconds in milliseconds
        this.nightDuration = 30000; // 30 seconds in milliseconds
        this.totalCycleDuration = this.dayDuration + this.nightDuration;
        this.lastTimestamp = 0;
        this.cycleStartTime = 0;
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.topPadding = 20;
        this.transitionDuration = 10;
        this.dayColor = '#87CEEB';    // Sky blue
        this.sunsetColor = 'linear-gradient(to right, #ffaf50 0%, #ff7e00 50%, #d9534f 100%)'; 
        this.nightColor = '#1a1a2e';  // Dark blue
        this.lastTransitionTime = null;
        this.setupScene();
        this.setupResizeHandler();
        this.startAnimation();
    }

    setupScene() {
        this.cityscape = document.getElementById('cityscape');
        this.sky = document.getElementById('sky');
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
        this.sun = document.getElementById('sun');
        this.moon = document.getElementById('moon');

        // Add sun face
        this.sun.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
                <div style="position: absolute; left: 15px; top: 20px; width: 8px; height: 8px; background: black; border-radius: 50%;"></div>
                <div style="position: absolute; right: 15px; top: 20px; width: 8px; height: 8px; background: black; border-radius: 50%;"></div>
                <div style="position: absolute; left: 50%; transform: translateX(-50%); top: 35px; width: 20px; height: 10px; border: 2px solid black; border-radius: 0 0 10px 10px; border-top: none;"></div>
            </div>
        `;

        // Generate moon craters with proper spacing
        const moonSize = 50; // Match the moon's CSS size
        const padding = 5;   // Minimum distance from edges
        const minCraterSize = 4;
        const maxCraterSize = 8;
        const minDistance = 2; // Minimum distance between craters
        const maxAttempts = 50; // Maximum attempts to place a crater
        const craters = [];
        
        // Try to place 7 craters
        for (let i = 0; i < 7; i++) {
            let attempts = 0;
            let validPosition = false;
            let crater;
            
            while (!validPosition && attempts < maxAttempts) {
                const size = Math.random() * (maxCraterSize - minCraterSize) + minCraterSize;
                // Calculate position within the moon's actual dimensions
                const x = Math.random() * (moonSize - size);
                const y = Math.random() * (moonSize - size);
                
                crater = {
                    size,
                    x,
                    y
                };
                
                // Check if this position overlaps with any existing craters
                validPosition = true;
                for (const existing of craters) {
                    const distance = Math.sqrt(
                        Math.pow(crater.x - existing.x, 2) + 
                        Math.pow(crater.y - existing.y, 2)
                    );
                    const minRequiredDistance = (crater.size + existing.size) / 2 + minDistance;
                    
                    if (distance < minRequiredDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (validPosition) {
                craters.push(crater);
            }
        }

        // Render the craters
        this.moon.innerHTML = craters.map(crater => 
            `<div style="
                position: absolute;
                left: ${crater.x}px;
                top: ${crater.y}px;
                width: ${crater.size}px;
                height: ${crater.size}px;
                border: 2px solid #999;
                border-radius: 50%;
                box-sizing: border-box;
            "></div>`
        ).join('');

        // Set initial positions
        this.sun.style.left = '0';
        this.sun.style.bottom = '0';
        this.sun.style.display = 'block';
        
        this.moon.style.left = '0';
        this.moon.style.bottom = '0';
        this.moon.style.display = 'none';
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

    animateScene(timestamp) {
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            this.cycleStartTime = timestamp;
        }

        if (this.isPlaying) {
            const elapsed = (timestamp - this.cycleStartTime) % this.totalCycleDuration;
            const isDaytime = elapsed < this.dayDuration;
            
            // Calculate progress through current phase (day or night)
            const progress = isDaytime ? 
                (elapsed / this.dayDuration) : 
                ((elapsed - this.dayDuration) / this.nightDuration);

            // Update celestial bodies
            if (isDaytime) {
                // Sun movement during day
                const sunX = progress * (window.innerWidth + 120) - 60;
                const sunY = Math.sin(progress * Math.PI) * (window.innerHeight * 0.8);
                this.sun.style.display = 'block';
                this.moon.style.display = 'none';
                this.sun.style.transform = `translate(${sunX}px, ${-sunY}px)`;
            } else {
                // Moon movement during night
                const moonX = progress * (window.innerWidth + 100) - 50;
                const moonY = Math.sin(progress * Math.PI) * (window.innerHeight * 0.8);
                this.sun.style.display = 'none';
                this.moon.style.display = 'block';
                this.moon.style.transform = `translate(${moonX}px, ${-moonY}px)`;
            }

            // Update sky color
            const sceneContainer = document.getElementById('scene-container');
            if (isDaytime) {
                if (progress < 0.2) {
                    // Sunrise transition
                    sceneContainer.style.backgroundColor = this.interpolateColor(this.nightColor, this.dayColor, progress * 5);
                } else if (progress > 0.8) {
                    // Sunset transition
                    sceneContainer.style.backgroundColor = this.interpolateColor(this.dayColor, this.sunsetColor, (progress - 0.8) * 5);
                } else {
                    sceneContainer.style.backgroundColor = this.dayColor;
                }
            } else {
                if (progress < 0.2) {
                    // Night transition
                    sceneContainer.style.backgroundColor = this.interpolateColor(this.sunsetColor, this.nightColor, progress * 5);
                } else {
                    sceneContainer.style.backgroundColor = this.nightColor;
                }
            }

            // Update clock
            const totalMinutes = isDaytime ? 
                Math.floor((progress * 720)) : // 0:00 to 12:00 during day
                Math.floor((progress * 720) + 720); // 12:00 to 24:00 during night
            this.updateClock(totalMinutes);

            // Animate streetlamps
            document.querySelectorAll('.lamp-light').forEach(light => {
                light.classList.toggle('lamp-night', !isDaytime);
            });

            // Animate stars
            document.querySelectorAll('.star').forEach(star => {
                star.style.display = isDaytime ? 'none' : 'block';
            });

            // Random UFO appearance during night
            if (!isDaytime && Math.random() < 0.001) {
                this.spawnUFO();
            }
        }

        this.lastTimestamp = timestamp;
        requestAnimationFrame(this.animateScene.bind(this));
    }

    spawnUFO() {
        const ufo = document.getElementById('ufo');
        if (!ufo || ufo.style.display === 'block') return;

        ufo.style.display = 'block';
        ufo.innerHTML = `
            <div style="
                position: absolute;
                width: 100%;
                height: 20px;
                background: radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(173,216,230,0.4) 70%, transparent 100%);
                top: -10px;
                border-radius: 50%;
            "></div>
            <div style="
                width: 80px;
                height: 20px;
                background: linear-gradient(to bottom, #a3a3a3, #808080);
                border-radius: 40px;
                position: relative;
            "></div>`;

        // Start at right edge
        const startX = window.innerWidth + 80;
        // Random starting Y position (20px from top to 60% of screen height)
        const startY = Math.random() * (window.innerHeight * 0.6 - 40) + 20;
        
        ufo.style.transform = `translate(${startX}px, ${startY}px)`;
        
        // Generate random waypoints for the UFO to follow
        const waypoints = [];
        const numWaypoints = Math.floor(Math.random() * 5) + 5; // 5-9 waypoints
        
        for (let i = 0; i < numWaypoints; i++) {
            const x = startX - ((i + 1) * (window.innerWidth + 160) / numWaypoints);
            const y = Math.random() * (window.innerHeight * 0.6 - 40) + 20; // Keep 20px from top
            waypoints.push({ x, y });
        }

        this.animateUFO(ufo, waypoints, 0);
    }

    animateUFO(ufo, waypoints, currentIndex) {
        if (currentIndex >= waypoints.length) {
            ufo.style.display = 'none';
            return;
        }

        const target = waypoints[currentIndex];
        const duration = 1000; // Time to reach next waypoint

        const start = {
            x: parseFloat(ufo.style.transform.split('translate(')[1]),
            y: parseFloat(ufo.style.transform.split(',')[1])
        };

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth easing
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const currentX = start.x + (target.x - start.x) * easeProgress;
            const currentY = start.y + (target.y - start.y) * easeProgress;

            ufo.style.transform = `translate(${currentX}px, ${currentY}px)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (currentIndex < waypoints.length - 1) {
                this.animateUFO(ufo, waypoints, currentIndex + 1);
            } else {
                ufo.style.display = 'none';
            }
        };

        requestAnimationFrame(animate);
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
