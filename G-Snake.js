// Game variables
let canvas, ctx;
let snake, food;
let tileSize = 20;
let score = 0;
let highscore = 0;
let gameRunning = false;
let gamePaused = false; // Flag to track if game is paused

// Detect mobile device
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Initialize setup
function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Adjust canvas size based on device width
  if (isMobile) {
    canvas.width = canvas.height =
      Math.min(window.innerWidth, window.innerHeight) - 20;
  } else {
    canvas.width = canvas.height = 400;
  }

  // Load highscore from localStorage
  highscore = localStorage.getItem('snakeHighscore') || 0;
  document.getElementById('highscoreValue').textContent = highscore;

  // Start button click event
  document.getElementById('startButton').addEventListener('click', toggleGame);

  // Pause button click event
  document.getElementById('pauseButton').addEventListener('click', togglePause);

  // Prevent arrow key default behavior
  document.addEventListener('keydown', function (event) {
    if ([37, 38, 39, 40].includes(event.keyCode)) {
      event.preventDefault();
    }
  });

  // Initialize the game
  function toggleGame() {
    if (!gameRunning) {
      startGame();
      document.getElementById('startButton').textContent = 'Pause Game';
    } else {
      togglePause();
    }
  }

  // Toggle game pause/resume
  function togglePause() {
    if (!gameRunning) return;

    if (!gamePaused) {
      gamePaused = true;
      document.getElementById('pauseButton').textContent = 'Resume Game';
    } else {
      gamePaused = false;
      document.getElementById('pauseButton').textContent = 'Pause Game';
      gameLoop(); // Resume game loop
    }
  }

  // Start the game
  function startGame() {
    gameRunning = true;
    document.getElementById('startButton').style.display = 'none'; // Hide start button
    document.getElementById('pauseButton').style.display = 'inline-block'; // Show pause button
    document.getElementById('pauseButton').textContent = 'Pause Game'; // Set initial text

    snake = new Snake();
    food = new Food();

    // Listen for key presses (only on non-mobile)
    if (!isMobile) {
      document.addEventListener('keydown', keyDown);
    } else {
      setupSwipeControls();
    }

    // Start game loop
    gameLoop();
  }

  // Swipe control setup for mobile devices
  function setupSwipeControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener('touchstart', function (event) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    });

    document.addEventListener('touchmove', function (event) {
      let touchEndX = event.touches[0].clientX;
      let touchEndY = event.touches[0].clientY;

      let deltaX = touchEndX - touchStartX;
      let deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && snake.direction !== 'left') {
          snake.direction = 'right';
        } else if (deltaX < 0 && snake.direction !== 'right') {
          snake.direction = 'left';
        }
      } else {
        if (deltaY > 0 && snake.direction !== 'up') {
          snake.direction = 'down';
        } else if (deltaY < 0 && snake.direction !== 'down') {
          snake.direction = 'up';
        }
      }

      touchStartX = touchEndX;
      touchStartY = touchEndY;
    });
  }

  // Snake object
  function Snake() {
    this.segments = [{ x: 10, y: 10 }];
    this.direction = 'right';

    this.update = function () {
      let head = { x: this.segments[0].x, y: this.segments[0].y };

      // Move snake
      switch (this.direction) {
        case 'right':
          head.x++;
          break;
        case 'left':
          head.x--;
          break;
        case 'up':
          head.y--;
          break;
        case 'down':
          head.y++;
          break;
      }

      // Check collision with walls or itself
      if (
        head.x < 0 ||
        head.x >= canvas.width / tileSize ||
        head.y < 0 ||
        head.y >= canvas.height / tileSize ||
        checkCollision(head, this.segments)
      ) {
        gameOver();
        return;
      }

      // Add new head
      this.segments.unshift(head);

      // Check if snake eats food
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('scoreValue').textContent = score;
        if (score > highscore) {
          highscore = score;
          document.getElementById('highscoreValue').textContent = highscore;
          localStorage.setItem('snakeHighscore', highscore);
        }
        food.spawn();
      } else {
        this.segments.pop();
      }
    };

    this.draw = function () {
      this.segments.forEach((segment, index) => {
        ctx.beginPath();
        if (index === 0) {
          // Create gradient for the head
          const gradient = ctx.createLinearGradient(
            segment.x * tileSize,
            segment.y * tileSize,
            segment.x * tileSize + tileSize,
            segment.y * tileSize + tileSize
          );
          gradient.addColorStop(0, '#000'); // Black
          gradient.addColorStop(1, '#fff'); // White
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = '#00b300'; // Snake color
        }
        ctx.arc(
          segment.x * tileSize + tileSize / 2,
          segment.y * tileSize + tileSize / 2,
          tileSize / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });
    };
  }

  // Food object
  function Food() {
    this.x = 15;
    this.y = 15;

    this.spawn = function () {
      this.x = Math.floor(Math.random() * (canvas.width / tileSize));
      this.y = Math.floor(Math.random() * (canvas.height / tileSize));
    };

    this.draw = function () {
      ctx.fillStyle = '#e60000'; // Food color (red for apple)
      ctx.beginPath();
      ctx.arc(
        this.x * tileSize + tileSize / 2,
        this.y * tileSize + tileSize / 2,
        tileSize / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
    };
  }

  // Game loop
  function gameLoop() {
    if (!gameRunning || gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.update();
    snake.draw();

    food.draw();

    setTimeout(gameLoop, 100);
  }

  // Handle key presses (only on non-mobile)
  function keyDown(event) {
    switch (event.keyCode) {
      case 37: // Left
        event.preventDefault(); // Prevent default arrow key behavior
        if (snake.direction !== 'right') snake.direction = 'left';
        break;
      case 38: // Up
        event.preventDefault(); // Prevent default arrow key behavior
        if (snake.direction !== 'down') snake.direction = 'up';
        break;
      case 39: // Right
        event.preventDefault(); // Prevent default arrow key behavior
        if (snake.direction !== 'left') snake.direction = 'right';
        break;
      case 40: // Down
        event.preventDefault(); // Prevent default arrow key behavior
        if (snake.direction !== 'up') snake.direction = 'down';
        break;
    }
  }

  // Check for collision with the snake's body
  function checkCollision(head, segments) {
    for (let i = 1; i < segments.length; i++) {
      if (head.x === segments[i].x && head.y === segments[i].y) {
        return true;
      }
    }
    return false;
  }

  // Handle game over
  function gameOver() {
    gameRunning = false;
    score = 0; // Reset score to 0
    document.getElementById('scoreValue').textContent = score; // Update score display
    document.getElementById('startButton').style.display = 'block'; // Show start button
    document.getElementById('startButton').textContent = 'Start Game'; // Reset text
    document.getElementById('pauseButton').style.display = 'none'; // Hide pause button
    gamePaused = false; // Reset game paused state
  }
}

// Initialize the game on window load
window.onload = init;
