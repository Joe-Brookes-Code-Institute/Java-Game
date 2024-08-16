const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 800;

const playerSprite = new Image();
playerSprite.src = 'assets/images/player-sprite.png';

const invaderSprite = new Image();
invaderSprite.src = 'path/to/invader-sprite.png';

const orangeInvaderSprite = new Image();
orangeInvaderSprite.src = 'path/to/orange-invader-sprite.png';

// Player object
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
    score: 0 // Player score
};

const bullets = [];
const invaderBullets = [];
const invaders = [];
const orangeInvaders = []; // Change from blue to orange
const powerUps = []; // Array for power-ups

const maxFallingOrangeInvaders = 1; // Maximum number of orange invaders falling at once
const totalNonOrangeInvaders = 5; // Total number of non-orange invaders
const invaderWidth = 60;
const invaderHeight = 60;
const invaderSpeed = 1;
let blackout = false; // Flag to indicate blackout
let blackoutTimer = 0; // Timer for blackout duration
let flashingInvader = null; // Reference to the current flashing invader

function createInvader(type) {
    return {
        x: Math.random() * (canvas.width - invaderWidth),
        y: Math.random() * (canvas.height / 2 - invaderHeight),
        status: 1,
        type: type,
        flashTimer: 0,
        chargeSpeed: 0.2, // Slower falling speed for orange invaders
        dx: invaderSpeed * (Math.random() > 0.5 ? 1 : -1), // Random initial direction
        isRed: false, // Flag to indicate if the invader has turned red
        rechargeTimer: 0 // Timer for recharging after blackout
    };
}

function createPowerUp() {
    return {
        x: Math.random() * (canvas.width - 20),
        y: 0,
        width: 20,
        height: 20,
        type: 'fasterShooting', // Example power-up type
        speed: 2
    };
}

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

function drawPlayer() {
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
}

function drawBullets() {
    ctx.fillStyle = 'red';
    for (const bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawInvaderBullets() {
    ctx.fillStyle = 'purple';
    for (const invBullet of invaderBullets) {
        ctx.fillRect(invBullet.x, invBullet.y, invBullet.width, invBullet.height);
    }
}

function drawInvaders() {
    for (const invader of invaders) {
        if (invader.status === 1) {
            if (invader.type === 2) {
                ctx.fillStyle = invader.flashTimer % 2 === 0 ? 'yellow' : 'orange'; // Type 2 - Flashing invader
            } else {
                ctx.fillStyle = 'white'; // Type 3 - Standard invader
            }
            ctx.fillRect(invader.x, invader.y, invaderWidth, invaderHeight);
        }
    }

    for (const orangeInvader of orangeInvaders) {
        if (orangeInvader.status === 1) {
            ctx.fillStyle = orangeInvader.isRed ? 'red' : 'orange'; // Change to orange
            ctx.fillRect(orangeInvader.x, orangeInvader.y, invaderWidth, invaderHeight);
        }
    }
}

function drawPowerUps() {
    ctx.fillStyle = 'blue';
    for (const powerUp of powerUps) {
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${player.score}`, 10, 20);
    ctx.fillText(`Lives: ${player.lives}`, 10, 40);
}

function movePlayer() {
    player.x += player.dx;
    player.y += player.dy;

    if (player.isJumping) {
        player.dy += player.gravity;
        if (player.y >= canvas.height - player.height) {
            player.y = canvas.height - player.height;
            player.dy = 0;
            player.isJumping = false;
        }
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function moveBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function moveInvaderBullets() {
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const invBullet = invaderBullets[i];
        invBullet.y += invBullet.speed;
        if (invBullet.y > canvas.height) {
            invaderBullets.splice(i, 1);
        }
    }
}

function movePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speed;
        if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

function checkPowerUpCollision() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (player.x < powerUps[i].x + powerUps[i].width &&
            player.x + player.width > powerUps[i].x &&
            player.y < powerUps[i].y + powerUps[i].height &&
            player.y + player.height > powerUps[i].y) {

            if (powerUps[i].type === 'fasterShooting') {
                player.shootInterval /= 2; // Example effect
            }

            powerUps.splice(i, 1); // Remove power-up after collection
        }
    }
}

function moveInvaders() {
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
                invader.x += invader.dx;
                // Random vertical movement for diversity
                if (Math.random() < 0.01) {
                    invader.y += Math.random() > 0.5 ? 5 : -5;
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
            orangeInvader.y += orangeInvader.chargeSpeed;
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

function collisionDetection() {
    for (const invader of invaders) {
        if (invader.status === 1) {
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                if (bullet.x > invader.x && bullet.x < invader.x + invaderWidth &&
                    bullet.y > invader.y && bullet.y < invader.y + invaderHeight) {
                    bullets.splice(i, 1);
                    invader.status = 0;
                    player.score += 100; // Increase score when an invader is defeated
                    // Replace defeated invader with a new one
                    let type;
                    if (invader === flashingInvader) {
                        type = 2; // Keep it flashing if it was the flashing invader
                    } else {
                        type = 3;
                    }
                    Object.assign(invader, createInvader(type));
                }
            }
        }
    }

    for (const orangeInvader of orangeInvaders) {
        if (orangeInvader.status === 1) {
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                if (bullet.x > orangeInvader.x && bullet.x < orangeInvader.x + invaderWidth &&
                    bullet.y > orangeInvader.y && bullet.y < orangeInvader.y + invaderHeight) {
                    bullets.splice(i, 1);
                    orangeInvader.status = 0;
                    player.score += 150; // Increase score for orange invaders
                    // Replace defeated orange invader with a new one
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
                if (player.lives <= 0) {
                    alert("Game Over! You've been hit by a charging invader.");
                    document.location.reload();
                }
            }
        }
    }

    // Check collision between invader bullets and player
    for (const invBullet of invaderBullets) {
        if (invBullet.x > player.x && invBullet.x < player.x + player.width &&
            invBullet.y > player.y && invBullet.y < player.y + player.height) {
            player.lives--; // Decrease lives if hit
            invaderBullets.splice(invaderBullets.indexOf(invBullet), 1); // Remove the bullet
            if (player.lives <= 0) {
                alert("Game Over! You've been hit by an invader bullet.");
                document.location.reload();
            }
        }
    }
}

function update() {
    movePlayer();
    moveBullets();
    moveInvaderBullets();
    moveInvaders();
    movePowerUps();
    checkPowerUpCollision();
    collisionDetection();

    if (blackout) {
        blackoutTimer--;
        if (blackoutTimer <= 0) {
            blackout = false;
        }
    }

    // Player continuous shooting
    player.shootTimer++;
    if (player.shootTimer >= player.shootInterval) {
        player.shootTimer = 0;
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7
        });
    }

    // Randomly generate power-ups
    if (Math.random() < 0.001) {
        powerUps.push(createPowerUp());
    }
}

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

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function keyDown(e) {
    if (e.key === 'ArrowRight') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft') {
        player.dx = -player.speed;
    } else if (e.key === 'Control' && !player.isJumping) {
        player.isJumping = true;
        player.dy = -10;
    }
}

function keyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        player.dx = 0;
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

initializeInvaders();
loop();
