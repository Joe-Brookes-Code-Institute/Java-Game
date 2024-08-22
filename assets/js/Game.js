// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Preload images to ensure they are ready before the game starts
const assetsToLoad = [
    'assets/images/player-sprite1.png',
    'assets/images/player-sprite2.png',
    'assets/images/invader-sprite1.png',
    'assets/images/invader-sprite2.png',
    'assets/images/orange-invader-sprite1.png',
    'assets/images/orange-invader-sprite2.png',
    'assets/images/bullet-sprite.png',
    'assets/images/power-up-sprite.png',
    'assets/images/flashingSprite1.png',
    'assets/images/flashingSprite2.png',
    'assets/images/background.png',
    'assets/images/charging-enemy-sprite.png' // Add charging enemy sprite
];

let assetsLoaded = 0;
const totalAssets = assetsToLoad.length;

function preloadImages(urls, onAllLoaded) {
    urls.forEach((url) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                onAllLoaded();
            }
        };
    });
}
//background



// Load player sprites
const playerSprites = [
    new Image(),
    new Image()
];
playerSprites[0].src = 'assets/images/player-sprite1.png';
playerSprites[1].src = 'assets/images/player-sprite2.png';

// Load invader sprites
const invaderSprites = [
    new Image(),
    new Image()
];
invaderSprites[0].src = 'assets/images/invader-sprite1.png';
invaderSprites[1].src = 'assets/images/invader-sprite2.png';

const orangeInvaderSprites = [
    new Image(),
    new Image()
];
orangeInvaderSprites[0].src = 'assets/images/orange-invader-sprite1.png';
orangeInvaderSprites[1].src = 'assets/images/orange-invader-sprite2.png';

const chargingEnemySprite = new Image();
chargingEnemySprite.src = 'assets/images/charging-enemy-sprite.png';

let orangeInvaderFrame = 0;

const flashingInvaderSprites = [
    new Image(),
    new Image()
];
flashingInvaderSprites[0].src = 'assets/images/flashing-invader-sprite1.png';
flashingInvaderSprites[1].src = 'assets/images/flashing-invader-sprite2.png';

// Load bullet and power-up sprites
const bulletSprite = new Image();
bulletSprite.src = 'assets/images/bullet-sprite.png';

const powerUpSprite = new Image();
powerUpSprite.src = 'assets/images/power-up-sprite.png';


// Set canvas dimensions
canvas.width = 600;
canvas.height = 800;



const backgroundImage = new Image();
backgroundImage.src = 'assets/images/background.png';

backgroundImage.onload = function() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
};


// Background scroll variables
let bgY = 0;
const bgScrollSpeed = 1; // Adjust the speed of the scrolling background

// Variables for sprite switching
let spriteSwitchTimer = 0;
let currentPlayerSpriteIndex = 0;
let currentInvaderSpriteIndex = 0;
const spriteSwitchInterval = 500; // 500 milliseconds = 0.5 seconds


// Player properties
const player = {
    x: 100,
    y: canvas.height - 50,
    width: 70,
    height: 70,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 0.5,
    jumpStrength: -15,
    isJumping: false,
    isShooting: false,
    shootTimer: 0,
    shootInterval: 20,    
    ammo: 10,
    score: 0,          // Initialize score
    lives: 3           // Initialize lives
};
// Arrays to hold various game objects
const bullets = [];
const invaderBullets = [];
const invaders = [];
const orangeInvaders = []; // Array for orange invaders
const powerUps = []; // Array for power-ups
//const chargingEnemies = []; // Array for charging enemies


// Constants for invader behavior
const maxFallingOrangeInvaders = 1; // Maximum number of orange invaders falling at once
const totalNonOrangeInvaders = 5; // Total number of non-orange invaders
const invaderWidth = 60; //has no effect
const invaderHeight = 60; //has no effect
const invaderSpeed = 1;

// Flags for game states
let blackout = false; // Flag to indicate blackout
let blackoutTimer = 0; // Timer for blackout duration
let flashingInvader = null; // Reference to the current flashing invader
let isSlowedDown = false; // Slowdown flag
let slowdownTimer = 0; // Timer for slowdown effect
const slowdownDuration = 60; // Duration of the slowdown in frames
const slowdownFactor = 0.5; // Slowdown factor (50% speed)
const POWER_UP_PROBABILITY = 0.008; // Probability of generating a power-up

// Create a new invader object
// Constants for invader sizes
const invaderSizes = {
    1: { width: 60, height: 60 }, // Orange invader
    2: { width: 50, height: 60 }, // Flashing invader
    3: { width: 60, height: 70 }  // Standard invader
    //4: { width: 60, height: 70 }  // charging invader
};

function update(deltaTime) {
    spriteSwitchTimer += deltaTime;

    if (spriteSwitchTimer >= spriteSwitchInterval) {
        spriteSwitchTimer = 0;
        currentPlayerSpriteIndex = (currentPlayerSpriteIndex + 1) % playerSprites.length;
        currentInvaderSpriteIndex = (currentInvaderSpriteIndex + 1) % invaderSprites.length;
    }

    const speedMultiplier = isSlowedDown ? slowdownFactor : 1;
    movePlayer(speedMultiplier);
    moveBullets(speedMultiplier);
    moveInvaderBullets(speedMultiplier);
    moveInvaders(speedMultiplier);
    movePowerUps(speedMultiplier);
    checkPowerUpCollision();
    collisionDetection();

    if (blackout) {
        blackoutTimer--;
        if (blackoutTimer <= 0) blackout = false;
    }

    if (isSlowedDown) {
        slowdownTimer--;
        if (slowdownTimer <= 0) isSlowedDown = false;
    }

    // Call the function to handle shooting
    handleShooting();
    if (Math.random() < POWER_UP_PROBABILITY) {
        powerUps.push(createPowerUp());
    }
}


//touch controls.
document.getElementById('leftBtn').addEventListener('mousedown', () => { player.dx = -player.speed; });
document.getElementById('leftBtn').addEventListener('mouseup', () => { player.dx = 0; });
document.getElementById('leftBtn').addEventListener('touchstart', () => { player.dx = -player.speed; });
document.getElementById('leftBtn').addEventListener('touchend', () => { player.dx = 0; });

document.getElementById('rightBtn').addEventListener('mousedown', () => { player.dx = player.speed; });
document.getElementById('rightBtn').addEventListener('mouseup', () => { player.dx = 0; });
document.getElementById('rightBtn').addEventListener('touchstart', () => { player.dx = player.speed; });
document.getElementById('rightBtn').addEventListener('touchend', () => { player.dx = 0; });

document.getElementById('jumpBtn').addEventListener('mousedown', () => {
    if (!player.isJumping) {
        player.isJumping = true;
        player.dy = player.jumpStrength;
    }
});
document.getElementById('jumpBtn').addEventListener('touchstart', () => {
    if (!player.isJumping) {
        player.isJumping = true;
        player.dy = player.jumpStrength;
    }
});

function simulateKeyPress(keyCode, type) {
    const event = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        keyCode: keyCode,
        which: keyCode,
        key: ' ',
        code: 'Space'
    });
    document.dispatchEvent(event);
}

// Handle mouse and touch events
document.getElementById('shootBtn').addEventListener('mousedown', () => {
    simulateKeyPress(32, 'keydown'); // Simulate spacebar press
});

document.getElementById('shootBtn').addEventListener('mouseup', () => {
    simulateKeyPress(32, 'keyup'); // Simulate spacebar release
});

document.getElementById('shootBtn').addEventListener('touchstart', (event) => {
    event.preventDefault();
    simulateKeyPress(32, 'keydown'); // Simulate spacebar press
});

document.getElementById('shootBtn').addEventListener('touchend', (event) => {
    event.preventDefault();
    simulateKeyPress(32, 'keyup'); // Simulate spacebar release
});




// Create a new invader object with different sizes
function createInvader(type) {
    const size = invaderSizes[type];
    return {
        x: Math.random() * (canvas.width - size.width),
        y: Math.random() * (canvas.height / 2 - size.height),
        width: size.width,
        height: size.height,
        status: 1,
        type: type,
        flashTimer: 0,
        chargeSpeed: 1.8,
        dx: invaderSpeed * (Math.random() > 0.5 ? 1 : -1),
        isRed: false,
        rechargeTimer: 0,
        animationFrame: 0,
        animationCounter: 0
    };
}
function drawInvaders() {
    for (const invader of invaders) {
        if (invader.status === 1) {
            if (invader.type === 2) {
                // Flashing invader
                ctx.drawImage(
                    flashingInvaderSprites[invader.animationFrame],
                    invader.x,
                    invader.y,
                    invader.width,
                    invader.height
                );
            } else {
                // Regular invader
                ctx.drawImage(
                    invaderSprites[currentInvaderSpriteIndex],
                    invader.x,
                    invader.y,
                    invader.width,
                    invader.height
                );
            }
        }
    }

    
    for (const orangeInvader of orangeInvaders) {
        if (orangeInvader.status === 1) {
            const spriteIndex = orangeInvader.type % 2;
            const sprite = orangeInvaderSprites[spriteIndex];
            ctx.drawImage(
                sprite, 
                orangeInvader.x, 
                orangeInvader.y, 
                orangeInvader.width, 
                orangeInvader.height
            );
        }
    }
}
        


// Create a new power-up object that grants ammo
function createPowerUp() {
    const types = ['ammo', 'lazer']; // Example types
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        x: Math.random() * (canvas.width - 20),
        y: 0,
        width: 20,
        height: 20,
        type: type,
        speed: 1
    };
}


// Initialize invaders at the start of the game
function initializeInvaders() {
    let flashingCount = 1;
    for (let i = 0; i < totalNonOrangeInvaders; i++) {
        let type;
        if (flashingCount < 1) {
            type = Math.floor(Math.random() * 2) + 2; // Random type between 2 and 3
            if (type === 2) {
                flashingCount++;
                flashingInvader = createInvader(type);
                invaders.push(flashingInvader);
                continue;
            }
        }
        invaders.push(createInvader(3)); // Ensure only one flashing invader
    }

    // Initialize up to maxFallingOrangeInvaders orange invaders
    for (let i = 0; i < maxFallingOrangeInvaders; i++) {
        orangeInvaders.push(createInvader(1));
    }
}
//draw
ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
// Draw the player on the canvas
function drawPlayer() {
    ctx.drawImage(
        playerSprites[currentPlayerSpriteIndex], 
        player.x, 
        player.y, 
        player.width, 
        player.height
    );
}


// Draw bullets fired by the player
function drawBullets() {
    for (const bullet of bullets) {
        ctx.drawImage(
            bulletSprite,
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    }
}

// Draw bullets fired by invaders
function drawInvaderBullets() {
    ctx.fillStyle = 'purple';
    for (const invBullet of invaderBullets) {
        ctx.fillRect(invBullet.x, invBullet.y, invBullet.width, invBullet.height);
    }
}
// Draw bullets fired by invaders
function createBullet(x, y, speed) {
    return {
        x: x,
        y: y,
        width: 5,    // Set this to the actual width of the bullet you want
        height: 10,  // Set this to the actual height of the bullet you want
        speed: speed
    };
}         

// Assuming powerUps is the array holding the power-up objects
// Assuming powerUpSprites is the array of images for the power-ups
// Assuming currentPowerUpSpriteIndex is the index to use for the current sprite

function drawPowerUps() {
    const scaleFactor = 1.9;  // Scale factor to increase size

    for (const powerUp of powerUps) {
        const scaledWidth = powerUp.width * scaleFactor;
        const scaledHeight = powerUp.height * scaleFactor;

        ctx.drawImage(
            powerUpSprite,            // Image to draw
            powerUp.x,                // X coordinate
            powerUp.y,                // Y coordinate
            scaledWidth,              // Scaled width
            scaledHeight             // Scaled height
        );
    }
}

// Draw the player's score, lives, and ammo on the screen
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${player.score}`, 10, 20);
    ctx.fillText(`Lives: ${player.lives}`, 10, 40);
    ctx.fillText(`Ammo: ${player.ammo}`, 10, 60); // Display ammo
}

// Move the player based on input and physics
function movePlayer(multiplier = 1) {
    player.x += player.dx * multiplier;
    player.y += player.dy * multiplier;

    if (player.isJumping) {
        player.dy += player.gravity * multiplier;
        if (player.y >= canvas.height - player.height) {
            player.y = canvas.height - player.height;
            player.dy = 0;
            player.isJumping = false;
        }
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Move the player's bullets
function moveBullets(multiplier = 1) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed * multiplier;
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}
// Move the invaders' bullets
function moveInvaderBullets(multiplier = 1) {
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const invBullet = invaderBullets[i];
        invBullet.y += invBullet.speed * multiplier;
        if (invBullet.y > canvas.height) {
            invaderBullets.splice(i, 1);
        }
    }
}

// Move power-ups down the screen
function movePowerUps(multiplier = 1) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speed * multiplier;
        if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1); // Remove off-screen power-ups
        }
    }
}

// Check if the player collects a power-up
function checkPowerUpCollision() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y) {
            
            if (powerUp.type === 'ammo') {
                player.ammo += 5; // Example action for 'ammo' type
            }
            // Handle other power-up types here

            powerUps.splice(i, 1); // Remove power-up after collection
        }
    }
}
// Array to hold charging enemies
const chargingEnemies = [];

// Create a new charging enemy object
function createChargingEnemy() {
    return {
        x: Math.random() > 0.5 ? -50 : canvas.width + 50, // Start off-screen
        y: canvas.height - 60, // Ground level
        width: 50,
        height: 50,
        speed: 3,
        direction: Math.random() > 0.5 ? 1 : -1, // Left or right
        status: 1 // Active
    };
}

// Initialize charging enemies
function initializeChargingEnemies() {
    chargingEnemies.push(createChargingEnemy());
}

// Move charging enemies
function moveChargingEnemies() {
    for (let i = chargingEnemies.length - 1; i >= 0; i--) {
        const enemy = chargingEnemies[i];
        enemy.x += enemy.speed * enemy.direction;

        // Remove enemy if it goes off-screen
        if (enemy.x < -enemy.width || enemy.x > canvas.width + enemy.width) {
            chargingEnemies.splice(i, 1);
        }
    }
}

// Draw charging enemies using sprite
function drawChargingEnemies() {
    for (const enemy of chargingEnemies) {
        if (enemy.status === 1) {
            ctx.drawImage(chargingEnemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }
}


// Check for collisions with charging enemies
function checkChargingEnemyCollision() {
    for (const enemy of chargingEnemies) {
        if (enemy.status === 1 &&
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            player.lives--; // Decrease lives if hit
            enemy.status = 0; // Deactivate the enemy
            if (player.lives <= 0) {
                alert("Game Over! You've been hit by a charging enemy.");
                document.location.reload();
            }
        }
    }
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    backgroundImage.src = 'assets/images/background.png?' + new Date().getTime();
}

function renderGame() {
    drawBackground();
    drawInvaders();
    drawPlayer();
    drawBullets();
    drawPowerUps();
    drawChargingEnemies();
    // Other rendering...
}

// Move invaders and check for player collisions
function moveInvaders(multiplier = 1) {
    for (const invader of invaders) {
        if (invader.status === 1) {
            if (invader.type === 2) {
                // Type 2 - Flashing invader
                if (invader.rechargeTimer > 0) {
                    invader.rechargeTimer--;
                } else {
                    invader.flashTimer++;
                    if (invader.flashTimer > 999500 && !blackout) { // 5 seconds at 60 FPS
                        blackout = true;
                        blackoutTimer = 120; // 2 seconds at 60 FPS
                        invader.rechargeTimer = 240; // 4 seconds recharge at 60 FPS
                        invader.flashTimer = 0; // Reset flash timer
                    }
                }
            } else if (invader.type === 3) {
                // Type 3 - Moving invader
                invader.x += invader.dx * multiplier;
                // Random vertical movement for diversity
                if (Math.random() < 0.01) {
                    invader.y += (Math.random() > 0.5 ? 5 : -5) * multiplier;
                }
                if (invader.x + invaderWidth > canvas.width || invader.x < 0) {
                    invader.dx *= -1;
                }
                if (invader.y + invaderHeight > canvas.height / 2 || invader.y < 0) {
                    invader.y = Math.max(0, Math.min(invader.y, canvas.height / 2 - invaderHeight));
                }
                // Shooting logic
                if (Math.random() < 0.003) { // Random chance to shoot
                    invaderBullets.push({
                        x: invader.x + invaderWidth / 2,
                        y: invader.y + invaderHeight,
                        width: 11,
                        height: 18,
                        speed: 2
                    });
                }
            }
        }
    }

    let fallingOrangeCount = 0;
    for (const orangeInvader of orangeInvaders) {
        if (orangeInvader.status === 1) {
            // Type 1 - Charging invader
            // Aim towards the player's x position
            if (orangeInvader.x + invaderWidth / 2 < player.x + player.width / 2) {
                orangeInvader.x += orangeInvader.chargeSpeed * multiplier;
            } else if (orangeInvader.x + invaderWidth / 2 > player.x + player.width / 2) {
                orangeInvader.x -= orangeInvader.chargeSpeed * multiplier;
            }

            orangeInvader.y += orangeInvader.chargeSpeed * multiplier;

            if (orangeInvader.y + invaderHeight >= canvas.height) {
                orangeInvader.y = canvas.height - invaderHeight;
                orangeInvader.isRed = true; // Turn red when hitting the floor
                orangeInvader.status = 0; // Mark as inactive
            } else {
                fallingOrangeCount++;
            }
        }
    }

    // Ensure only maxFallingOrangeInvaders are falling
    while (fallingOrangeCount < maxFallingOrangeInvaders) {
        orangeInvaders.push(createInvader(1));
        fallingOrangeCount++;
    }
}

// Check for collisions between bullets, invaders, and the player
function collisionDetection() {
    for (const invader of invaders) {
        if (invader.status === 1) {
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                if (bullet.x > invader.x && bullet.x < invader.x + invaderWidth &&
                    bullet.y > invader.y && bullet.y < invader.y + invaderHeight) {
                    bullets.splice(i, 1);
                    invader.status = 0;
                    player.score += 100;
                    Object.assign(invader, createInvader(invader === flashingInvader ? 2 : 3));
                }
            }
        }
    }
    // Similar logic for orangeInvaders and player collision
    for (const orangeInvader of orangeInvaders) {
        if (orangeInvader.status === 1) {
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                if (bullet.x > orangeInvader.x && bullet.x < orangeInvader.x + invaderWidth &&
                    bullet.y > orangeInvader.y && bullet.y < orangeInvader.y + invaderHeight) {
                    bullets.splice(i, 1);
                    orangeInvader.status = 0;
                    player.score += 150; // Increase score for orange invaders
                    Object.assign(orangeInvader, createInvader(1));
                }
            }
            // Check collision with player for Type 1
            if (orangeInvader.x < player.x + player.width &&
                orangeInvader.x + invaderWidth > player.x &&
                orangeInvader.y < player.y + player.height &&
                orangeInvader.y + invaderHeight > player.y) {
                player.lives--; // Decrease lives if hit
                orangeInvader.status = 0; // Deactivate the invader
                
                if (player.lives > 0) {
                    isSlowedDown = true;
                    slowdownTimer = slowdownDuration;
                } else {
                    alert("Game Over! You've been hit by a charging invader.");
                    document.location.reload();
                }
            }
        }
    }

    for (const invBullet of invaderBullets) {
        if (invBullet.x > player.x && invBullet.x < player.x + player.width &&
            invBullet.y > player.y && invBullet.y < player.y + player.height) {
            player.lives--; // Decrease lives if hit
            invaderBullets.splice(invaderBullets.indexOf(invBullet), 1); // Remove the bullet

            if (player.lives > 0) {
                isSlowedDown = true;
                slowdownTimer = slowdownDuration;
            } else {
                alert("Game Over! You've been hit by an invader bullet.");
                document.location.reload();
            }
        }
    }
}

// Update the game state, including sprite switching
function update(deltaTime) {
    // Update the sprite switch timer
    spriteSwitchTimer += deltaTime;


    const speedMultiplier = isSlowedDown ? slowdownFactor : 1;
    movePlayer(speedMultiplier);
    moveBullets(speedMultiplier);
    moveInvaderBullets(speedMultiplier);
    moveInvaders(speedMultiplier);
    movePowerUps(speedMultiplier);
    checkPowerUpCollision();
    collisionDetection();
    
    if (blackout) {
        blackoutTimer--;
        if (blackoutTimer <= 0) {
            blackout = false;
        }
    }
    if (isSlowedDown) {
        slowdownTimer--;
        if (slowdownTimer <= 0) {
            isSlowedDown = false;
        }
    }
    if (player.shootTimer >= player.shootInterval && player.ammo > 0 && player.isShooting) {
        player.shootTimer = 0;

    }
     
    if (Math.random() < POWER_UP_PROBABILITY) {
        powerUps.push(createPowerUp());
    }
     // Update flashing invaders' animation frames
     for (const invader of invaders) {
        if (invader.type === 2) {
            invader.animationCounter += deltaTime;
            if (invader.animationCounter >= 250) { // 250ms = 1/4 second
                invader.animationCounter = 0;
                invader.animationFrame = (invader.animationFrame + 1) % 2;
            }
        }
    }   
        

    }

// Draw the game state every frame
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!blackout) {
        drawPlayer();
        drawBullets();
        drawInvaderBullets();
        drawInvaders();
        drawPowerUps();
        drawScore();
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}



// The main game loop that updates and draws the game state
let lastTime = 0;
function loop(currentTime) {
    const deltaTime = currentTime - lastTime; // Time elapsed since the last frame
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(loop);
}
// Handle key down events for player movement and shooting
function updateOrangeInvaderFrames() {
    orangeInvaderFrame++;
}
// Handle keydown events for player movement and actions
function keyDownHandler(e) {
    if (e.key === 'ArrowRight') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft') {
        player.dx = -player.speed;
    } else if (e.key === 'Control' && !player.isJumping) {
        player.isJumping = true;
        player.dy = player.jumpStrength;
    } else if (e.key === ' ' && player.ammo > 0) {
        player.isShooting = true;
        shootBullet();
    }
}

// Handle keyup events to stop player movement and shooting
function keyUpHandler(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        player.dx = 0;
    } else if (e.key === ' ') {
        player.isShooting = false;
    }
}

// Function to shoot bullets
function shootBullet() {
    if (player.shootTimer === 0 && player.ammo > 0) {
        bullets.push({
            x: player.x + player.width / 2 - 5,
            y: player.y,
            width: 3,
            height: 10,
            speed: 5
        });
        player.shootTimer = player.shootInterval;
        player.ammo--;
    }
}
//touch

// Function to decrease shoot timer
function handleShooting() {
    if (player.shootTimer > 0) {
        player.shootTimer--;
    }
}

// Update player position and handle jump
function updatePlayer() {
    // Update horizontal movement
    player.x += player.dx;

    // Apply gravity and update vertical movement
    player.dy += player.gravity;
    player.y += player.dy;

    // Check for ground collision
    if (player.y >= canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.isJumping = false;
    }
}

// Event listeners for keyboard input
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);


// Initialize the game and start the game loop
// Start the game loop
// Initialize the game and start the game loop
initializeInvaders();
lastTime = performance.now();
requestAnimationFrame(loop);
