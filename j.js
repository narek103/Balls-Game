const startBtn = document.getElementById("startBtn");
const helpButton = document.getElementById("helpButton");
const restartBtn = document.getElementById("restartBtn");  // Select the restart button
let a = true
let canvas, ctx, count;
let balls = [];
let blinks = [];
let clickedBalls = []; // Track the balls clicked by the player
let blinkOrder = []; // Track the order in which balls blinked
let blinkingSequence = []; // Store the order of blinking balls
let firstBlinkRevealed = false; // Track if the first ball has been revealed
let flag = 1; // Game state flag
let gameStarted = false; // Track if the game has started
let gameOver = false; // Track if the game is over
let lives = 3; // Number of lives
let score = 0; // Player's score

// Start the game
function hbtn() {
    if (gameStarted || gameOver) return;  // Prevent starting the game again if it's already started or over
    gameStarted = true; // Mark game as started
    count = +prompt("Enter balls count.", 15);
    count = count < 15 || count > 99 ? 5 : count;
    
    // If canvas is not created yet, create it
    if (!canvas) {
        canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    startBtn.disabled = true;
    startBtn.innerText = "Game Started...";
    restartBtn.disabled = true;  // Disable the restart button during the game
    resetGameState();  // Reset game state and start the game
    loop(); // Start the game loop
}

// Reset game state
function resetGameState() {
    balls = [];
    blinks = [];
    clickedBalls = [];
    blinkOrder = [];
    blinkingSequence = []; // Reset the blinking sequence
    firstBlinkRevealed = false; // Reset help status
    lives = 3; // Reset lives
    score = 0; // Reset score
    flag = 1;
    updateGameInfo(); // Update the information display
    gameOver = false; // Reset the game over flag
}

// Reset game after win or loss
function resetGame() {
    gameStarted = false;
    startBtn.disabled = false;
    startBtn.innerText = "Start Game";
    restartBtn.disabled = false;  // Enable the restart button
    restartBtn.innerText = "Restart Game"; // Show Restart button text
    resetGameState(); // Reset the game state
}

// Update game info (lives and score)
function updateGameInfo() {
    document.getElementById("lives").innerText = `Lives: ${lives}`;
    document.getElementById("score").innerText = `Score: ${score}`;
}

// Create a new ball
function createBall() {
    const radius = 40;
    let r = Math.floor(Math.random() * 255);
    let g = Math.floor(Math.random() * 255);
    let b = Math.floor(Math.random() * 255);
    const rect = canvas.getBoundingClientRect();
    let x, y;
    do {
        x = getRandInt(radius, canvas.width - radius);
        y = getRandInt(radius, canvas.height - radius - rect.y);
    } while (checkOverlap(x, y));

    const gradient = ctx.createRadialGradient(x, y, radius / 4, x, y, radius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(1, `rgba(${r - 30}, ${g - 30}, ${b - 30}, 0.8)`);

    let ball = new Ball(x, y, gradient, balls.length + 1, radius);
    balls.push(ball);
}

// Get random integer between min and max
function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// Check if balls overlap
function checkOverlap(x, y) {
    return balls.some(function (ball) {
        const dx = x - ball.x;
        const dy = y - ball.y;
        const distance = dx * dx + dy * dy;
        return Math.sqrt(distance) < 2 * ball.r;
    });
}

// Draw everything on canvas
function draw() {
    if (gameOver) return;  // Stop drawing when the game is over
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    if (balls.length < count) {
        createBall();
    } else if (flag) {
        intervalBlink(); // Start flashing balls
        flag = 0;
    }

    balls.forEach(function (ball) {
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "black"; // Text color
        ctx.font = `${ball.r / 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ball.number, ball.x, ball.y);
    });
}

// Flash a random ball
function randomBlinkBall() {
    let index;
    do {
        index = getRandInt(0, balls.length);
    } while (blinks.indexOf(index) !== -1); // Ensure ball isn't already flashing
    blinks.push(index);
    blinkOrder.push(balls[index].number); // Track the order in which balls blinked

    // Store the number of the ball that blinked for the Help button
    blinkingSequence.push(balls[index].number); 

    let r = Math.floor(Math.random() * 255);
    let g = Math.floor(Math.random() * 255);
    let b = Math.floor(Math.random() * 255);
    balls[index].blink(`rgb(${r}, ${g}, ${b})`); // Make it blink
}

// Flashing balls interval
function intervalBlink() {
    let count = 0;
    let id = setInterval(() => {
        if (gameOver) {
            clearInterval(id);  // Stop blinking if game is over
            return;
        }              
        randomBlinkBall();
        if (count >= 14) { // Stop after 10 flashes
            clearInterval(id);
            window.addEventListener("click", handleClick); // Listen for clicks
          
        }
        count++;
    }, 1000);
}

// Handle user click on canvas
function handleClick(evt) {
    if (gameOver) return;  // Do nothing if the game is over
    const rect = canvas.getBoundingClientRect();
    const mouseX = evt.pageX - rect.x;
    const mouseY = evt.pageY - rect.y;

    balls.forEach(function (ball) {
        const dx = mouseX - ball.x;
        const dy = mouseY - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < ball.r) {
            let expectedBall = blinkOrder[clickedBalls.length]; // Get the next expected ball from the blink order

            if (ball.number === expectedBall) {
                // Correct ball clicked, change color to lime
                ball.blink("lime");
                score += 1; // Add 1 point for correct click
                clickedBalls.push(ball.number); // Track the clicked ball

                updateGameInfo(); // Update the score and lives display

                if (clickedBalls.length === blinkOrder.length) {
                    // If the player has clicked all the balls in the correct order
                    gameOver = true; // Set gameOver flag to true
                    alert("Winner winner chicken dinner!");
                    restartBtn.disabled = false; // Enable the restart button
                }
            } else {
                // Incorrect ball clicked, change color to red
                ball.blink("red");
                lives--; // Lose a life for wrong click
                updateGameInfo(); // Update the score and lives display
                if (lives === 0) {
                    gameOver = true; // Set gameOver flag to true
                    alert("Game Over!");
                    restartBtn.disabled = false; // Enable the restart button
                }
            }
        }
    });
}

// Show the first blinking ball when help is clicked
function showHelp() {
    if (blinkingSequence.length === 0) {
        alert("No balls have blinked yet!");
        return;
    }

    // If the first ball hasn't been revealed yet
    if (!firstBlinkRevealed) {
        alert("The first blinking ball was: " + blinkingSequence.join(", "));
        firstBlinkRevealed = true; // Mark that the first ball has been revealed
    } else {
        alert("The first ball has already been shown. No further help available.");
    }
}

// Start the game loop
function loop() {
    if (gameOver) return;  // Stop the game loop if the game is over
    requestAnimationFrame(loop);
    draw();
}

// Ball class to handle ball properties and blinking
class Ball {
    constructor(x, y, color, number, r) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.number = number;
        this.r = r;
    }

    blink(blinkCol) {
        let color = this.color;
        this.color = blinkCol;
        setTimeout(() => {
            this.color = color;
        }, 1000);
    }
}

// Add event listener for the help button
helpButton.addEventListener("click", showHelp);

// Add event listener for the start button
startBtn.addEventListener("click", hbtn);

// Add event listener for the restart button
restartBtn.addEventListener("click", () => {
    resetGame();  // Reset the game and start again
    hbtn(); // Start the game again after restart
});

// Handle window resize to adjust canvas size
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Update the initial game info display
updateGameInfo();
