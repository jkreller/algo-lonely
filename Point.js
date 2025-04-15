class Point {
  static borderMargin = 50; // Margin from the border

  constructor(isMain = false) {
    const minDistance = IDLE_DISTANCE + CONNECTION_THRESHOLD; // Minimum distance between points

    // Function to generate a valid position
    const generatePosition = () => {
      return createVector(
        random(Point.borderMargin, width - Point.borderMargin),
        random(Point.borderMargin, height - Point.borderMargin)
      );
    };

    // Generate a valid home position
    this.homePos = isMain ? createVector(width / 2, height / 2) : generatePosition();
    this.pos = this.homePos.copy();
    this.vel = createVector(0, 0);
    this.connections = [];
    this.isMain = isMain;
    this.alpha = 255; // For fade effect in phase 7
    this.noiseOffset = random(1000); // Random offset for noise
    this.velocityMultiplier = 1; // Add this new property for gradual speed increase

    // Ensure points are not too close to each other
    if (!isMain) {
      let validPosition = false;
      while (!validPosition) {
        this.homePos = generatePosition();
        validPosition = true;
        for (let other of [mainPoint, ...points]) {
          if (p5.Vector.dist(this.homePos, other.homePos) < minDistance) {
            validPosition = false;
            break;
          }
        }
      }
      this.pos = this.homePos.copy();
    }
  }

  // Update movement
  update(phase) {
    if (phase <= 2) {
      // All points idle around their home position in phase 1 and 2
      const noiseSpeed = 0.005; // Reduced from 0.01 for smoother movement
      this.pos.x = this.homePos.x + map(noise(frameCount * noiseSpeed + this.noiseOffset), 0, 1, -IDLE_DISTANCE, IDLE_DISTANCE);
      this.pos.y = this.homePos.y + map(noise(frameCount * noiseSpeed + this.noiseOffset + 1000), 0, 1, -IDLE_DISTANCE, IDLE_DISTANCE);
    } else {
      // Normal movement behavior for other phases
      if (this.isMain) {
        switch(phase) {
          case 3:
          case 4:
            // MP more mobile
            if (mainPointActivated) {
                this.vel.add(random(-0.5, 0.5), random(-0.5, 0.5));
            }
            break;
          case 5:
            // Reset the multiplier when entering phase 5
            this.velocityMultiplier = 1;
            // MP returns to home position
            let toHome = p5.Vector.sub(this.homePos, this.pos);
            toHome.mult(0.02); // Gentle force towards home
            this.vel.add(toHome);
            this.vel.mult(0.95); // Gradually slow down
            break;
          case 6:
            // MP freezes at home position
            this.vel.mult(0); // Stop movement
            break;
          case 7:
            // MP becomes calmer
            this.vel.mult(0.95);
            break;
        }
      } else {
        switch(phase) {
          case 6:
            // Rhythmic movement
            this.vel.x = sin(frameCount * 0.05) * 3;
            this.vel.y = cos(frameCount * 0.05) * 3;
            break;
          default:
            // Normal movement
            this.vel.add(random(-0.2, 0.2), random(-0.2, 0.2));
        }
      }
      
      // Apply border avoidance force
      const borderForce = 0.5;
      if (this.pos.x < Point.borderMargin) this.vel.x += borderForce;
      if (this.pos.x > width - Point.borderMargin) this.vel.x -= borderForce;
      if (this.pos.y < Point.borderMargin) this.vel.y += borderForce;
      if (this.pos.y > height - Point.borderMargin) this.vel.y -= borderForce;

      this.vel.limit(5);
      this.pos.add(this.vel);
    }

    // Bounce off canvas edges
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);

    // Fade out in phase 7 (only other points)
    if (phase === 7 && !this.isMain) {
      this.alpha = max(0, this.alpha - 1);
    }
  }

  // Draw point
  draw() {
    push();
    fill(255, this.alpha);
    ellipse(this.pos.x, this.pos.y, 25, 25);
    pop();
  }

  // Check and draw connections to other points
  connect(others, phase) {
    this.connections = [];
    for (let other of others) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        let threshold = CONNECTION_THRESHOLD;

        // Use a larger threshold for non-main points from phase 4 onwards
        if (phase >= 5 && !this.isMain && !other.isMain) {
          threshold *= 1.5;
        }

        // Connection logic based on phase
        if (d < threshold) {
          // Allow connections if main point is activated
          if (phase === 5 && (this.isMain || other.isMain)) {
            continue; // No connections to MP in phase 5 unless activated
          }
          this.connections.push(other);
          stroke(255, min(this.alpha, other.alpha) * 0.5);
          line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        }
      }
    }
  }
}