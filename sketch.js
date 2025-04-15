// Global variables
let mainPoint; // Main Point (MP)
let points = []; // Array for all other points
let phase = 1; // Current phase (1-7)
const PHASE_DURATION = 300; // Frames per phase (approx. 3 seconds at 60 FPS)
const CONNECTION_THRESHOLD = 200; // Maximum distance for connections
const IDLE_DISTANCE = 75;
let approachingPoint = null;
let mainPointActivated = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  mainPoint = new Point(true);
  // Initialize starting phase
  resetPhase();
}

function draw() {
  background(20); // Very dark grey, almost black
  
  // Phase control
  phase = floor(frameCount / PHASE_DURATION) % 7 + 1;
  
  // Add new points in phase 2 every 30 frames, max 15 points
  if (phase === 2 && frameCount % 30 === 0 && points.length < 15) {
    points.push(new Point());
  }

  // In phase 3: One point deliberately approaches MP
  if (phase === 3 && points.length > 0) {
    // Choose the point that is closest to the main point
    if (!approachingPoint) {
      points.forEach(point => {
        if (
          !approachingPoint ||
          dist(point.pos.x, point.pos.y, mainPoint.pos.x, mainPoint.pos.y) <
          dist(approachingPoint.pos.x, approachingPoint.pos.y, mainPoint.pos.x, mainPoint.pos.y)
        ) {
          approachingPoint = point;
        }
      });
    }

    if (approachingPoint && !mainPointActivated) {
      let toMain = p5.Vector.sub(mainPoint.pos, approachingPoint.pos);
      toMain.normalize();
      approachingPoint.vel.add(toMain.mult(0.3));

      // Check if the approaching point is close enough to connect
      if (dist(approachingPoint.pos.x, approachingPoint.pos.y, mainPoint.pos.x, mainPoint.pos.y) < CONNECTION_THRESHOLD) {
        mainPointActivated = true;
      }
    }
  }

  // Update all points
  mainPoint.update(phase);
  for (let p of points) {
    p.update(phase);
  }

  // Draw connections
  let allPoints = [mainPoint, ...points];
  for (let p of allPoints) {
    p.connect(allPoints, phase);
  }

  // Draw points
  for (let p of allPoints) {
    p.draw();
  }

  // Remove points that have faded out in phase 7
  if (phase === 7) {
    points = points.filter(p => p.alpha > 0);
  }

  // When phase 7 ends and no points remain, restart
  if (phase === 7 && points.length === 0) {
    resetPhase();
  }

  // Display phase number
  push();
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(16);
  //text(`Phase: ${phase}`, 20, 20);
  pop();
}

// Helper function to reset the animation
function resetPhase() {
  frameCount = 0;
  points = [];
  mainPoint = new Point(true);
  approachingPoint = null;
  mainPointActivated = false;
} 