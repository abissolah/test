// Mock canvas and context if not running in a browser with a real canvas
if (typeof canvas === 'undefined' || typeof ctx === 'undefined') {
    var canvas = {
        width: 400,
        height: 400,
        getContext: function() { return ctx; } // Return the mock ctx
    };
    var ctx = {
        fillRect: function() {},
        clearRect: function() {},
        fillText: function() {},
        beginPath: function() {}, // Mock for potential future use
        moveTo: function() {},   // Mock for potential future use
        lineTo: function() {},   // Mock for potential future use
        stroke: function() {},   // Mock for potential future use
        arc: function() {},      // Mock for potential future use
        fill: function() {}      // Mock for potential future use
    };
    // Since snake.js might try to get canvas by ID
    document.getElementById = (id) => {
        if (id === 'gameCanvas') return canvas;
        return null;
    };
}


// Helper function for assertions
function assert(condition, message) {
    const resultsDiv = document.getElementById('test-results');
    if (!resultsDiv) { // Fallback if test.html is not loaded (e.g. node environment)
        console.log((condition ? "PASS: " : "FAIL: ") + message);
        return;
    }
    const p = document.createElement('p');
    if (condition) {
        p.textContent = `PASS: ${message}`;
        p.className = 'pass'; // Use class for styling
    } else {
        p.textContent = `FAIL: ${message}`;
        p.className = 'fail'; // Use class for styling
    }
    resultsDiv.appendChild(p);
}

// Helper function to reset game state for tests
// Ensures that global game variables in snake.js are reset.
function resetGameState() {
    snake = [
        {x: 200, y: 200},
        {x: 190, y: 200},
        {x: 180, y: 200},
        {x: 170, y: 200},
        {x: 160, y: 200},
    ];
    dx = gridSize; // Initial direction: right
    dy = 0;
    score = 0;
    isGameOver = false; 
    
    // Ensure food is created, but not on the snake
    // For simplicity, place it at a fixed location initially for tests,
    // or call createFood() if it's robust enough for non-colliding placement.
    if (typeof createFood === 'function') {
         // Temporarily set snake to empty to avoid collision during initial food creation for test
        const originalSnake = snake;
        snake = []; 
        createFood(); // Call the game's food creation logic
        snake = originalSnake;
    } else {
        foodX = 100; // Fallback if createFood is not available or suitable
        foodY = 100;
    }

    // Clear any existing game loop timeout
    if (typeof gameTimeout !== 'undefined' && gameTimeout) {
        clearTimeout(gameTimeout);
        gameTimeout = null;
    }
}


// Test suite functions
function testSnakeMovement() {
    console.log("Running testSnakeMovement...");
    resetGameState();
    const initialHeadX = snake[0].x;
    const initialHeadY = snake[0].y;

    // Test moving right
    dx = gridSize; dy = 0;
    advanceSnake();
    assert(snake[0].x === initialHeadX + gridSize && snake[0].y === initialHeadY, "Snake moves right correctly");
    resetGameState(); // Reset for next sub-test

    // Test moving left
    dx = -gridSize; dy = 0;
    // Need to set snake's initial position to avoid immediate collision with itself if it starts too close to left wall
    snake[0] = {x: 200, y: 200}; // Re-center head
    const leftInitialHeadX = snake[0].x;
    advanceSnake();
    assert(snake[0].x === leftInitialHeadX - gridSize && snake[0].y === initialHeadY, "Snake moves left correctly");
    resetGameState();

    // Test moving down
    dx = 0; dy = gridSize;
    advanceSnake();
    assert(snake[0].x === initialHeadX && snake[0].y === initialHeadY + gridSize, "Snake moves down correctly");
    resetGameState();

    // Test moving up
    dx = 0; dy = -gridSize;
    // Re-center head
    snake[0] = {x: 200, y: 200}; 
    const upInitialHeadY = snake[0].y;
    advanceSnake();
    assert(snake[0].x === initialHeadX && snake[0].y === upInitialHeadY - gridSize, "Snake moves up correctly");
}

function testFoodConsumption() {
    console.log("Running testFoodConsumption...");
    resetGameState();
    const initialLength = snake.length;
    const initialScore = score;

    // Place food directly in front of the snake
    foodX = snake[0].x + gridSize;
    foodY = snake[0].y;
    dx = gridSize; dy = 0; // Set direction towards food

    advanceSnake(); // Snake eats food

    assert(snake.length === initialLength + 1, "Snake length increases after eating food");
    assert(score === initialScore + 10, "Score increases after eating food");
    assert(foodX !== snake[0].x || foodY !== snake[0].y, "New food is generated at a different location");
}

function testWallCollision() {
    console.log("Running testWallCollision...");
    resetGameState();

    // Test collision with right wall
    snake[0] = {x: canvas.width - gridSize, y: 200};
    dx = gridSize; dy = 0; // Move right into wall
    // advanceSnake(); // Move head into wall position
    assert(checkCollision() === true, "Collision with right wall detected");
    resetGameState();

    // Test collision with left wall
    snake[0] = {x: 0, y: 200};
    dx = -gridSize; dy = 0; // Move left into wall
    // advanceSnake();
    assert(checkCollision() === true, "Collision with left wall detected");
    resetGameState();

    // Test collision with bottom wall
    snake[0] = {x: 200, y: canvas.height - gridSize};
    dx = 0; dy = gridSize; // Move down into wall
    // advanceSnake();
    assert(checkCollision() === true, "Collision with bottom wall detected");
    resetGameState();

    // Test collision with top wall
    snake[0] = {x: 200, y: 0};
    dx = 0; dy = -gridSize; // Move up into wall
    // advanceSnake();
    assert(checkCollision() === true, "Collision with top wall detected");
}

function testSelfCollision() {
    console.log("Running testSelfCollision...");
    resetGameState();

    // Manually create a snake state where the head is about to collide with a body segment
    // Snake: H(200,200) S1(190,200) S2(180,200) S3(170,200) S4(180,200) <-- S4 is the trap
    // If snake moves left from (190,200) to (180,200) it should collide with S4
    snake = [
        {x: 190, y: 200}, // Head
        {x: 200, y: 200}, // Segment 1
        {x: 210, y: 200}, // Segment 2
        {x: 190, y: 210}, // Segment 3, distinct
        {x: 180, y: 200}  // Segment 4, the trap
    ];
    dx = -gridSize; // Set direction to move left
    dy = 0;
    
    // The head will be at snake[0] after advanceSnake.
    // advanceSnake() will put the new head at (180, 200)
    // checkCollision() is called *before* advanceSnake in the gameLoop,
    // so we need to simulate the state *after* the move for collision check.
    // Or, more accurately, checkCollision checks the *current* head against the *rest* of the body.
    // Let's adjust the snake so the *current* head is already on a body part for checkCollision to evaluate.

    snake = [
        {x: 180, y: 200}, // Head is ALREADY on a segment
        {x: 190, y: 200}, // Segment 1
        {x: 200, y: 200}, // Segment 2
        {x: 180, y: 200}  // Segment 3 (colliding segment)
    ];
    // No need to call advanceSnake(), checkCollision() checks the current state.
    assert(checkCollision() === true, "Self-collision detected when head overlaps a body segment");
    
    resetGameState();
    // Test case: snake moving into its own path after a turn
    // H(200,200) -> (210,200) -> (210,190) -> (200,190) -> (190,190) -> (190,200) X (collides with H's previous pos)
    snake = [
        {x: 200, y: 200}, // Head
        {x: 190, y: 200}, // Body
        {x: 180, y: 200}, // Body
        {x: 180, y: 190}, // Body
        {x: 190, y: 190}  // Tail
    ];
    // Simulate sequence of moves: Right, Up, Left, Down (to collide)
    dx = gridSize; dy = 0; // Right
    advanceSnake(); // Head at (210, 200)
    dx = 0; dy = -gridSize; // Up
    advanceSnake(); // Head at (210, 190)
    dx = -gridSize; dy = 0; // Left
    advanceSnake(); // Head at (200, 190)
    dx = 0; dy = gridSize; // Down - this move should cause collision
    
    // The head is now at (200, 200), which is snake[1]'s new position.
    // advanceSnake() already moved the snake. checkCollision() will check the new head.
    // The current snake[0] is (200,200). snake[1] is (200,190), snake[2] is (210,190), snake[3] is (210,200), snake[4] is (200,200)
    // So head snake[0] is (200,200) and snake[4] is (200,200)
    assert(checkCollision() === true, "Self-collision detected after turning into self");

}

// Run all tests
// Ensure this runs after the DOM is loaded if using test.html
// For now, direct calls:
if (typeof window !== 'undefined') { // Running in browser
    window.onload = function() {
        // Mock getElementById for canvas if not already mocked (e.g. if snake.js runs before this)
        if (!document.getElementById('gameCanvas')) {
             document.getElementById = (id) => {
                if (id === 'gameCanvas') {
                    if (typeof canvas === 'undefined') {
                         // This is a fallback, ideally canvas/ctx are defined earlier
                        canvas = {width: 400, height: 400, getContext: function() { return ctx; }};
                        ctx = { fillRect: function() {}, clearRect: function() {}, fillText: function() {} };
                    }
                    return canvas;
                }
                const originalGetElementById = Object.getPrototypeOf(document).getElementById.bind(document);
                return originalGetElementById(id); // Call original for other IDs like 'test-results'
            };
        }
        
        // Ensure game variables are initialized if snake.js didn't run or was blocked
        if (typeof snake === 'undefined') {
            // This indicates snake.js might not have loaded/run correctly.
            // Initialize necessary variables for tests to run.
            console.warn("snake.js variables not defined. Initializing for tests.");
            var snake = [];
            var dx = 10, dy = 0, gridSize = 10, foodX, foodY, score = 0, isGameOver = false;
            var gameTimeout; // Declare gameTimeout if not present
            // Define functions that tests might call if they are not on window
            if (typeof advanceSnake === 'undefined') window.advanceSnake = function(){ console.warn("advanceSnake mock called"); };
            if (typeof checkCollision === 'undefined') window.checkCollision = function(){ console.warn("checkCollision mock called"); return false; };
            if (typeof createFood === 'undefined') window.createFood = function(){ console.warn("createFood mock called"); foodX=100; foodY=100;};
        }


        testSnakeMovement();
        testFoodConsumption();
        testWallCollision();
        testSelfCollision();
    };
} else { // Non-browser environment (e.g., Node.js with JSDOM or similar)
    // Mock document and getElementById for a headless environment
    global.document = {
        getElementById: function(id) {
            if (id === 'test-results') {
                return { appendChild: function(element) { console.log(element.textContent); } };
            }
            if (id === 'gameCanvas') {
                return global.canvas;
            }
            return null;
        },
        createElement: function(type) {
            return { textContent: '', style: {}, className: '' };
        }
    };
    // Ensure canvas and context are defined globally for Node.js tests
    if (typeof global.canvas === 'undefined') {
        global.canvas = { width: 400, height: 400, getContext: () => global.ctx };
        global.ctx = { fillRect: () => {}, clearRect: () => {}, fillText: () => {} };
    }
    // Define game variables and functions if snake.js is not loaded/executable directly
    if (typeof snake === 'undefined') {
        global.snake = [];
        global.dx = 10; global.dy = 0; global.gridSize = 10;
        global.foodX = 0; global.foodY = 0; global.score = 0; global.isGameOver = false;
        global.gameTimeout = null;
        global.advanceSnake = () => { console.warn("Mock advanceSnake called in Node.js"); };
        global.checkCollision = () => { console.warn("Mock checkCollision called in Node.js"); return false; };
        global.createFood = () => { console.warn("Mock createFood called in Node.js"); global.foodX = 100; global.foodY = 100; };
    }


    testSnakeMovement();
    testFoodConsumption();
    testWallCollision();
    testSelfCollision();
}

console.log("Test script loaded. Tests will run on window load (browser) or immediately (Node).");
