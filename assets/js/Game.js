// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// Load bullet and power-up sprites
const bulletSprite = new Image();
bulletSprite.src = 'assets/images/bullet-sprite.png';

const powerUpSprite = new Image();
powerUpSprite.src = 'assets/images/power-up-sprite.png';


// Set canvas dimensions
canvas.width = 600;
canvas.height = 800;

// Load player sprite
const playerSprite = new Image();
playerSprite.src = 'assets/images/player-sprite.png';

// Load invader sprites
const invaderSprite = new Image();
invaderSprite.src = 'assets/images/invader-sprite.png';

const orangeInvaderSprite = new Image();
orangeInvaderSprite.src = 'assets/images/orange-invader-sprite.png';

// Load background image
const backgroundImage = new Image();
backgroundImage.src = 'assets/images/background.png';

// Background scroll variables
let bgY = 0;
const bgScrollSpeed = 1; // Adjust the speed of the scrolling background

// Player object with properties including ammo
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 30,
    width: 100,
    height: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    jumpHeight: canvas.height / 3,
    isJumping: false,
    gravity: 0.5,
    shootInterval: 20, // Shooting interval in frames
    shootTimer: 0,
    lives: 3, // Player lives
    score: 0, // Player score
    ammo: 10, // Starting ammo
    isShooting: false // Flag to track if the player is holding the shoot button
};

// Arrays to hold various game objects
const bullets = [];
const invaderBullets = [];
const invaders = [];
const orangeInvaders = []; // Array for orange invaders
const powerUps = []; // Array for power-ups

// Constants for invader behavior
const maxFallingOrangeInvaders = 1; // Maximum number of orange invaders falling at once
const totalNonOrangeInvaders = 5; // Total number of non-orange invaders
const invaderWidth = 60;
const invaderHeight = 60;
const invaderSpeed = 1;

// Flags for game states
let blackout = false; // Flag to indicate blackout
let blackoutTimer = 0; // Timer for blackout duration
let flashingInvader = null; // Reference to the current flashing invader
let isSlowedDown = false; // Slowdown flag
let slowdownTimer = 0; // Timer for slowdown effect
const slowdownDuration = 60; // Duration of the slowdown in frames
const slowdownFactor = 0.5; // Slowdown factor (50% speed)
const POWER_UP_PROBABILITY = 0.01; // Probability of generating a power-up

// Create a new invader object
// Constants for invader sizes
const invaderSizes = {
    1: { width: 38, height: 70 }, // Orange invader
    2: { width: 50, height: 60 }, // Flashing invader
    3: { width: 60, height: 70 }  // Standard invader
};

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
        rechargeTimer: 0
    };
}

// Draw invaders on the canvas with their respective sizes
function drawInvaders() {
    for (const invader of invaders) {
        if (invader.status === 1) {
            if (invader.type === 2) {
                ctx.fillStyle = invader.flashTimer % 2 === 0 ? 'yellow' : 'orange'; // Flashing invader
            } else {
                ctx.fillStyle = 'white'; // Standard invader
            }
            ctx.drawImage(invaderSprite, invader.x, invader.y, invader.width, invader.height);
        
                
        }
    }
    for (const orangeInvader of orangeInvaders) {
        if (orangeInvader.status === 1) {
            ctx.fillStyle = orangeInvader.isRed ? 'red' : 'orange'; // Orange invader
            ctx.fillRect(orangeInvader.x, orangeInvader.y, orangeInvader.width, orangeInvader.height);
            
        }
    }
}

// Create a new power-up object that grants ammo
function createPowerUp() {
    return {
        x: Math.random() * (canvas.width - 20),
        y: 0,
        width: 20,
        height: 20,
        type: 'ammo', // Power-up type is now ammo
        speed: 2
    };
}

// Initialize invaders at the start of the game
function initializeInvaders() {
    let flashingCount = 0;
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

// Draw the player on the canvas
function drawPlayer() {
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
}

// Draw bullets fired by the player
function drawBullets() {
    ctx.fillStyle = 'red';
    for (const bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

// Draw bullets fired by invaders
function drawInvaderBullets() {
    ctx.fillStyle = 'purple';
    for (const invBullet of invaderBullets) {
        ctx.fillRect(invBullet.x, invBullet.y, invBullet.width, invBullet.height);
    }
}


// Draw power-ups on the canvas
function drawPowerUps() {
    ctx.fillStyle = 'blue';
    for (const powerUp of powerUps) {
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
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
            powerUps.splice(i, 1);
        }
    }
}

// Check if the player collects a power-up
function checkPowerUpCollision() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (player.x < powerUps[i].x + powerUps[i].width &&
            player.x + player.width > powerUps[i].x &&
            player.y < powerUps[i].y + powerUps[i].height &&
            player.y + player.height > powerUps[i].y) {

            if (powerUps[i].type === 'ammo') {
                player.ammo += 5; // Add 5 ammo when a power-up is collected
            }

            powerUps.splice(i, 1); // Remove the power-up after collection
        }
    }
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

// Update the game state every frame
function update() {
    
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
    player.shootTimer++;
    if (player.shootTimer >= player.shootInterval && player.ammo > 0 && player.isShooting) {
        player.shootTimer = 0;
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7 * speedMultiplier
        });
        player.ammo--;
    }
    if (Math.random() < POWER_UP_PROBABILITY) {
        powerUps.push(createPowerUp());
        

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
// Main game loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Handle key down events for player movement and shooting
function keyDown(e) {
    if (e.key === 'ArrowRight') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft') {
        player.dx = -player.speed;
    } else if (e.key === 'Control' && !player.isJumping) {
        player.isJumping = true;
        player.dy = -15;
    } else if (e.key === ' ' && player.ammo > 0) {
        player.isShooting = true;
    }
}

// Handle key up events for stopping player movement and shooting
function keyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        player.dx = 0;
    } else if (e.key === ' ') { // Stop shooting when spacebar is released
        player.isShooting = false;
    }
}

// Attach event listeners for keyboard input
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);



// Initialize the game and start the game loop
initializeInvaders();
loop();