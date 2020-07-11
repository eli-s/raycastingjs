
const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180)

const WALL_STRIP_WIDTH = 1
const NUM_OF_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH

const PROJECTION_PLANE_RATIO = (WINDOW_WIDTH / 2) / Math.tan(FOV_ANGLE / 2)

const FULL_CIRCLE = 2 * Math.PI

const MINI_MAP_SCALE_FACTOR = 0.2

class Map {
  constructor() {
    this.grid = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
  }

  checkCollision(x, y) {
    if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
      return true
    }
    return this.grid[Math.floor(y / TILE_SIZE)][Math.floor(x / TILE_SIZE)]
  }

  render() {
    for (let i = 0; i < MAP_NUM_ROWS; i++) {
      for (let j = 0; j < MAP_NUM_COLS; j++) {
        const tileX = j * TILE_SIZE
        const tileY = i * TILE_SIZE
        const tileColor = this.grid[i][j] ? '#222' : '#fff'
        stroke('#222')
        fill(tileColor)
        rect(
          MINI_MAP_SCALE_FACTOR * tileX,
          MINI_MAP_SCALE_FACTOR * tileY,
          MINI_MAP_SCALE_FACTOR * TILE_SIZE,
          MINI_MAP_SCALE_FACTOR * TILE_SIZE
        )
      }
    }
  }
}

class Player {
  constructor() {
    this.x = WINDOW_WIDTH / 2
    this.y = WINDOW_HEIGHT / 2
    this.radius = 3
    this.turnDirection = 0
    this.walkDirection = 0
    this.rotationAngle = Math.PI / 2
    this.moveSpeed = 2.0
    this.rotationSpeed = 2 * (Math.PI / 180) 
  }

  update() {
    const moveStep = this.walkDirection * this.moveSpeed
    this.rotationAngle += this.turnDirection * this.rotationSpeed
    const nextX = this.x + moveStep * Math.cos(this.rotationAngle)
    const nextY = this.y + moveStep * Math.sin(this.rotationAngle)
    if (!grid.checkCollision(nextX, nextY)) {
      this.x = nextX
      this.y = nextY
    }
  }

  render() {
    noStroke()
    fill('blue')
    circle(
      MINI_MAP_SCALE_FACTOR * this.x,
      MINI_MAP_SCALE_FACTOR * this.y,
      MINI_MAP_SCALE_FACTOR * this.radius)
  }
}

class Ray {
  constructor(rayAngle) {
    this.rayAngle = normalizeAngle(rayAngle)
    this.wallHitX = 0
    this.wallHitY = 0
    this.distance = 0
    this.wasHitVertical = false
    this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI
    this.isRayFacingUp = !this.isRayFacingDown
    this.isRayFacingRight = this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI
    this.isRayFacingLeft = !this.isRayFacingRight
  }

  cast(columnId) {
    const horzHitPoint = this.findHorizontalGridIntersectionHit()
    const vertHitPoint = this.findVerticalGridIntersectionHit()
    const horzHitDistance = horzHitPoint.found ? calcPointsDistance(player, horzHitPoint) : Number.MAX_VALUE
    const vertHitDistance = vertHitPoint.found ? calcPointsDistance(player, vertHitPoint) : Number.MAX_VALUE
    
    this.wasHitVertical = horzHitDistance >= vertHitDistance
    this.distance = this.wasHitVertical ? vertHitDistance : horzHitDistance
    this.wallHitX = (this.wasHitVertical ? vertHitPoint : horzHitPoint).x
    this.wallHitY = (this.wasHitVertical ? vertHitPoint : horzHitPoint).y
  }

  findHorizontalGridIntersectionHit() {
    //////////////////////////////////////
    // HORIZOTAL-GRID INTERSECTION CODE //
    //////////////////////////////////////

    const yIntercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE + (this.isRayFacingDown ? TILE_SIZE : 0)
    const xIntercept = player.x + ((yIntercept - player.y) / Math.tan(this.rayAngle))

    let yStep = TILE_SIZE * (this.isRayFacingUp ? -1 : 1)
    let xStep = TILE_SIZE / (Math.tan(this.rayAngle))
    if ((this.isRayFacingLeft && xStep > 0) || (this.isRayFacingRight && xStep < 0)) {
      xStep *= -1
    }

    let found = false
    let wallHitX = 0
    let wallHitY = 0
    let nextTouchX = xIntercept
    let nextTouchY = yIntercept

    if (this.isRayFacingUp) {
      nextTouchY--
    }

    while(nextTouchX >= 0 && nextTouchX <= WINDOW_WIDTH && nextTouchY >= 0 && nextTouchY <= WINDOW_HEIGHT) {
      if(grid.checkCollision(nextTouchX, nextTouchY)) {
        found = true
        wallHitX = nextTouchX
        wallHitY = nextTouchY
        break
      } else {
        nextTouchX += xStep
        nextTouchY += yStep
      }
    }

    return { found, x: wallHitX, y: wallHitY }
  }

  findVerticalGridIntersectionHit() {
    //////////////////////////////////////
    // VERTICAL-GRID INTERSECTION CODE //
    //////////////////////////////////////

    const xIntercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE + (this.isRayFacingRight ? TILE_SIZE : 0)
    const yIntercept = player.y + ((xIntercept - player.x) * Math.tan(this.rayAngle))

    let xStep = TILE_SIZE * (this.isRayFacingLeft ? -1 : 1)
    let yStep = TILE_SIZE * (Math.tan(this.rayAngle))
    if ((this.isRayFacingUp && yStep > 0) || (this.isRayFacingDown && yStep < 0)) {
      yStep *= -1
    }

    let found = false
    let wallHitX = 0
    let wallHitY = 0
    
    let nextTouchX = xIntercept
    let nextTouchY = yIntercept

    if (this.isRayFacingLeft) {
      nextTouchX--
    }

    while(nextTouchX >= 0 && nextTouchX <= WINDOW_WIDTH && nextTouchY >= 0 && nextTouchY <= WINDOW_HEIGHT) {
      if(grid.checkCollision(nextTouchX, nextTouchY)) {
        found = true
        wallHitX = nextTouchX
        wallHitY = nextTouchY
        break
      } else {
        nextTouchX += xStep
        nextTouchY += yStep
      }
    }

    return { found, x: wallHitX, y: wallHitY }
  }

  render() {
    // const wallStripHeight = (TILE_SIZE / this.distance) * PROJECTION_PLANE_RATIO
    // console.log({ wallStripHeight })
    stroke('rgba(255,0,0,0.3)')
    line(
      MINI_MAP_SCALE_FACTOR * player.x,
      MINI_MAP_SCALE_FACTOR * player.y,
      MINI_MAP_SCALE_FACTOR * this.wallHitX,
      MINI_MAP_SCALE_FACTOR * this.wallHitY
    )
  }
}

const grid = new Map()
const player = new Player()
const rays = []

function calcPointsDistance(p1, p2) {
  return Math.abs(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function keyPressed() {
  switch(keyCode) {
    case UP_ARROW:
      player.walkDirection = 1
      break;
    case DOWN_ARROW:
      player.walkDirection = -1
      break;
    case RIGHT_ARROW:
      player.turnDirection = 1
      break;
    case LEFT_ARROW:
      player.turnDirection = -1
      break;
  }
}

function keyReleased() {
  switch(keyCode) {
    case UP_ARROW:
    case DOWN_ARROW:
      player.walkDirection = 0
      break;
    case RIGHT_ARROW:
    case LEFT_ARROW:
      player.turnDirection = 0
      break;
  }
}

function render3DProjectedWalls() {
  
}

function castAllRays() {
  let rayAngle = player.rotationAngle - (FOV_ANGLE / 2)
  for (let i = 0; i < NUM_OF_RAYS; i++) {
    const ray = new Ray(rayAngle)
    ray.cast(i)
    rays[i] = ray
    rayAngle += FOV_ANGLE / NUM_OF_RAYS
  }
}

function normalizeAngle(angle) {
  const normalizedAngle = angle % FULL_CIRCLE
  return normalizedAngle < 0 ? normalizedAngle + FULL_CIRCLE : normalizedAngle
}

function setup() {
  createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT)
}

function update() {
  player.update()
  castAllRays()
}

function draw() {
  update()
  render3DProjectedWalls()
  grid.render()
  player.render()
  for (ray of rays) {
    ray.render()
  }
}