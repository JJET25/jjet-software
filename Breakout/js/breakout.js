/*
 * Simple implementation of the Breakout game
 *
 * Jesús José Espinoza Torruco
 * 2026-05-15
 */

"use strict";

// Global variables 
const canvasWidth = 800;
const canvasHeight = 600;

let ctx;
let game;
let oldTime = 0;

// Variables for speed
let initialSpeed = 0.5;
let ballSpeed = 0.5;
let paddleSpeed = 0.5;
let speedIncrease = 1.005;

// Class for Ball which comes from the library GameObject
// Represents the game ball
class Ball extends GameObject {
    // Constructor for the class, set properties and default velocity
    constructor(position, width, height, color) {
        super(position, width, height, color, "ball");
        this.velocity = new Vector(0, 0);
    }

    // Moves the ball over time and updates the collider
    update(deltaTime) {
        this.position = this.position.plus(this.velocity.times(ballSpeed).times(deltaTime));
        this.updateCollider();
    }

    // Resets the ball position, function after the ball enter the lose area
    reset() {
        this.position.x = canvasWidth / 2;
        this.position.y = canvasHeight - 100;
        this.velocity = new Vector(0, 0);
    }

    // Help me player serve the ball to start the game or a new life
    serve(levelMultiplier = 1) {
        let angle = (Math.random() * (Math.PI / 2)) + (Math.PI / 4);
        this.velocity = new Vector(Math.cos(angle), Math.sin(angle)).normalize();
        ballSpeed = initialSpeed * levelMultiplier;
    }

    // Draws the ball as a filled circle on the canvas
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.halfSize.x, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Class for Paddle, the controllable object for the player
class Paddle extends GameObject {
    // Constructor for the class, initializes movement controls, keys array, and attributes
    constructor(position, width, height, color) {
        super(position, width, height, color, "paddle");
        this.velocity = new Vector(0, 0);

        this.motion = {
            left:  { axis: "x", sign: -1 },
            right: { axis: "x", sign:  1 },
        };

        this.keys = [];
    }

    // Calculates movement from active keys, applies speed, and keeps within bounds
    update(deltaTime) {
        this.velocity.x = 0;
        this.velocity.y = 0;
        for (const direction of this.keys) {
            const axis = this.motion[direction].axis;
            const sign = this.motion[direction].sign;
            this.velocity[axis] += sign;
        }
        this.velocity = this.velocity.normalize().times(paddleSpeed);
        this.position = this.position.plus(this.velocity.times(deltaTime));
        this.clampWithinCanvas();
        this.updateCollider();
    }

    // Restricts the paddle from leaving the canvas edges
    clampWithinCanvas() {
        if (this.position.x - this.halfSize.x < 0)
            this.position.x = this.halfSize.x;
        if (this.position.x + this.halfSize.x > canvasWidth)
            this.position.x = canvasWidth - this.halfSize.x;
    }
}

// Class for PowerUp, represents power up dropped by broken blocks that provide a buff
class PowerUp extends GameObject {
    // Sets up dimensions, item type, and downward movement speed
    constructor(position, type) {
        super(position, 30, 15, "gold", "powerup");
        this.type = type;
        this.velocity = new Vector(0, 0.2);
    }
    
    // Updates the vertical position and its collider as it falls
    update(deltaTime) {
        this.position.y += this.velocity.y * deltaTime;
        this.updateCollider();
    }

    // Draws the power-up as a colored rectangle based on type
    draw(ctx) {
        ctx.fillStyle = (this.type === 'WIDE') ? "gold" : "cyan";
        ctx.fillRect(this.position.x - this.halfSize.x, this.position.y - this.halfSize.y, this.size.x, this.size.y);
    }
}

// Class for the game, manages the complete game loop, rules, setup, and interactions
class Game {
    // Constructor that initializes scores, statuses, audio elements, and text labels
    constructor() {
        this.lives = 3;
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.inPlay = false;
        this.destroyedCount = 0;
        this.powerUps = [];

        this.createEventListeners();
        this.initObjects();

        this.ping = document.createElement("audio");
        this.ping.src = "../assets/audio/4387__noisecollector__pongblipe4.wav";

        this.scoreLabelLeft = new TextLabel(15, 35, "bold 18px Arial", "#ffffff");
        this.levelLabel    = new TextLabel(canvasWidth / 2 - 40, 35, "bold 18px Arial", "#ffffff");
    }

    // Instantiates game entities: walls, paddle, and ball
    initObjects() {
        this.paddle = new Paddle(new Vector(canvasWidth / 2, canvasHeight - 30), 120, 15, "#ffffff");
        this.ball   = new Ball(new Vector(canvasWidth / 2, canvasHeight - 80), 12, 12, "#ffffff");

        this.wallTop   = new Paddle(new Vector(canvasWidth / 2, 0),              canvasWidth,  20, "#334155");
        this.wallLeft  = new Paddle(new Vector(0, canvasHeight / 2),             20, canvasHeight, "#334155");
        this.wallRight = new Paddle(new Vector(canvasWidth, canvasHeight / 2),   20, canvasHeight, "#334155");
        this.Lose      = new Paddle(new Vector(canvasWidth / 2, canvasHeight + 10), canvasWidth, 20, "transparent");

        this.actors = [this.wallTop, this.wallLeft, this.wallRight, this.paddle, this.ball];

        this.generateBoxes();
    }

    // Spawns the rows and columns of breakable blocks
    generateBoxes() {
        this.boxes = [];
        const rows = Math.min(2 + this.level, 6);
        const cols = 7;

        const rowColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

        const boxWidth  = 90;
        const boxHeight = 26;
        const padding   = 12;
        const offsetTop = 75;
        const totalGridWidth = cols * boxWidth + (cols - 1) * padding;
        const offsetLeft = Math.round((canvasWidth - totalGridWidth) / 2) + boxWidth / 2;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const posX = offsetLeft + i * (boxWidth + padding);
                const posY = offsetTop  + j * (boxHeight + padding);
                this.boxes.push(new Paddle(new Vector(posX, posY), boxWidth, boxHeight, rowColors[j % rowColors.length]));
            }
        }
    }

    // Draws circles representing remaining player lives
    drawLives(ctx) {
        const r = 8;
        const y = 28;
        for (let i = 0; i < this.lives; i++) {
            ctx.fillStyle = "#e74c3c";
            ctx.beginPath();
            ctx.arc(canvasWidth - 20 - i * (r * 2 + 6), y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Shows the overlay text screens when a game ends
    drawGameOver(ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        
        ctx.font = "bold 48px Arial";
        ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2 - 20);
        
        ctx.font = "24px Arial";
        ctx.fillText(`Final Score: ${this.score}`, canvasWidth / 2, canvasHeight / 2 + 30);
        
        ctx.font = "18px Arial";
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText("Press SPACE to Restart", canvasWidth / 2, canvasHeight / 2 + 80);
        
        ctx.textAlign = "left";
    }

    // Displays the current game interface elements, actors, blocks, and overlays
    draw(ctx) {
        this.scoreLabelLeft.draw(ctx, `Score  ${this.score}`);
        this.levelLabel.draw(ctx, `Level  ${this.level}`);
        this.drawLives(ctx);

        for (let actor of this.actors) actor.draw(ctx);
        for (let box   of this.boxes)  box.draw(ctx);

        for (let p of this.powerUps) p.draw(ctx);

        if (!this.inPlay && !this.gameOver) {
            ctx.fillStyle = "#aaaaaa";
            ctx.font = "18px Arial";
        }

        if (this.gameOver) {
            this.drawGameOver(ctx);
        }
    }

    // Processes game logic, actor updates, out of bounds status, and all element collisions
    update(deltaTime) {
        if (this.gameOver) return;

        this.paddle.update(deltaTime);
        this.ball.update(deltaTime);

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].update(deltaTime);

            if (boxOverlap(this.paddle, this.powerUps[i])) {
                this.applyPowerUp(this.powerUps[i].type);
                this.powerUps.splice(i, 1);
                continue;
            }

            if (this.powerUps[i].position.y > canvasHeight) {
                this.powerUps.splice(i, 1);
            }
        }

        if (boxOverlap(this.paddle, this.ball)) {
            this.ball.velocity.y *= -1;
            this.handleHit();
        }

        if (boxOverlap(this.wallTop, this.ball)) {
            this.ball.velocity.y *= -1;
        }

        if (boxOverlap(this.wallLeft, this.ball) || boxOverlap(this.wallRight, this.ball)) {
            this.ball.velocity.x *= -1;
        }

        if (boxOverlap(this.Lose, this.ball)) {
            this.lives -= 1;
            this.ball.reset();
            this.inPlay = false;

            if (this.lives <= 0) {
                this.gameOver = true;
            }
        }

        for (let i = 0; i < this.boxes.length; i++) {
            if (boxOverlap(this.boxes[i], this.ball)) {
                this.ball.velocity.y *= -1;
                
                this.destroyedCount++;
                if (this.destroyedCount >= 4) {
                    const spawnPos = new Vector(this.boxes[i].position.x, this.boxes[i].position.y);
                    this.powerUps.push(new PowerUp(spawnPos, 'WIDE'));
                    this.destroyedCount = 0;
                }

                this.boxes.splice(i, 1);
                this.score += 10;
                this.handleHit();
                break;
            }
        }

        if (this.boxes.length === 0 && this.inPlay) {
            this.levelUp();
        }
    }

    // Advances the game level, regenerates blocks, and repositions the ball
    levelUp() {
        this.level++;
        this.generateBoxes();
        this.ball.reset();
        this.inPlay = false;
    }
    
    // Extends paddle width temporarily when receiving a specific item effect
    applyPowerUp(type) {
        if (type === 'WIDE') {
            const originalWidth = this.paddle.size.x;
            this.paddle.size.x = 200; // Raqueta más grande
            this.paddle.halfSize.x = 100;

            // Volver a la normalidad tras 8 segundos
            setTimeout(() => {
                this.paddle.size.x = 120;
                this.paddle.halfSize.x = 60;
            }, 8000);
        }
    }

    // Resets counters, arrays, speeds, and objects to start fresh
    restart() {
        this.lives = 3;
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.inPlay = false;
        this.destroyedCount = 0;
        this.powerUps = [];
        ballSpeed = initialSpeed;
        this.initObjects();
    }

    // Multiplies the ball movement speed and plays audio
    handleHit() {
        ballSpeed *= speedIncrease;
        this.ping.play();
    }

    // Configures keyboard listeners for playing and restarting the game
    createEventListeners() {
        window.addEventListener('keydown', (event) => {
            if (this.gameOver) {
                if (event.key == ' ') this.restart();
                return;
            }

            if (event.key == 'a') this.addKey('left',  this.paddle);
            if (event.key == 'd') this.addKey('right', this.paddle);
            if (event.key == ' ' && !this.inPlay) {
                this.ball.serve(Math.pow(1.1, this.level - 1));
                this.inPlay = true;
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key == 'a') this.delKey('left',  this.paddle);
            if (event.key == 'd') this.delKey('right', this.paddle);
        });
    }

    // Inserts a movement control tag into the tracking object list
    addKey(direction, object) {
        if (!object.keys.includes(direction)) object.keys.push(direction);
    }

    // Removes a movement control tag from the tracking object list
    delKey(direction, object) {
        const idx = object.keys.indexOf(direction);
        if (idx !== -1) object.keys.splice(idx, 1);
    }
}


function main() {
    const canvas = document.getElementById('canvas');
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext('2d');
    game = new Game();
    drawScene(0);
}

function drawScene(newTime) {
    let deltaTime = newTime - oldTime;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    game.update(deltaTime);
    game.draw(ctx);
    oldTime = newTime;
    requestAnimationFrame(drawScene);
}
