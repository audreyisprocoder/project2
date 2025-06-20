let score = 0;
const fishTypes = [
    { name: "Bass", chance: 0.20, color: "#4caf50", shape: "fish" },
    { name: "Trout", chance: 0.15, color: "#2196f3", shape: "fish" },
    { name: "Salmon", chance: 0.13, color: "#ff7043", shape: "fish" },
    { name: "Goldfish", chance: 0.10, color: "#ffd600", shape: "fish" },
    { name: "Catfish", chance: 0.09, color: "#a1887f", shape: "fish" },
    { name: "Koi", chance: 0.09, color: "#ffb300", shape: "fish" },
    { name: "Bluegill", chance: 0.06, color: "#00bcd4", shape: "fish" },
    { name: "Red Snapper", chance: 0.06, color: "#e53935", shape: "fish" },
    { name: "Turtle", chance: 0.05, color: "#388e3c", shape: "turtle" },
    { name: "Crab", chance: 0.04, color: "#d84315", shape: "crab" },
    { name: "Jellyfish", chance: 0.02, color: "#b39ddb", shape: "jellyfish" },
    { name: "Starfish", chance: 0.01, color: "#ffb74d", shape: "starfish" },
];

const canvas = document.getElementById('fishingCanvas');
const ctx = canvas.getContext('2d');

// Add inventory
let inventory = [];
let locked = [];
let aquarium = [];

let gameState = 'idle'; // idle, waiting, fish-approaching, fish-near, caught
let waitTimeout = null;
let hookY = 120;
let hookX = 200; // horizontal position of hook
let hookMoving = false;
let hookDropped = false;
const hookMinY = 120;
const hookMaxY = Math.floor(canvas.height * 2 / 3); // dark blue water top
const hookMinX = 80;
const hookMaxX = 520;
let caughtFish = null;
let fish = null;
let fishAnim = null;

// Background fish for ambiance
let bgFishArr = [];

// Rarity values for token calculation
const rarityValues = {
    'Bass': 1,
    'Trout': 2,
    'Salmon': 3,
    'Goldfish': 5,
    'Catfish': 2,
    'Koi': 4,
    'Bluegill': 2,
    'Red Snapper': 4,
    'Turtle': 8,
    'Crab': 6,
    'Jellyfish': 7,
    'Starfish': 10
};

function randomSize(shape) {
    if (shape === 'crab' || shape === 'starfish') return 0.6 + Math.random() * 0.5;
    if (shape === 'jellyfish') return 0.7 + Math.random() * 0.4;
    if (shape === 'turtle') return 0.7 + Math.random() * 0.5;
    return 0.6 + Math.random() * 0.7; // fish
}

function drawFish(fishObj, options = {}) {
    if (!fishObj) return;
    ctx.save();
    ctx.translate(fishObj.x, fishObj.y);
    ctx.scale(fishObj.dir, 1);
    // Transparency and size
    let opacity = options.caught ? 1 : 0.6;
    let scale = options.caught ? (fishObj.size || 1.15) : (fishObj.size || 0.75);
    ctx.globalAlpha = opacity;
    ctx.scale(scale, scale);
    if (fishObj.shape === 'turtle') {
        // Turtle: oval shell, head, legs
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 12, 0, 0, 2 * Math.PI);
        ctx.fillStyle = fishObj.color;
        ctx.shadowColor = '#333';
        ctx.shadowBlur = 8;
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(20, 0, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#689f38';
        ctx.fill();
        // Legs
        ctx.fillStyle = '#689f38';
        ctx.beginPath(); ctx.arc(-10, -10, 3, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(-10, 10, 3, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -10, 3, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(10, 10, 3, 0, 2 * Math.PI); ctx.fill();
    } else if (fishObj.shape === 'crab') {
        // Crab: round body, legs, claws
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.fillStyle = fishObj.color;
        ctx.shadowColor = '#333';
        ctx.shadowBlur = 8;
        ctx.fill();
        // Legs
        ctx.strokeStyle = fishObj.color;
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath(); ctx.moveTo(i*8, 5); ctx.lineTo(i*16, 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i*8, -5); ctx.lineTo(i*16, -12); ctx.stroke();
        }
        // Claws
        ctx.beginPath(); ctx.arc(-14, -8, 4, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(14, -8, 4, 0, Math.PI*2); ctx.stroke();
    } else if (fishObj.shape === 'jellyfish') {
        // Jellyfish: dome, tentacles
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 12, 0, Math.PI, 2 * Math.PI);
        ctx.fillStyle = fishObj.color;
        ctx.shadowColor = '#333';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.globalAlpha = opacity * 0.5;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i*5, 10);
            ctx.bezierCurveTo(i*5, 18, i*10, 22, i*2, 28);
            ctx.strokeStyle = fishObj.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    } else if (fishObj.shape === 'starfish') {
        // Starfish: 5-pointed star
        ctx.save();
        ctx.rotate(Math.PI/5);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI/180) * 12, Math.sin((18 + i * 72) * Math.PI/180) * 12);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI/180) * 5, Math.sin((54 + i * 72) * Math.PI/180) * 5);
        }
        ctx.closePath();
        ctx.fillStyle = fishObj.color;
        ctx.shadowColor = '#333';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    } else {
        // Default: fish shape
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 28, 14, 0, 0, 2 * Math.PI);
        ctx.fillStyle = fishObj.color;
        ctx.shadowColor = '#333';
        ctx.shadowBlur = 8;
        ctx.fill();
        // Tail
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(-40, -10);
        ctx.lineTo(-40, 10);
        ctx.closePath();
        ctx.fillStyle = fishObj.color;
        ctx.globalAlpha = opacity * 0.8;
        ctx.fill();
        ctx.globalAlpha = opacity;
        // Eye
        ctx.beginPath();
        ctx.arc(12, -4, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(13, -4, 1, 0, 2 * Math.PI);
        ctx.fillStyle = '#222';
        ctx.fill();
    }
    ctx.restore();
}

function drawDockAndStickman() {
    // Dock position
    const dockX = 0;
    const dockY = 60; // higher up to fit new waterline
    // Dock planks
    ctx.save();
    ctx.fillStyle = '#b8864b';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(dockX, dockY + i * 18, 70, 14);
        ctx.strokeStyle = '#8d5524';
        ctx.lineWidth = 2;
        ctx.strokeRect(dockX, dockY + i * 18, 70, 14);
    }
    // Dock posts
    ctx.fillStyle = '#8d5524';
    ctx.fillRect(dockX + 8, dockY + 0, 10, 60);
    ctx.fillRect(dockX + 52, dockY + 0, 10, 60);
    ctx.restore();

    // Stickman
    const manX = dockX + 55;
    const manY = dockY - 10;
    ctx.save();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    // Head
    ctx.beginPath();
    ctx.arc(manX, manY, 13, 0, 2 * Math.PI);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(manX, manY + 13);
    ctx.lineTo(manX, manY + 45);
    ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(manX, manY + 25);
    ctx.lineTo(manX + 25, manY + 30); // right arm (holds rod)
    ctx.moveTo(manX, manY + 25);
    ctx.lineTo(manX - 17, manY + 35); // left arm
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(manX, manY + 45);
    ctx.lineTo(manX - 10, manY + 75);
    ctx.moveTo(manX, manY + 45);
    ctx.lineTo(manX + 10, manY + 75);
    ctx.stroke();
    ctx.restore();
}

function drawScene() {
    // Water
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const waterTop = Math.floor(canvas.height / 3);
    ctx.fillStyle = '#aee9f7';
    ctx.fillRect(0, 0, canvas.width, waterTop);
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(0, waterTop, canvas.width, canvas.height - waterTop);

    drawDockAndStickman();

    // Rod (held by stickman, angled 30 deg up)
    // Stickman's right hand position
    const handX = 55 + 25;
    const handY = 50 + 30;
    // Rod tip coordinates (30 deg up, length 110)
    const rodLength = 110;
    const rodAngle = -Math.PI / 6; // 30 deg up from horizontal
    const rodTipX = handX + rodLength * Math.cos(rodAngle);
    const rodTipY = handY + rodLength * Math.sin(rodAngle);
    ctx.save();
    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();
    ctx.restore();

    // Line (from rod tip to hook)
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();
    ctx.restore();

    // Hook
    ctx.save();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hookX, hookY + 10, 8, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();

    // Ripples
    if (gameState === 'waiting' || gameState === 'fish-approaching' || gameState === 'fish-near') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(hookX, hookY + 15, 18 + i * 8, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Background fish
    for (let bgFish of bgFishArr) {
        drawFish(bgFish, { caught: false });
    }

    // Fish
    if (gameState === 'fish-approaching' || gameState === 'fish-near') {
        drawFish(fish);
    }
    if (gameState === 'caught' && fish) {
        // Draw caught fish near the hook, fully visible and larger
        drawFish({ ...fish, x: 200, y: hookY + 25, dir: 1, color: fish.color, shape: fish.shape }, { caught: true });
    }
}

drawScene();

function resetGame() {
    gameState = 'idle';
    drawScene();
}

function startWait() {
    gameState = 'waiting';
    drawScene();
    const waitTime = 3000 + Math.random() * 4000;
    waitTimeout = setTimeout(() => {
        // Pick a fish type
        let rand = Math.random();
        let sum = 0;
        let chosen = null;
        for (const f of fishTypes) {
            sum += f.chance;
            if (rand < sum) {
                chosen = f;
                break;
            }
        }
        // Fish starts at left or right
        const fromLeft = Math.random() < 0.5;
        fish = {
            name: chosen.name,
            color: chosen.color,
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 60,
            dir: fromLeft ? 1 : -1,
            speed: 2 + Math.random() * 1.5,
            shape: chosen.shape,
            size: randomSize(chosen.shape)
        };
        gameState = 'fish-approaching';
        animateFishToHook();
    }, waitTime);
}

function animateFishToHook() {
    if (!fish) return;
    // Target is hook
    const targetX = hookX; // Use current hookX for dynamic movement
    const targetY = hookY + 15;
    function step() {
        if (gameState !== 'fish-approaching') return;
        // Move fish toward hook
        const dx = targetX - fish.x;
        const dy = targetY - fish.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 12) { // slightly larger threshold for dynamic hook
            fish.x = targetX;
            fish.y = targetY;
            gameState = 'fish-near';
            drawScene();
            // Auto-reel up and trigger catch bar
            setTimeout(() => {
                if (gameState === 'fish-near') {
                    // Cancel any wait timeout or fish animation
                    if (waitTimeout) clearTimeout(waitTimeout);
                    if (fishAnim) cancelAnimationFrame(fishAnim);
                    // Rarity: higher = faster bar
                    let rarity = 1;
                    for (let i = 0; i < fishTypes.length; ++i) {
                        if (fishTypes[i].name === fish.name) {
                            rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                            break;
                        }
                    }
                    showCatchBar(rarity, (success) => {
                        if (success) {
                            inventory.push({
                                name: fish.name,
                                color: fish.color,
                                shape: fish.shape,
                                size: fish.size
                            });
                            // Animate hook up
                            let anim = setInterval(() => {
                                if (hookY > hookMinY) {
                                    hookY -= 10;
                                    drawScene();
                                } else {
                                    clearInterval(anim);
                                    setTimeout(resetGame, 1000);
                                }
                            }, 16);
                            gameState = 'caught';
                            drawScene(); // show caught fish clearly
                        } else {
                            setTimeout(resetGame, 1000);
                        }
                    });
                }
            }, 400); // short delay for effect
            return;
        }
        fish.x += (dx / dist) * fish.speed;
        fish.y += (dy / dist) * fish.speed;
        drawScene();
        fishAnim = requestAnimationFrame(step);
    }
    step();
}

function spawnBgFish() {
    if (bgFishArr.length < 4 && Math.random() < 0.5) {
        const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        const fromLeft = Math.random() < 0.5;
        bgFishArr.push({
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 30 + Math.random() * (canvas.height * 2 / 3 - 60),
            dir: fromLeft ? 1 : -1,
            color: type.color,
            speed: 1 + Math.random() * 1.5,
            shape: type.shape,
            size: randomSize(type.shape)
        });
    }
}

function updateBgFish() {
    for (let fish of bgFishArr) {
        fish.x += fish.dir * fish.speed;
    }
    // Remove fish that have left the screen
    bgFishArr = bgFishArr.filter(f => f.x > -60 && f.x < canvas.width + 60);
}

function animate() {
    spawnBgFish();
    updateBgFish();
    drawScene();
    requestAnimationFrame(animate);
}
animate();

// --- CATCH BAR MECHANIC ---
const catchBarPopup = document.getElementById('catchBarPopup');
const catchBar = document.getElementById('catchBar');
const catchBarLine = document.getElementById('catchBarLine');
const catchBarMsg = document.getElementById('catchBarMsg');
let catchBarActive = false;
let catchBarLinePos = 0; // px from left
let catchBarSpeed = 2; // px per tick
let catchBarInterval = null;
let catchBarRarity = 1;
let catchBarCallback = null;

function showCatchBar(rarity, callback) {
    catchBarActive = true;
    catchBarLinePos = 0;
    catchBarRarity = rarity;
    catchBarCallback = callback;
    catchBarMsg.textContent = 'Click to keep the line in the white zone!';
    catchBarPopup.classList.remove('hidden');
    catchBarLine.style.left = '0px';
    catchBarSpeed = 1.5 + rarity * 1.5; // higher rarity = faster
    if (catchBarInterval) clearInterval(catchBarInterval);
    catchBarInterval = setInterval(() => {
        catchBarLinePos += catchBarSpeed;
        if (catchBarLinePos >= 334) {
            // Too slow, lost fish
            endCatchBar(false, 'Too slow! The fish escaped.');
        } else {
            catchBarLine.style.left = catchBarLinePos + 'px';
            // If in red zone (left 60px), lose
            if (catchBarLinePos < 60) {
                // nothing, waiting for click
            } else if (catchBarLinePos < 280) {
                // in white zone
            } else if (catchBarLinePos >= 280) {
                // getting close to end
            }
        }
    }, 32);
}
function endCatchBar(success, msg) {
    catchBarActive = false;
    catchBarMsg.textContent = msg;
    if (catchBarInterval) clearInterval(catchBarInterval);
    setTimeout(() => {
        catchBarPopup.classList.add('hidden');
        if (catchBarCallback) catchBarCallback(success);
    }, 900);
}
catchBarPopup.addEventListener('click', () => {
    if (!catchBarActive) return;
    // If in red zone
    if (catchBarLinePos < 60 || catchBarLinePos > 280) {
        endCatchBar(false, 'You clicked in the red zone! The fish escaped.');
    } else {
        endCatchBar(true, 'Great timing! You caught the fish!');
    }
});
// --- END CATCH BAR ---

canvas.addEventListener('click', () => {
    if (gameState === 'idle') {
        hookY = Math.floor(canvas.height / 2); // higher in the water
        drawScene();
        startWait();
    } else if (gameState === 'waiting') {
        // If user clicks while waiting (no fish), bring rod back up
        if (waitTimeout) clearTimeout(waitTimeout);
        let anim = setInterval(() => {
            if (hookY > 120) {
                hookY -= 10;
                drawScene();
            } else {
                clearInterval(anim);
                setTimeout(resetGame, 600);
            }
        }, 16);
        gameState = 'idle';
    } else if (gameState === 'fish-approaching') {
        // Too early
        resultDiv.textContent = 'Wait for the fish to reach the hook!';
    } else if (gameState === 'fish-near') {
        // Show catch bar instead of instant catch
        clearTimeout(waitTimeout);
        if (fishAnim) cancelAnimationFrame(fishAnim);
        // Rarity: higher = faster bar
        let rarity = 1;
        for (let i = 0; i < fishTypes.length; ++i) {
            if (fishTypes[i].name === fish.name) {
                rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                break;
            }
        }
        showCatchBar(rarity, (success) => {
            if (success) {
                if (fish.name === 'Goldfish') {
                    resultDiv.textContent = 'You caught a goldfish!';
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                } else if (fish.name === 'Boot') {
                    resultDiv.textContent = 'You caught a boot! Try again.';
                } else {
                    resultDiv.textContent = `You caught a ${fish.name}!`;
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                }
                // Add to inventory
                inventory.push({
                    name: fish.name,
                    color: fish.color,
                    shape: fish.shape,
                    size: fish.size
                });
                // Animate hook up
                let anim = setInterval(() => {
                    if (hookY > 120) {
                        hookY -= 10;
                        drawScene();
                    } else {
                        clearInterval(anim);
                        setTimeout(resetGame, 1000);
                    }
                }, 16);
                gameState = 'caught';
                drawScene(); // show caught fish clearly
            } else {
                resultDiv.textContent = 'The fish escaped!';
                setTimeout(resetGame, 1000);
            }
        });
    } else if (gameState === 'caught') {
        // Ignore
    }
});

// --- KEYBINDS FOR HOOK CONTROL ---
function dropHook() {
    if (gameState === 'idle' && !hookDropped) {
        hookDropped = true;
        hookMoving = true;
        hookY = hookMinY;
        hookX = 200;
        gameState = 'waiting';
        drawScene();
        startWait();
    }
}
function reelUpHook(callback) {
    hookMoving = false;
    let anim = setInterval(() => {
        if (hookY > hookMinY) {
            hookY -= 10;
            drawScene();
        } else {
            clearInterval(anim);
            hookDropped = false;
            if (callback) callback();
        }
    }, 16);
}

document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (gameState === 'idle' && e.code === 'Space') {
        dropHook();
        e.preventDefault();
    }
    if (hookDropped && hookMoving) {
        if (e.code === 'KeyW') {
            if (hookY > hookMinY) {
                hookY -= 10;
                if (hookY < hookMinY) hookY = hookMinY;
                drawScene();
            }
        } else if (e.code === 'KeyS') {
            if (hookY < hookMaxY) {
                hookY += 10;
                if (hookY > hookMaxY) hookY = hookMaxY;
                drawScene();
            }
        } else if (e.code === 'KeyA') {
            if (hookX > hookMinX) {
                hookX -= 10;
                if (hookX < hookMinX) hookX = hookMinX;
                drawScene();
            }
        } else if (e.code === 'KeyD') {
            if (hookX < hookMaxX) {
                hookX += 10;
                if (hookX > hookMaxX) hookX = hookMaxX;
                drawScene();
            }
        }
    }
});

// Update drawScene to use hookX and hookY for the line and hook
function drawScene() {
    // Water
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const waterTop = Math.floor(canvas.height / 3);
    ctx.fillStyle = '#aee9f7';
    ctx.fillRect(0, 0, canvas.width, waterTop);
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(0, waterTop, canvas.width, canvas.height - waterTop);

    drawDockAndStickman();

    // Rod (held by stickman, angled 30 deg up)
    // Stickman's right hand position
    const handX = 55 + 25;
    const handY = 50 + 30;
    // Rod tip coordinates (30 deg up, length 110)
    const rodLength = 110;
    const rodAngle = -Math.PI / 6; // 30 deg up from horizontal
    const rodTipX = handX + rodLength * Math.cos(rodAngle);
    const rodTipY = handY + rodLength * Math.sin(rodAngle);
    ctx.save();
    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();
    ctx.restore();

    // Line (from rod tip to hook)
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();
    ctx.restore();

    // Hook
    ctx.save();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hookX, hookY + 10, 8, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();

    // Ripples
    if (gameState === 'waiting' || gameState === 'fish-approaching' || gameState === 'fish-near') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(hookX, hookY + 15, 18 + i * 8, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Background fish
    for (let bgFish of bgFishArr) {
        drawFish(bgFish, { caught: false });
    }

    // Fish
    if (gameState === 'fish-approaching' || gameState === 'fish-near') {
        drawFish(fish);
    }
    if (gameState === 'caught' && fish) {
        // Draw caught fish near the hook, fully visible and larger
        drawFish({ ...fish, x: 200, y: hookY + 25, dir: 1, color: fish.color, shape: fish.shape }, { caught: true });
    }
}

drawScene();

function resetGame() {
    gameState = 'idle';
    drawScene();
}

function startWait() {
    gameState = 'waiting';
    drawScene();
    const waitTime = 3000 + Math.random() * 4000;
    waitTimeout = setTimeout(() => {
        // Pick a fish type
        let rand = Math.random();
        let sum = 0;
        let chosen = null;
        for (const f of fishTypes) {
            sum += f.chance;
            if (rand < sum) {
                chosen = f;
                break;
            }
        }
        // Fish starts at left or right
        const fromLeft = Math.random() < 0.5;
        fish = {
            name: chosen.name,
            color: chosen.color,
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 60,
            dir: fromLeft ? 1 : -1,
            speed: 2 + Math.random() * 1.5,
            shape: chosen.shape,
            size: randomSize(chosen.shape)
        };
        gameState = 'fish-approaching';
        animateFishToHook();
    }, waitTime);
}

function animateFishToHook() {
    if (!fish) return;
    // Target is hook
    const targetX = hookX; // Use current hookX for dynamic movement
    const targetY = hookY + 15;
    function step() {
        if (gameState !== 'fish-approaching') return;
        // Move fish toward hook
        const dx = targetX - fish.x;
        const dy = targetY - fish.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 12) { // slightly larger threshold for dynamic hook
            fish.x = targetX;
            fish.y = targetY;
            gameState = 'fish-near';
            drawScene();
            // Auto-reel up and trigger catch bar
            setTimeout(() => {
                if (gameState === 'fish-near') {
                    // Cancel any wait timeout or fish animation
                    if (waitTimeout) clearTimeout(waitTimeout);
                    if (fishAnim) cancelAnimationFrame(fishAnim);
                    // Rarity: higher = faster bar
                    let rarity = 1;
                    for (let i = 0; i < fishTypes.length; ++i) {
                        if (fishTypes[i].name === fish.name) {
                            rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                            break;
                        }
                    }
                    showCatchBar(rarity, (success) => {
                        if (success) {
                            inventory.push({
                                name: fish.name,
                                color: fish.color,
                                shape: fish.shape,
                                size: fish.size
                            });
                            // Animate hook up
                            let anim = setInterval(() => {
                                if (hookY > hookMinY) {
                                    hookY -= 10;
                                    drawScene();
                                } else {
                                    clearInterval(anim);
                                    setTimeout(resetGame, 1000);
                                }
                            }, 16);
                            gameState = 'caught';
                            drawScene(); // show caught fish clearly
                        } else {
                            setTimeout(resetGame, 1000);
                        }
                    });
                }
            }, 400); // short delay for effect
            return;
        }
        fish.x += (dx / dist) * fish.speed;
        fish.y += (dy / dist) * fish.speed;
        drawScene();
        fishAnim = requestAnimationFrame(step);
    }
    step();
}

function spawnBgFish() {
    if (bgFishArr.length < 4 && Math.random() < 0.5) {
        const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        const fromLeft = Math.random() < 0.5;
        bgFishArr.push({
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 30 + Math.random() * (canvas.height * 2 / 3 - 60),
            dir: fromLeft ? 1 : -1,
            color: type.color,
            speed: 1 + Math.random() * 1.5,
            shape: type.shape,
            size: randomSize(type.shape)
        });
    }
}

function updateBgFish() {
    for (let fish of bgFishArr) {
        fish.x += fish.dir * fish.speed;
    }
    // Remove fish that have left the screen
    bgFishArr = bgFishArr.filter(f => f.x > -60 && f.x < canvas.width + 60);
}

function animate() {
    spawnBgFish();
    updateBgFish();
    drawScene();
    requestAnimationFrame(animate);
}
animate();

// --- CATCH BAR MECHANIC ---
const catchBarPopup = document.getElementById('catchBarPopup');
const catchBar = document.getElementById('catchBar');
const catchBarLine = document.getElementById('catchBarLine');
const catchBarMsg = document.getElementById('catchBarMsg');
let catchBarActive = false;
let catchBarLinePos = 0; // px from left
let catchBarSpeed = 2; // px per tick
let catchBarInterval = null;
let catchBarRarity = 1;
let catchBarCallback = null;

function showCatchBar(rarity, callback) {
    catchBarActive = true;
    catchBarLinePos = 0;
    catchBarRarity = rarity;
    catchBarCallback = callback;
    catchBarMsg.textContent = 'Click to keep the line in the white zone!';
    catchBarPopup.classList.remove('hidden');
    catchBarLine.style.left = '0px';
    catchBarSpeed = 1.5 + rarity * 1.5; // higher rarity = faster
    if (catchBarInterval) clearInterval(catchBarInterval);
    catchBarInterval = setInterval(() => {
        catchBarLinePos += catchBarSpeed;
        if (catchBarLinePos >= 334) {
            // Too slow, lost fish
            endCatchBar(false, 'Too slow! The fish escaped.');
        } else {
            catchBarLine.style.left = catchBarLinePos + 'px';
            // If in red zone (left 60px), lose
            if (catchBarLinePos < 60) {
                // nothing, waiting for click
            } else if (catchBarLinePos < 280) {
                // in white zone
            } else if (catchBarLinePos >= 280) {
                // getting close to end
            }
        }
    }, 32);
}
function endCatchBar(success, msg) {
    catchBarActive = false;
    catchBarMsg.textContent = msg;
    if (catchBarInterval) clearInterval(catchBarInterval);
    setTimeout(() => {
        catchBarPopup.classList.add('hidden');
        if (catchBarCallback) catchBarCallback(success);
    }, 900);
}
catchBarPopup.addEventListener('click', () => {
    if (!catchBarActive) return;
    // If in red zone
    if (catchBarLinePos < 60 || catchBarLinePos > 280) {
        endCatchBar(false, 'You clicked in the red zone! The fish escaped.');
    } else {
        endCatchBar(true, 'Great timing! You caught the fish!');
    }
});
// --- END CATCH BAR ---

canvas.addEventListener('click', () => {
    if (gameState === 'idle') {
        hookY = Math.floor(canvas.height / 2); // higher in the water
        drawScene();
        startWait();
    } else if (gameState === 'waiting') {
        // If user clicks while waiting (no fish), bring rod back up
        if (waitTimeout) clearTimeout(waitTimeout);
        let anim = setInterval(() => {
            if (hookY > 120) {
                hookY -= 10;
                drawScene();
            } else {
                clearInterval(anim);
                setTimeout(resetGame, 600);
            }
        }, 16);
        gameState = 'idle';
    } else if (gameState === 'fish-approaching') {
        // Too early
        resultDiv.textContent = 'Wait for the fish to reach the hook!';
    } else if (gameState === 'fish-near') {
        // Show catch bar instead of instant catch
        clearTimeout(waitTimeout);
        if (fishAnim) cancelAnimationFrame(fishAnim);
        // Rarity: higher = faster bar
        let rarity = 1;
        for (let i = 0; i < fishTypes.length; ++i) {
            if (fishTypes[i].name === fish.name) {
                rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                break;
            }
        }
        showCatchBar(rarity, (success) => {
            if (success) {
                if (fish.name === 'Goldfish') {
                    resultDiv.textContent = 'You caught a goldfish!';
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                } else if (fish.name === 'Boot') {
                    resultDiv.textContent = 'You caught a boot! Try again.';
                } else {
                    resultDiv.textContent = `You caught a ${fish.name}!`;
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                }
                // Add to inventory
                inventory.push({
                    name: fish.name,
                    color: fish.color,
                    shape: fish.shape,
                    size: fish.size
                });
                // Animate hook up
                let anim = setInterval(() => {
                    if (hookY > 120) {
                        hookY -= 10;
                        drawScene();
                    } else {
                        clearInterval(anim);
                        setTimeout(resetGame, 1000);
                    }
                }, 16);
                gameState = 'caught';
                drawScene(); // show caught fish clearly
            } else {
                resultDiv.textContent = 'The fish escaped!';
                setTimeout(resetGame, 1000);
            }
        });
    } else if (gameState === 'caught') {
        // Ignore
    }
});

// --- KEYBINDS FOR HOOK CONTROL ---
function dropHook() {
    if (gameState === 'idle' && !hookDropped) {
        hookDropped = true;
        hookMoving = true;
        hookY = hookMinY;
        hookX = 200;
        gameState = 'waiting';
        drawScene();
        startWait();
    }
}
function reelUpHook(callback) {
    hookMoving = false;
    let anim = setInterval(() => {
        if (hookY > hookMinY) {
            hookY -= 10;
            drawScene();
        } else {
            clearInterval(anim);
            hookDropped = false;
            if (callback) callback();
        }
    }, 16);
}

document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (gameState === 'idle' && e.code === 'Space') {
        dropHook();
        e.preventDefault();
    }
    if (hookDropped && hookMoving) {
        if (e.code === 'KeyW') {
            if (hookY > hookMinY) {
                hookY -= 10;
                if (hookY < hookMinY) hookY = hookMinY;
                drawScene();
            }
        } else if (e.code === 'KeyS') {
            if (hookY < hookMaxY) {
                hookY += 10;
                if (hookY > hookMaxY) hookY = hookMaxY;
                drawScene();
            }
        } else if (e.code === 'KeyA') {
            if (hookX > hookMinX) {
                hookX -= 10;
                if (hookX < hookMinX) hookX = hookMinX;
                drawScene();
            }
        } else if (e.code === 'KeyD') {
            if (hookX < hookMaxX) {
                hookX += 10;
                if (hookX > hookMaxX) hookX = hookMaxX;
                drawScene();
            }
        }
    }
});

// Update drawScene to use hookX and hookY for the line and hook
function drawScene() {
    // Water
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const waterTop = Math.floor(canvas.height / 3);
    ctx.fillStyle = '#aee9f7';
    ctx.fillRect(0, 0, canvas.width, waterTop);
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(0, waterTop, canvas.width, canvas.height - waterTop);

    drawDockAndStickman();

    // Rod (held by stickman, angled 30 deg up)
    // Stickman's right hand position
    const handX = 55 + 25;
    const handY = 50 + 30;
    // Rod tip coordinates (30 deg up, length 110)
    const rodLength = 110;
    const rodAngle = -Math.PI / 6; // 30 deg up from horizontal
    const rodTipX = handX + rodLength * Math.cos(rodAngle);
    const rodTipY = handY + rodLength * Math.sin(rodAngle);
    ctx.save();
    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();
    ctx.restore();

    // Line (from rod tip to hook)
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();
    ctx.restore();

    // Hook
    ctx.save();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hookX, hookY + 10, 8, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();

    // Ripples
    if (gameState === 'waiting' || gameState === 'fish-approaching' || gameState === 'fish-near') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(hookX, hookY + 15, 18 + i * 8, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Background fish
    for (let bgFish of bgFishArr) {
        drawFish(bgFish, { caught: false });
    }

    // Fish
    if (gameState === 'fish-approaching' || gameState === 'fish-near') {
        drawFish(fish);
    }
    if (gameState === 'caught' && fish) {
        // Draw caught fish near the hook, fully visible and larger
        drawFish({ ...fish, x: 200, y: hookY + 25, dir: 1, color: fish.color, shape: fish.shape }, { caught: true });
    }
}

drawScene();

function resetGame() {
    gameState = 'idle';
    drawScene();
}

function startWait() {
    gameState = 'waiting';
    drawScene();
    const waitTime = 3000 + Math.random() * 4000;
    waitTimeout = setTimeout(() => {
        // Pick a fish type
        let rand = Math.random();
        let sum = 0;
        let chosen = null;
        for (const f of fishTypes) {
            sum += f.chance;
            if (rand < sum) {
                chosen = f;
                break;
            }
        }
        // Fish starts at left or right
        const fromLeft = Math.random() < 0.5;
        fish = {
            name: chosen.name,
            color: chosen.color,
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 60,
            dir: fromLeft ? 1 : -1,
            speed: 2 + Math.random() * 1.5,
            shape: chosen.shape,
            size: randomSize(chosen.shape)
        };
        gameState = 'fish-approaching';
        animateFishToHook();
    }, waitTime);
}

function animateFishToHook() {
    if (!fish) return;
    // Target is hook
    const targetX = hookX; // Use current hookX for dynamic movement
    const targetY = hookY + 15;
    function step() {
        if (gameState !== 'fish-approaching') return;
        // Move fish toward hook
        const dx = targetX - fish.x;
        const dy = targetY - fish.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 12) { // slightly larger threshold for dynamic hook
            fish.x = targetX;
            fish.y = targetY;
            gameState = 'fish-near';
            drawScene();
            // Auto-reel up and trigger catch bar
            setTimeout(() => {
                if (gameState === 'fish-near') {
                    // Cancel any wait timeout or fish animation
                    if (waitTimeout) clearTimeout(waitTimeout);
                    if (fishAnim) cancelAnimationFrame(fishAnim);
                    // Rarity: higher = faster bar
                    let rarity = 1;
                    for (let i = 0; i < fishTypes.length; ++i) {
                        if (fishTypes[i].name === fish.name) {
                            rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                            break;
                        }
                    }
                    showCatchBar(rarity, (success) => {
                        if (success) {
                            inventory.push({
                                name: fish.name,
                                color: fish.color,
                                shape: fish.shape,
                                size: fish.size
                            });
                            // Animate hook up
                            let anim = setInterval(() => {
                                if (hookY > hookMinY) {
                                    hookY -= 10;
                                    drawScene();
                                } else {
                                    clearInterval(anim);
                                    setTimeout(resetGame, 1000);
                                }
                            }, 16);
                            gameState = 'caught';
                            drawScene(); // show caught fish clearly
                        } else {
                            setTimeout(resetGame, 1000);
                        }
                    });
                }
            }, 400); // short delay for effect
            return;
        }
        fish.x += (dx / dist) * fish.speed;
        fish.y += (dy / dist) * fish.speed;
        drawScene();
        fishAnim = requestAnimationFrame(step);
    }
    step();
}

function spawnBgFish() {
    if (bgFishArr.length < 4 && Math.random() < 0.5) {
        const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        const fromLeft = Math.random() < 0.5;
        bgFishArr.push({
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 30 + Math.random() * (canvas.height * 2 / 3 - 60),
            dir: fromLeft ? 1 : -1,
            color: type.color,
            speed: 1 + Math.random() * 1.5,
            shape: type.shape,
            size: randomSize(type.shape)
        });
    }
}

function updateBgFish() {
    for (let fish of bgFishArr) {
        fish.x += fish.dir * fish.speed;
    }
    // Remove fish that have left the screen
    bgFishArr = bgFishArr.filter(f => f.x > -60 && f.x < canvas.width + 60);
}

function animate() {
    spawnBgFish();
    updateBgFish();
    drawScene();
    requestAnimationFrame(animate);
}
animate();

// --- CATCH BAR MECHANIC ---
const catchBarPopup = document.getElementById('catchBarPopup');
const catchBar = document.getElementById('catchBar');
const catchBarLine = document.getElementById('catchBarLine');
const catchBarMsg = document.getElementById('catchBarMsg');
let catchBarActive = false;
let catchBarLinePos = 0; // px from left
let catchBarSpeed = 2; // px per tick
let catchBarInterval = null;
let catchBarRarity = 1;
let catchBarCallback = null;

function showCatchBar(rarity, callback) {
    catchBarActive = true;
    catchBarLinePos = 0;
    catchBarRarity = rarity;
    catchBarCallback = callback;
    catchBarMsg.textContent = 'Click to keep the line in the white zone!';
    catchBarPopup.classList.remove('hidden');
    catchBarLine.style.left = '0px';
    catchBarSpeed = 1.5 + rarity * 1.5; // higher rarity = faster
    if (catchBarInterval) clearInterval(catchBarInterval);
    catchBarInterval = setInterval(() => {
        catchBarLinePos += catchBarSpeed;
        if (catchBarLinePos >= 334) {
            // Too slow, lost fish
            endCatchBar(false, 'Too slow! The fish escaped.');
        } else {
            catchBarLine.style.left = catchBarLinePos + 'px';
            // If in red zone (left 60px), lose
            if (catchBarLinePos < 60) {
                // nothing, waiting for click
            } else if (catchBarLinePos < 280) {
                // in white zone
            } else if (catchBarLinePos >= 280) {
                // getting close to end
            }
        }
    }, 32);
}
function endCatchBar(success, msg) {
    catchBarActive = false;
    catchBarMsg.textContent = msg;
    if (catchBarInterval) clearInterval(catchBarInterval);
    setTimeout(() => {
        catchBarPopup.classList.add('hidden');
        if (catchBarCallback) catchBarCallback(success);
    }, 900);
}
catchBarPopup.addEventListener('click', () => {
    if (!catchBarActive) return;
    // If in red zone
    if (catchBarLinePos < 60 || catchBarLinePos > 280) {
        endCatchBar(false, 'You clicked in the red zone! The fish escaped.');
    } else {
        endCatchBar(true, 'Great timing! You caught the fish!');
    }
});
// --- END CATCH BAR ---

canvas.addEventListener('click', () => {
    if (gameState === 'idle') {
        hookY = Math.floor(canvas.height / 2); // higher in the water
        drawScene();
        startWait();
    } else if (gameState === 'waiting') {
        // If user clicks while waiting (no fish), bring rod back up
        if (waitTimeout) clearTimeout(waitTimeout);
        let anim = setInterval(() => {
            if (hookY > 120) {
                hookY -= 10;
                drawScene();
            } else {
                clearInterval(anim);
                setTimeout(resetGame, 600);
            }
        }, 16);
        gameState = 'idle';
    } else if (gameState === 'fish-approaching') {
        // Too early
        resultDiv.textContent = 'Wait for the fish to reach the hook!';
    } else if (gameState === 'fish-near') {
        // Show catch bar instead of instant catch
        clearTimeout(waitTimeout);
        if (fishAnim) cancelAnimationFrame(fishAnim);
        // Rarity: higher = faster bar
        let rarity = 1;
        for (let i = 0; i < fishTypes.length; ++i) {
            if (fishTypes[i].name === fish.name) {
                rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                break;
            }
        }
        showCatchBar(rarity, (success) => {
            if (success) {
                if (fish.name === 'Goldfish') {
                    resultDiv.textContent = 'You caught a goldfish!';
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                } else if (fish.name === 'Boot') {
                    resultDiv.textContent = 'You caught a boot! Try again.';
                } else {
                    resultDiv.textContent = `You caught a ${fish.name}!`;
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                }
                // Add to inventory
                inventory.push({
                    name: fish.name,
                    color: fish.color,
                    shape: fish.shape,
                    size: fish.size
                });
                // Animate hook up
                let anim = setInterval(() => {
                    if (hookY > 120) {
                        hookY -= 10;
                        drawScene();
                    } else {
                        clearInterval(anim);
                        setTimeout(resetGame, 1000);
                    }
                }, 16);
                gameState = 'caught';
                drawScene(); // show caught fish clearly
            } else {
                resultDiv.textContent = 'The fish escaped!';
                setTimeout(resetGame, 1000);
            }
        });
    } else if (gameState === 'caught') {
        // Ignore
    }
});

// --- KEYBINDS FOR HOOK CONTROL ---
function dropHook() {
    if (gameState === 'idle' && !hookDropped) {
        hookDropped = true;
        hookMoving = true;
        hookY = hookMinY;
        hookX = 200;
        gameState = 'waiting';
        drawScene();
        startWait();
    }
}
function reelUpHook(callback) {
    hookMoving = false;
    let anim = setInterval(() => {
        if (hookY > hookMinY) {
            hookY -= 10;
            drawScene();
        } else {
            clearInterval(anim);
            hookDropped = false;
            if (callback) callback();
        }
    }, 16);
}

document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (gameState === 'idle' && e.code === 'Space') {
        dropHook();
        e.preventDefault();
    }
    if (hookDropped && hookMoving) {
        if (e.code === 'KeyW') {
            if (hookY > hookMinY) {
                hookY -= 10;
                if (hookY < hookMinY) hookY = hookMinY;
                drawScene();
            }
        } else if (e.code === 'KeyS') {
            if (hookY < hookMaxY) {
                hookY += 10;
                if (hookY > hookMaxY) hookY = hookMaxY;
                drawScene();
            }
        } else if (e.code === 'KeyA') {
            if (hookX > hookMinX) {
                hookX -= 10;
                if (hookX < hookMinX) hookX = hookMinX;
                drawScene();
            }
        } else if (e.code === 'KeyD') {
            if (hookX < hookMaxX) {
                hookX += 10;
                if (hookX > hookMaxX) hookX = hookMaxX;
                drawScene();
            }
        }
    }
});

// Update drawScene to use hookX and hookY for the line and hook
function drawScene() {
    // Water
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const waterTop = Math.floor(canvas.height / 3);
    ctx.fillStyle = '#aee9f7';
    ctx.fillRect(0, 0, canvas.width, waterTop);
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(0, waterTop, canvas.width, canvas.height - waterTop);

    drawDockAndStickman();

    // Rod (held by stickman, angled 30 deg up)
    // Stickman's right hand position
    const handX = 55 + 25;
    const handY = 50 + 30;
    // Rod tip coordinates (30 deg up, length 110)
    const rodLength = 110;
    const rodAngle = -Math.PI / 6; // 30 deg up from horizontal
    const rodTipX = handX + rodLength * Math.cos(rodAngle);
    const rodTipY = handY + rodLength * Math.sin(rodAngle);
    ctx.save();
    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();
    ctx.restore();

    // Line (from rod tip to hook)
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();
    ctx.restore();

    // Hook
    ctx.save();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hookX, hookY + 10, 8, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();

    // Ripples
    if (gameState === 'waiting' || gameState === 'fish-approaching' || gameState === 'fish-near') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(hookX, hookY + 15, 18 + i * 8, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Background fish
    for (let bgFish of bgFishArr) {
        drawFish(bgFish, { caught: false });
    }

    // Fish
    if (gameState === 'fish-approaching' || gameState === 'fish-near') {
        drawFish(fish);
    }
    if (gameState === 'caught' && fish) {
        // Draw caught fish near the hook, fully visible and larger
        drawFish({ ...fish, x: 200, y: hookY + 25, dir: 1, color: fish.color, shape: fish.shape }, { caught: true });
    }
}

drawScene();

function resetGame() {
    gameState = 'idle';
    drawScene();
}

function startWait() {
    gameState = 'waiting';
    drawScene();
    const waitTime = 3000 + Math.random() * 4000;
    waitTimeout = setTimeout(() => {
        // Pick a fish type
        let rand = Math.random();
        let sum = 0;
        let chosen = null;
        for (const f of fishTypes) {
            sum += f.chance;
            if (rand < sum) {
                chosen = f;
                break;
            }
        }
        // Fish starts at left or right
        const fromLeft = Math.random() < 0.5;
        fish = {
            name: chosen.name,
            color: chosen.color,
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 60,
            dir: fromLeft ? 1 : -1,
            speed: 2 + Math.random() * 1.5,
            shape: chosen.shape,
            size: randomSize(chosen.shape)
        };
        gameState = 'fish-approaching';
        animateFishToHook();
    }, waitTime);
}

function animateFishToHook() {
    if (!fish) return;
    // Target is hook
    const targetX = hookX; // Use current hookX for dynamic movement
    const targetY = hookY + 15;
    function step() {
        if (gameState !== 'fish-approaching') return;
        // Move fish toward hook
        const dx = targetX - fish.x;
        const dy = targetY - fish.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 12) { // slightly larger threshold for dynamic hook
            fish.x = targetX;
            fish.y = targetY;
            gameState = 'fish-near';
            drawScene();
            // Auto-reel up and trigger catch bar
            setTimeout(() => {
                if (gameState === 'fish-near') {
                    // Cancel any wait timeout or fish animation
                    if (waitTimeout) clearTimeout(waitTimeout);
                    if (fishAnim) cancelAnimationFrame(fishAnim);
                    // Rarity: higher = faster bar
                    let rarity = 1;
                    for (let i = 0; i < fishTypes.length; ++i) {
                        if (fishTypes[i].name === fish.name) {
                            rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                            break;
                        }
                    }
                    showCatchBar(rarity, (success) => {
                        if (success) {
                            inventory.push({
                                name: fish.name,
                                color: fish.color,
                                shape: fish.shape,
                                size: fish.size
                            });
                            // Animate hook up
                            let anim = setInterval(() => {
                                if (hookY > hookMinY) {
                                    hookY -= 10;
                                    drawScene();
                                } else {
                                    clearInterval(anim);
                                    setTimeout(resetGame, 1000);
                                }
                            }, 16);
                            gameState = 'caught';
                            drawScene(); // show caught fish clearly
                        } else {
                            setTimeout(resetGame, 1000);
                        }
                    });
                }
            }, 400); // short delay for effect
            return;
        }
        fish.x += (dx / dist) * fish.speed;
        fish.y += (dy / dist) * fish.speed;
        drawScene();
        fishAnim = requestAnimationFrame(step);
    }
    step();
}

function spawnBgFish() {
    if (bgFishArr.length < 4 && Math.random() < 0.5) {
        const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        const fromLeft = Math.random() < 0.5;
        bgFishArr.push({
            x: fromLeft ? -40 : canvas.width + 40,
            y: Math.floor(canvas.height / 3) + 30 + Math.random() * (canvas.height * 2 / 3 - 60),
            dir: fromLeft ? 1 : -1,
            color: type.color,
            speed: 1 + Math.random() * 1.5,
            shape: type.shape,
            size: randomSize(type.shape)
        });
    }
}

function updateBgFish() {
    for (let fish of bgFishArr) {
        fish.x += fish.dir * fish.speed;
    }
    // Remove fish that have left the screen
    bgFishArr = bgFishArr.filter(f => f.x > -60 && f.x < canvas.width + 60);
}

function animate() {
    spawnBgFish();
    updateBgFish();
    drawScene();
    requestAnimationFrame(animate);
}
animate();

// --- CATCH BAR MECHANIC ---
const catchBarPopup = document.getElementById('catchBarPopup');
const catchBar = document.getElementById('catchBar');
const catchBarLine = document.getElementById('catchBarLine');
const catchBarMsg = document.getElementById('catchBarMsg');
let catchBarActive = false;
let catchBarLinePos = 0; // px from left
let catchBarSpeed = 2; // px per tick
let catchBarInterval = null;
let catchBarRarity = 1;
let catchBarCallback = null;

function showCatchBar(rarity, callback) {
    catchBarActive = true;
    catchBarLinePos = 0;
    catchBarRarity = rarity;
    catchBarCallback = callback;
    catchBarMsg.textContent = 'Click to keep the line in the white zone!';
    catchBarPopup.classList.remove('hidden');
    catchBarLine.style.left = '0px';
    catchBarSpeed = 1.5 + rarity * 1.5; // higher rarity = faster
    if (catchBarInterval) clearInterval(catchBarInterval);
    catchBarInterval = setInterval(() => {
        catchBarLinePos += catchBarSpeed;
        if (catchBarLinePos >= 334) {
            // Too slow, lost fish
            endCatchBar(false, 'Too slow! The fish escaped.');
        } else {
            catchBarLine.style.left = catchBarLinePos + 'px';
            // If in red zone (left 60px), lose
            if (catchBarLinePos < 60) {
                // nothing, waiting for click
            } else if (catchBarLinePos < 280) {
                // in white zone
            } else if (catchBarLinePos >= 280) {
                // getting close to end
            }
        }
    }, 32);
}
function endCatchBar(success, msg) {
    catchBarActive = false;
    catchBarMsg.textContent = msg;
    if (catchBarInterval) clearInterval(catchBarInterval);
    setTimeout(() => {
        catchBarPopup.classList.add('hidden');
        if (catchBarCallback) catchBarCallback(success);
    }, 900);
}
catchBarPopup.addEventListener('click', () => {
    if (!catchBarActive) return;
    // If in red zone
    if (catchBarLinePos < 60 || catchBarLinePos > 280) {
        endCatchBar(false, 'You clicked in the red zone! The fish escaped.');
    } else {
        endCatchBar(true, 'Great timing! You caught the fish!');
    }
});
// --- END CATCH BAR ---

canvas.addEventListener('click', () => {
    if (gameState === 'idle') {
        hookY = Math.floor(canvas.height / 2); // higher in the water
        drawScene();
        startWait();
    } else if (gameState === 'waiting') {
        // If user clicks while waiting (no fish), bring rod back up
        if (waitTimeout) clearTimeout(waitTimeout);
        let anim = setInterval(() => {
            if (hookY > 120) {
                hookY -= 10;
                drawScene();
            } else {
                clearInterval(anim);
                setTimeout(resetGame, 600);
            }
        }, 16);
        gameState = 'idle';
    } else if (gameState === 'fish-approaching') {
        // Too early
        resultDiv.textContent = 'Wait for the fish to reach the hook!';
    } else if (gameState === 'fish-near') {
        // Show catch bar instead of instant catch
        clearTimeout(waitTimeout);
        if (fishAnim) cancelAnimationFrame(fishAnim);
        // Rarity: higher = faster bar
        let rarity = 1;
        for (let i = 0; i < fishTypes.length; ++i) {
            if (fishTypes[i].name === fish.name) {
                rarity = Math.max(1, Math.ceil(10 * (1 - fishTypes[i].chance)));
                break;
            }
        }
        showCatchBar(rarity, (success) => {
            if (success) {
                if (fish.name === 'Goldfish') {
                    resultDiv.textContent = 'You caught a goldfish!';
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                } else if (fish.name === 'Boot') {
                    resultDiv.textContent = 'You caught a boot! Try again.';
                } else {
                    resultDiv.textContent = `You caught a ${fish.name}!`;
                    score++;
                    scoreDiv.textContent = `Fish Caught: ${score}`;
                }
                // Add to inventory
                inventory.push({
                    name: fish.name,
                    color: fish.color,
                    shape: fish.shape,
                    size: fish.size
                });
                // Animate hook up
                let anim = setInterval(() => {
                    if (hookY > 120) {
                        hookY -= 10;
                        drawScene();
                    } else {
                        clearInterval(anim);
                        setTimeout(resetGame, 1000);
                    }
                }, 16);
                gameState = 'caught';
                drawScene(); // show caught fish clearly
            } else {
                resultDiv.textContent = 'The fish escaped!';
                setTimeout(resetGame, 1000);
            }
        });
    } else if (gameState === 'caught') {
        // Ignore
    }
});

// --- KEYBINDS FOR HOOK CONTROL ---
function dropHook() {
    if (gameState === 'idle' && !hookDropped) {
        hookDropped = true;
        hookMoving = true;
        hookY = hookMinY;
        hookX = 200;
        gameState = 'waiting';
        drawScene();
        startWait();
    }
}
function reelUpHook(callback) {
    hookMoving = false;
    let anim = setInterval(() => {
        if (hookY > hookMinY) {
            hookY -= 10;
            drawScene();
        } else {
            clearInterval(anim);
            hookDropped = false;
            if (callback) callback();
        }
    }, 16);
}

document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (gameState === 'idle' && e.code === 'Space') {
        dropHook();
        e.preventDefault();
    }
    if (hookDropped && hookMoving) {
        if (e.code === 'KeyW') {
            if (hookY > hookMinY) {
                hookY -= 10;
                if (hookY < hookMinY) hookY = hookMinY;
                drawScene();
            }
        } else if (e.code === 'KeyS') {
            if (hookY < hookMaxY) {
                hookY += 10;
                if (hookY > hookMaxY) hookY = hookMaxY;
                drawScene();
            }
        } else if (e.code === 'KeyA') {
            if (hookX > hookMinX) {
                hookX -= 10;
                if (hookX < hookMinX) hookX = hookMinX;
                drawScene();
            }
        } else if (e.code === 'KeyD') {
            if (hookX < hookMaxX) {
                hookX += 10;
                if (hookX > hookMaxX) hookX = hookMaxX;
                drawScene();
            }
        }
    }
});

// Update drawScene to use hookX and hookY for the line and hook
function drawScene() {
    // Water
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const waterTop = Math.floor(canvas.height / 3);
    ctx.fillStyle = '#aee9f7';
    ctx.fillRect(0, 0, canvas.width, waterTop);
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(0, waterTop, canvas.width, canvas.height - waterTop);

    drawDockAndStickman();

    // Rod (held by stickman, angled 30 deg up)
    // Stickman's right hand position
    const handX = 55 + 25;
    const handY = 50 + 30;
    // Rod tip coordinates (30 deg up, length 110)
    const rodLength = 110;
    const rodAngle = -Math.PI / 6; // 30 deg up from horizontal
    const rodTipX = handX + rodLength * Math.cos(rodAngle);
    const rodTipY = handY + rodLength * Math.sin(rodAngle);
    ctx.save();
    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();
    ctx.restore();

    // Line (from rod tip to hook)
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();
    ctx.restore();

    // Hook
    ctx.save();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hookX, hookY + 10, 8, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();

    // Ripples
    if (gameState === 'waiting' || gameState === 'fish-approaching' || gameState === 'fish-near') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(hookX, hookY + 15, 18 + i * 8, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Background fish
    for (let bgFish of bgFishArr) {
        drawFish(bgFish, { caught: false });
    }

    // Fish
    if (gameState === 'fish-approaching' || gameState === 'fish-near') {
        drawFish(fish);
    }
    if (gameState === 'caught' && fish) {
        // Draw caught fish near the hook, fully visible and larger
        drawFish({ ...fish, x: 200, y: hookY + 25, dir: 1, color: fish.color, shape: fish.shape }, { caught: true });
    }
}

drawScene();

function resetGame() {
    gameState = 'idle';
    drawScene();
}

function startWait() {
    gameState = 'waiting';
    drawScene();
    const waitTime = 3000 + Math.random() * 4000;
    waitTimeout = setTimeout(() => {