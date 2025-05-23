// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let isGameOver = false;

// Define snake
let snake = [
  {x: 200, y: 200},
  {x: 190, y: 200},
  {x: 180, y: 200},
  {x: 170, y: 200},
  {x: 160, y: 200},
];

// Define snake direction
let dx = 10;
let dy = 0;

// Define grid size
const gridSize = 10;

// Food variables
let foodX;
let foodY;

// Create food
function createFood() {
  foodX = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
  foodY = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;

  // Check collision with snake
  snake.forEach(segment => {
    if (segment.x === foodX && segment.y === foodY) {
      createFood(); // Recursively call if collision
    }
  });
}

// Draw food
function drawFood() {
  ctx.fillStyle = 'red';
  ctx.fillRect(foodX, foodY, gridSize, gridSize);
}

// Draw snake
function drawSnake() {
  ctx.fillStyle = 'green';
  snake.forEach(segment => {
    ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
  });
}

// Advance snake
function advanceSnake() {
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};

  // Check if snake ate food
  if (head.x === foodX && head.y === foodY) {
    score += 10;
    createFood();
    snake.unshift(head); // Add new head, don't remove tail
  } else {
    snake.unshift(head);
    snake.pop(); // Remove tail
  }
}

// Game timeout variable
let gameTimeout;

// Check collision
function checkCollision() {
  const head = snake[0];

  // Wall collision
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    return true;
  }

  // Self-collision
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }

  return false;
}

// Draw score
function drawScore() {
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 25);
}

// Restart game
function restartGame() {
  isGameOver = false;
  score = 0;
  snake = [
    {x: 200, y: 200},
    {x: 190, y: 200},
    {x: 180, y: 200},
    {x: 170, y: 200},
    {x: 160, y: 200},
  ];
  dx = gridSize;
  dy = 0;
  createFood();
  clearTimeout(gameTimeout);
  gameLoop();
}

// Game loop
function gameLoop() {
  // Check for collision
  if (checkCollision()) {
    isGameOver = true;
    clearTimeout(gameTimeout);
    ctx.fillStyle = 'black';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 40);
    return;
  }

  gameTimeout = setTimeout(function onTick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    advanceSnake();
    drawSnake();
    // Call gameLoop again
    gameLoop();
  }, 100);
}

// Control constants
const LEFT_KEY = 37;
const RIGHT_KEY = 39;
const UP_KEY = 38;
const DOWN_KEY = 40;

// Change direction
function changeDirection(event) {
  const keyPressed = event.keyCode;
  const goingUp = dy === -gridSize;
  const goingDown = dy === gridSize;
  const goingRight = dx === gridSize;
  const goingLeft = dx === -gridSize;

  if (keyPressed === LEFT_KEY && !goingRight) {
    dx = -gridSize;
    dy = 0;
  }
  if (keyPressed === UP_KEY && !goingDown) {
    dx = 0;
    dy = -gridSize;
  }
  if (keyPressed === RIGHT_KEY && !goingLeft) {
    dx = gridSize;
    dy = 0;
  }
  if (keyPressed === DOWN_KEY && !goingUp) {
    dx = 0;
    dy = gridSize;
  }
}

// Add event listener for key presses
document.addEventListener('keydown', changeDirection);

// Initialize food
createFood();

// Start the game loop
gameLoop();
