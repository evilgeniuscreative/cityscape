class CityScene {
    constructor() {
        this.isPlaying = true;
        this.isDay = true;
        this.timeScale = 360; // 1 real minute = 6 hours (360 minutes)
        this.sunriseTime = 300;  // 5:00
        this.sunPeakTime = 720;  // 12:00
        this.sunsetTime = 1170;  // 19:30
        this.moonPeakTime = 1380; // 23:00
        this.moonsetTime = 280;  // 4:40
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

    calculateProgress(currentTime, startTime, peakTime, endTime, crossesMidnight = false) {
        if (crossesMidnight && currentTime < startTime) {
            currentTime += 1440; // Add 24 hours in minutes
        }
        
        const beforePeak = currentTime <= peakTime;
        const totalDuration = endTime - startTime;
        const halfDuration = totalDuration / 2;
        
        if (beforePeak) {
            return (currentTime - startTime) / (peakTime - startTime) * 0.5;
        } else {
            return 0.5 + (currentTime - peakTime) / (endTime - peakTime) * 0.5;
        }
    }

    calculateParabolicPosition(progress, elementHeight) {
        // Calculate parabola parameters based on screen dimensions
        const h = this.screenWidth / 2;
        
        // Adjust k to account for element height to ensure top edge is 20px from viewport top
        const k = this.screenHeight - this.topPadding - elementHeight;
        
        // Adjust 'a' based on screen dimensions to maintain proper arc
        const a = k / (this.screenWidth * this.screenWidth / 4);
        
        const x = progress * this.screenWidth;
        const y = -a * Math.pow(x - h, 2) + k;
        
        return { x, y };
    }

    getCurrentSimulatedMinutes() {
        if (!this.startTime) return 0;
        const progress = ((Date.now() - this.startTime) / 1000) % 120 / 60;
        return (progress * 720) % 1440;
    }

    updateCelestialPositions(simulatedMinutes) {
        const isNightTransition = simulatedMinutes >= this.sunsetTime || simulatedMinutes < this.moonsetTime;
        
        // Get element heights
        const sunHeight = this.sun.offsetHeight;
        const moonHeight = this.moon.offsetHeight;

        let sunProgress, moonProgress;
        
        // Calculate progress for sun and moon
        if (simulatedMinutes >= this.sunriseTime && simulatedMinutes <= this.sunsetTime) {
            sunProgress = this.calculateProgress(
                simulatedMinutes,
                this.sunriseTime,
                this.sunPeakTime,
                this.sunsetTime
            );
        } else {
            sunProgress = simulatedMinutes < this.sunriseTime ? 0 : 1;
        }

        if (simulatedMinutes >= this.sunsetTime || simulatedMinutes <= this.moonsetTime) {
            let adjustedTime = simulatedMinutes;
            if (simulatedMinutes < this.moonsetTime) {
                adjustedTime += 1440;
            }
            
            moonProgress = this.calculateProgress(
                adjustedTime,
                this.sunsetTime,
                this.moonPeakTime,
                this.moonsetTime + 1440,
                true
            );
        } else {
            moonProgress = simulatedMinutes < this.sunsetTime ? 0 : 1;
        }

        // Update positions
        if (!isNightTransition) {
            this.sun.style.display = 'block';
            this.moon.style.display = 'none';
            
            const { x, y } = this.calculateParabolicPosition(sunProgress, sunHeight);
            this.sun.style.transform = `translate(${x}px, ${-y}px)`;
            
            if (sunProgress > 0.9) {
                this.moon.style.transform = 'translate(0, 0)';
            }
        } else {
            this.sun.style.display = 'none';
            this.moon.style.display = 'block';
            
            const { x, y } = this.calculateParabolicPosition(moonProgress, moonHeight);
            this.moon.style.transform = `translate(${x}px, ${-y}px)`;
            
            if (moonProgress > 0.9) {
                this.sun.style.transform = 'translate(0, 0)';
            }
        }
    }

    updateSkyColor(simulatedMinutes, timestamp) {
        const container = document.getElementById('scene-container');
        const currentTime = timestamp / 1000; // Convert to seconds

        // Check if we're at sunrise or sunset
        const isAtSunrise = simulatedMinutes >= this.sunriseTime && simulatedMinutes <= this.sunriseTime + 1;
        const isAtSunset = simulatedMinutes >= this.sunsetTime && simulatedMinutes <= this.sunsetTime + 1;

        // Start transition if we just hit sunrise or sunset
        if ((isAtSunrise || isAtSunset) && !this.lastTransitionTime) {
            this.lastTransitionTime = currentTime;
        }

        // Calculate transition progress if we're in a transition
        if (this.lastTransitionTime) {
            const progress = (currentTime - this.lastTransitionTime) / this.transitionDuration;

            if (progress >= 1) {
                // Transition complete
                this.lastTransitionTime = null;
                container.style.backgroundColor = isAtSunrise ? this.dayColor : this.nightColor;
            } else {
                // During transition
                if (isAtSunrise || (this.lastTransitionTime && simulatedMinutes < this.sunsetTime)) {
                    // Sunrise transition: night -> day
                    const color = this.interpolateColor(this.nightColor, this.dayColor, progress);
                    container.style.backgroundColor = color;
                } else {
                    // Sunset transition: day -> night
                    const color = this.interpolateColor(this.dayColor, this.nightColor, progress);
                    container.style.backgroundColor = color;
                }
            }
        } else if (!this.lastTransitionTime) {
            // Outside of transition periods
            if (simulatedMinutes >= this.sunriseTime && simulatedMinutes < this.sunsetTime) {
                container.style.backgroundColor = this.dayColor;
            } else {
                container.style.backgroundColor = this.nightColor;
            }
        }

        // Update cloud colors based on current sky color
        const isNight = simulatedMinutes < this.sunriseTime || simulatedMinutes >= this.sunsetTime;
        document.querySelectorAll('.cloud').forEach(cloud => {
            cloud.style.backgroundColor = isNight ? '#404040' : 'white';
        });
    }

    animateScene(timestamp) {
        if (!this.startTime) this.startTime = timestamp;
        if (!this.isPlaying) {
            requestAnimationFrame(this.animateScene.bind(this));
            return;
        }

        const progress = (timestamp - this.startTime) / 1000;
        const dayNightCycle = (progress % 120) / 60;
        
        const simulatedMinutes = (dayNightCycle * 720) % 1440;
        this.updateClock(simulatedMinutes);

        // Update celestial positions
        this.updateCelestialPositions(simulatedMinutes);

        // Update sky color with smooth transition
        this.updateSkyColor(simulatedMinutes, timestamp);

        // Update night elements
        const isNight = simulatedMinutes < this.sunriseTime || simulatedMinutes >= this.sunsetTime;
        
        // Animate windows
        if (isNight) {
            document.querySelectorAll('.window').forEach(window => {
                if (Math.random() < 0.01) {
                    window.style.background = 'rgba(255, 255, 150, 0.8)';
                }
            });
        }

        // Animate streetlamps
        document.querySelectorAll('.lamp-light').forEach(light => {
            light.classList.toggle('lamp-night', isNight);
        });

        // Animate stars
        document.querySelectorAll('.star').forEach(star => {
            star.style.display = isNight ? 'block' : 'none';
            if (isNight && Math.random() < 0.05) {
                star.style.opacity = Math.random() < 0.5 ? '1' : '0';
            }
        });

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
