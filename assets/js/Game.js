// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Asset paths
const assets = {
    player: ['assets/images/player-sprite1.png', 'assets/images/player-sprite2.png'],
    invader: ['assets/images/invader-sprite1.png', 'assets/images/invader-sprite2.png'],
    orangeInvader: ['assets/images/orange-invader-sprite1.png', 'assets/images/orange-invader-sprite2.png'],
    bullet: 'assets/images/bullet-sprite.png',
    powerUp: 'assets/images/power-up-sprite.png',
    flashingInvader: ['assets/images/flashingSprite1.png', 'assets/images/flashingSprite2.png'],
    background: 'assets/images/background.png',
    chargingEnemy: 'assets/images/charging-enemy-sprite.png'
};

// Load images
const images = {};
const loadImage = src => {
    return new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
    });
};

const loadAssets = async () => {
    const assetPromises = Object.keys(assets).map(key => {
        if (Array.isArray(assets[key])) {
            return Promise.all(assets[key].map(src => loadImage(src)))
                .then(imgs => images[key] = imgs);
        } else {
            return loadImage(assets[key])
                .then(img => images[key] = img);
        }
    });
    await Promise.all(assetPromises);
};

// Initialize canvas size
canvas.width = 600;
canvas.height = 800;

// Game state variables
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
    score: 0,
    lives: 3
};

const bullets = [];
const invaderBullets = [];
const invaders = [];
const orangeInvaders = [];
const powerUps = [];
const chargingEnemies = [];

const bgScrollSpeed = 1;
const POWER_UP_PROBABILITY = 0.008;

let spriteSwitchTimer = 0;
let currentPlayerSpriteIndex = 0;
let currentInvaderSpriteIndex = 0;
const spriteSwitchInterval = 500;

let blackout = false;
let blackoutTimer = 0;
let isSlowedDown = false;
let slowdownTimer = 0;
const slowdownDuration = 60;
const slowdownFactor = 0.5;

function update(deltaTime) {
    spriteSwitchTimer += deltaTime;
    if (spriteSwitchTimer >= spriteSwitchInterval) {
        spriteSwitchTimer = 0;
        currentPlayerSpriteIndex = (currentPlayerSpriteIndex + 1) % images.player.length;
        currentInvaderSpriteIndex = (currentInvaderSpriteIndex + 1) % images.invader.length;
    }

    if (blackout) {
        blackoutTimer--;
        if (blackoutTimer <= 0) blackout = false;
    }

    if (isSlowedDown) {
        slowdownTimer--;
        if (slowdownTimer <= 0) isSlowedDown = false;
    }

    const speedMultiplier = isSlowedDown ? slowdownFactor : 1;
    movePlayer(speedMultiplier);
    moveBullets(speedMultiplier);
    moveInvaderBullets(speedMultiplier);
    moveInvaders(speedMultiplier);
    movePowerUps(speedMultiplier);
    moveChargingEnemies(speedMultiplier);
    checkPowerUpCollision();
    collisionDetection();

    if (player.shootTimer >= player.shootInterval && player.ammo > 0 && player.isShooting) {
        player.shootTimer = 0;
        bullets.push(createBullet(player.x + player.width / 2 - 5, player.y, 7 * speedMultiplier));
        player.ammo--;
    }

    if (Math.random() < POWER_UP_PROBABILITY) {
        powerUps.push(createPowerUp());
    }
}

function movePlayer(multiplier) {
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

    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
}

function moveBullets(multiplier) {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed * multiplier;
        if (bullet.y < 0) bullets.splice(index, 1);
    });
}

function moveInvaderBullets(multiplier) {
    invaderBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed * multiplier;
        if (bullet.y > canvas.height) invaderBullets.splice(index, 1);
    });
}

function movePowerUps(multiplier) {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed * multiplier;
        if (powerUp.y > canvas.height) powerUps.splice(index, 1);
    });
}

function moveChargingEnemies(multiplier) {
    chargingEnemies.forEach((enemy, index) => {
        enemy.x += enemy.speed * enemy.direction * multiplier;
        if (enemy.x < -enemy.width || enemy.x > canvas.width + enemy.width) {
            chargingEnemies.splice(index, 1);
        }
    });
}

function createBullet(x, y, speed) {
    return { x, y, width: 10, height: 20, speed };
}

function createPowerUp() {
    const types = ['ammo', 'lazer'];
    const type = types[Math.floor(Math.random() * types.length)];
    return { x: Math.random() * (canvas.width - 20), y: 0, width: 20, height: 20, type, speed: 1 };
}

function createChargingEnemy() {
    return {
        x: Math.random() > 0.5 ? -50 : canvas.width + 50,
        y: canvas.height - 50,
        width: 50,
        height: 50,
        speed: 3,
        direction: Math.random() > 0.5 ? 1 : -1,
        status: 1
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (blackout) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
        drawPlayer();
        drawBullets();
        drawInvaderBullets();
        drawInvaders();
        drawPowerUps();
        drawChargingEnemies();
        drawScore();
    }
}

function drawPlayer() {
    ctx.drawImage(images.player[currentPlayerSpriteIndex], player.x, player.y, player.width, player.height);
}

function drawBullets() {
    bullets.forEach(bullet => ctx.drawImage(images.bullet, bullet.x, bullet.y, bullet.width, bullet.height));
}

function drawInvaderBullets() {
    ctx.fillStyle = 'purple';
    invaderBullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));
}

function drawInvaders() {
    invaders.forEach(invader => {
        if (invader.status === 1) {
            ctx.drawImage(images.invader[currentInvaderSpriteIndex], invader.x, invader.y, invader.width, invader.height);
        }
    });

    orangeInvaders.forEach(orangeInvader => {
        if (orangeInvader.status === 1) {
            const spriteIndex = orangeInvader.type % 2;
            ctx.drawImage(images.orangeInvader[spriteIndex], orangeInvader.x, orangeInvader.y, orangeInvader.width, orangeInvader.height);
        }
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const scaleFactor = 1.9;
        ctx.drawImage(images.powerUp, powerUp.x, powerUp.y, powerUp.width * scaleFactor, powerUp.height * scaleFactor);
    });
}

function drawChargingEnemies() {
    chargingEnemies.forEach(enemy => {
        if (enemy.status === 1) {
            ctx.drawImage(images.chargingEnemy, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${player.score}`, 10, 20);
    ctx.fillText(`Lives: ${player.lives}`, 10, 40);
    ctx.fillText(`Ammo: ${player.ammo}`, 10, 60);
}

function collisionDetection() {
    // Check for collisions between bullets and invaders
    bullets.forEach((bullet, bIndex) => {
        invaders.forEach((invader, iIndex) => {
            if (invader.status === 1 && isColliding(bullet, invader)) {
                invader.status = 0; // mark invader as hit
                bullets.splice(bIndex, 1); // remove bullet
                player.score += 100;
                if (Math.random() < POWER_UP_PROBABILITY) {
                    powerUps.push(createPowerUp());
                }
            }
        });
    });

    // Check for collisions between invader bullets and player
    invaderBullets.forEach((bullet, bIndex) => {
        if (isColliding(bullet, player)) {
            player.lives--;
            invaderBullets.splice(bIndex, 1);
            if (player.lives <= 0) {
                blackout = true;
                blackoutTimer = 200;
            }
        }
    });

    // Check for collisions between power-ups and player
    powerUps.forEach((powerUp, pIndex) => {
        if (isColliding(powerUp, player)) {
            if (powerUp.type === 'ammo') {
                player.ammo += 10;
            } else if (powerUp.type === 'lazer') {
                // Implement special power here
            }
            powerUps.splice(pIndex, 1);
        }
    });

    // Check for collisions between charging enemies and player
    chargingEnemies.forEach((enemy, eIndex) => {
        if (isColliding(enemy, player)) {
            player.lives--;
            chargingEnemies.splice(eIndex, 1);
            if (player.lives <= 0) {
                blackout = true;
                blackoutTimer = 200;
            }
        }
    });
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function loop(timestamp) {
    const deltaTime = timestamp - (lastTimestamp || timestamp);
    lastTimestamp = timestamp;

    if (!blackout) {
        update(deltaTime);
        draw();
    }

    requestAnimationFrame(loop);
}

let lastTimestamp = 0;
requestAnimationFrame(loop);

// Event listeners for player controls
document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') player.dx = -player.speed;
    if (e.code === 'ArrowRight') player.dx = player.speed;
    if (e.code === 'Space') player.isShooting = true;
    if (e.code === 'ArrowUp' && !player.isJumping) {
        player.dy = player.jumpStrength;
        player.isJumping = true;
    }
});

document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') player.dx = 0;
    if (e.code === 'Space') player.isShooting = false;
});

// Start loading assets
loadAssets().then(() => {
    console.log('Assets loaded successfully');
    // Game initialization code can go here
});
