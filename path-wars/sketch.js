const UP = 0
const DOWN = 1
const LEFT = 2
const RIGHT = 3

let canvasPadding = 4
let canvasWidth = 600
let canvasHeight = 800
let paddedCanvasWidth = canvasWidth + (canvasPadding * 2)
let paddedCanvasHeight = canvasHeight + (canvasPadding * 2)
let cellWidth = 5
let cellHeight = 5
let cellSize = 5
let gridWidth
let gridHeight

let grid = []
let paths = []
let fullyExpanded = false

let baseHue
let contrastHue
let monochrome

let expansions = 0

function setup () {
  noLoop();
  colorMode(HSB);

  const seed = random(0, 10000)
  randomSeed(seed)
  console.log('seed', seed)

  // randomSeed(2703.6650262649187)
  // randomSeed(6664.699392140443)

  cellSize = floor(random(2, 21))

  while (canvasWidth % cellSize !== 0 || canvasHeight % cellSize !== 0) {
    cellSize++
  }
  cellWidth = cellSize
  cellHeight = cellSize

  gridWidth = canvasWidth / cellWidth
  gridHeight = canvasHeight / cellHeight

  createCanvas(paddedCanvasWidth, paddedCanvasHeight)
  createGrid()

  noStroke()

  baseHue = random(0, 360)
  if (random() < 0.5) {
    contrastHue = (baseHue + 180) % 360
  } else {
    contrastHue = baseHue
  }

  monochrome = random() < 0.1

  blendMode(BLEND)

  setBackground()

  createInitialPaths()
  while (!fullyExpanded) {
    expandPaths()
  }
}

function setPathColor (path) {
  let pathHue

  const topPath = path.vectors[0].fromCell.row < gridHeight / 2
  if (topPath) {
    pathHue = monochrome ? baseHue : random(baseHue - 15, baseHue + 15)
  } else {
    pathHue = monochrome ? contrastHue: random(contrastHue - 15, contrastHue + 15)
  }

  fill(pathHue, random(50, 100), random(50, 100));
}

function setBackground () {
  for (let y = 0; y < paddedCanvasHeight; y++) {
    const heightFraction = map(y, 0, paddedCanvasHeight, 0, 1)

    const baseColor = color(baseHue, 10 * (1 - heightFraction), 95)
    const contrastColor = color(contrastHue, 10 * heightFraction, 95)

    stroke(baseColor);
    line(0, y, paddedCanvasWidth, y);

    stroke(contrastColor);
    line(0, y, paddedCanvasWidth, y);
  }
}

function draw () {
  drawShape()
}

function drawShape () {
  paths.forEach(path => {
    const variable = random() < 0.5
    const curved = random() < 0.5
    const vertexFunction = curved ? curveVertex : vertex

    setPathColor(path)

    let points = []
    path.vectors.forEach(vector => {
      let randomX
      let randomY

      if (variable) {
        randomX = random(vector.fromCell.centerX - cellWidth / 3, vector.fromCell.centerX + cellWidth / 3)
        randomY = random(vector.fromCell.centerY - cellHeight / 3, vector.fromCell.centerY + cellHeight / 3)
      } else {
        randomX = vector.fromCell.centerX
        randomY = vector.fromCell.centerY
      }

      points.push({
        x: randomX,
        y: randomY
      })
    })

    const firstPoint = points[0]
    const secondPoint = points[1]
    const lastPoint = points[points.length - 1]

    beginShape()
    points.forEach(point => {
      if (curved && point === firstPoint) {
        vertexFunction(lastPoint.x + canvasPadding, lastPoint.y + canvasPadding)
      }
      vertexFunction(point.x + canvasPadding, point.y + canvasPadding)
    })

    vertexFunction(firstPoint.x + canvasPadding, firstPoint.y + canvasPadding)
    if (curved) {
      vertexFunction(secondPoint.x + canvasPadding, secondPoint.y + canvasPadding)
    }
    endShape()
  })
}

function createGrid () {
  for (let i = 0; i < gridHeight; i++) {
    grid[i] = []
    for (let j = 0; j < gridWidth; j++) {
      grid[i][j] = {
        row: i,
        column: j,
        centerY: (i * cellHeight) + (cellHeight / 2),
        centerX: (j * cellWidth) + (cellWidth / 2),
        topY: (i * cellHeight),
        bottomY: (i * cellHeight) + cellHeight,
        leftX: (j * cellWidth),
        rightX: (j * cellWidth) + cellWidth
      }
    }
  }
}

function createInitialPaths () {
  const originPoints = []
  const numberOfPaths = floor(random(10, 20))

  while (originPoints.length < numberOfPaths) {
    const randomX = floor(random(0, gridWidth - 1))
    const randomY = floor(random(0, gridHeight - 1))

    const validOrigin = !originPoints.some(originPoint => {
      const xDistance = Math.abs(randomX - originPoint.x)
      const yDistance = Math.abs(randomY - originPoint.y)
      return xDistance + yDistance <= 2
    })

    if (validOrigin) {
      console.log('POINTS!', randomX, randomY)
      originPoints.push({
        x: randomX,
        y: randomY
      })
    }
  }

  originPoints.forEach(originPoint => {
    paths.push(createInitialPath(originPoint.x, originPoint.y))
  })
}

function createInitialPath (x, y) {
  const cell1 = getCell(y, x)
  const cell2 = getCell(y, x + 1)
  const cell3 = getCell(y + 1, x + 1)
  const cell4 = getCell(y + 1, x)

  const vectors = []
  vectors.push({
    fromCell: cell1,
    toCell: cell2,
    direction: RIGHT
  })
  vectors.push({
    fromCell: cell2,
    toCell: cell3,
    direction: DOWN
  })
  vectors.push({
    fromCell: cell3,
    toCell: cell4,
    direction: LEFT
  })
  vectors.push({
    fromCell: cell4,
    toCell: cell1,
    direction: UP
  })

  cell1.traversed = true
  cell2.traversed = true
  cell3.traversed = true
  cell4.traversed = true

  return {
    vectors,
    expansionRank: floor(random(1, 4))
  }
}

function expandPaths () {
  expansions++

  paths.forEach(path => {
    if (path.fullyExpanded || expansions % path.expansionRank !== 0) {
      return
    }

    const expansionOptions = []

    path.vectors.forEach(vector => {
      if (vector.fullyExpanded) {
        return
      }

      const fromCell = vector.fromCell
      const toCell = vector.toCell

      let leftExpansion = {
        vector,
        expandDirection: LEFT,
        inverseExpandDirection: RIGHT,
        expansionCell1: getCell(fromCell.row, fromCell.column - 1),
        expansionCell2: getCell(toCell.row, toCell.column - 1)
      };

      let rightExpansion = {
        vector,
        expandDirection: RIGHT,
        inverseExpandDirection: LEFT,
        expansionCell1: getCell(fromCell.row, fromCell.column + 1),
        expansionCell2: getCell(toCell.row, toCell.column + 1),
      };

      let upExpansion = {
        vector,
        expandDirection: UP,
        inverseExpandDirection: DOWN,
        expansionCell1: getCell(fromCell.row - 1, fromCell.column),
        expansionCell2: getCell(toCell.row - 1, toCell.column),
      };

      let downExpansion = {
        vector,
        expandDirection: DOWN,
        inverseExpandDirection: UP,
        expansionCell1: getCell(fromCell.row + 1, fromCell.column),
        expansionCell2: getCell(toCell.row + 1, toCell.column),
      };

      const validLeftExpansion = isValidExpansionOption(leftExpansion)
      const validRightExpansion = isValidExpansionOption(rightExpansion)
      const validUpExpansion = isValidExpansionOption(upExpansion)
      const validDownExpansion = isValidExpansionOption(downExpansion)

      validLeftExpansion && expansionOptions.push(leftExpansion)
      validRightExpansion && expansionOptions.push(rightExpansion)
      validUpExpansion && expansionOptions.push(upExpansion)
      validDownExpansion && expansionOptions.push(downExpansion)

      vector.fullyExpanded = !validLeftExpansion && !validRightExpansion && !validUpExpansion && !validDownExpansion
    })

    const validExpansionOptions = expansionOptions.filter(expansionOption => {
      const expansionCell1 = expansionOption.expansionCell1
      const expansionCell2 = expansionOption.expansionCell2

      const validExpansionCell1 = expansionCell1 && !expansionCell1.traversed
      const validExpansionCell2 = expansionCell2 && !expansionCell2.traversed

      return validExpansionCell1 && validExpansionCell2
    })

    if (validExpansionOptions.length === 0) {
      path.fullyExpanded = true
      return
    }

    const expansion = validExpansionOptions[floor(random(0, validExpansionOptions.length))]

    const vector = expansion.vector
    const direction = vector.direction
    const fromCell = vector.fromCell
    const toCell = vector.toCell

    const expandDirection = expansion.expandDirection
    const inverseExpandDirection = expansion.inverseExpandDirection
    const expansionCell1 = expansion.expansionCell1
    const expansionCell2 = expansion.expansionCell2

    let expansion1 = {
      fromCell: fromCell,
      toCell: expansionCell1,
      direction: expandDirection
    };
    let expansion2 = {
      fromCell: expansionCell1,
      toCell: expansionCell2,
      direction: direction
    };
    let expansion3 = {
      fromCell: expansionCell2,
      toCell: toCell,
      direction: inverseExpandDirection
    };

    path.vectors.splice(path.vectors.indexOf(vector), 1, expansion1, expansion2, expansion3)

    expansionCell1.traversed = true
    expansionCell2.traversed = true
  })

  fullyExpanded = paths.every(path => path.fullyExpanded)
}

function isValidExpansionOption (expansionOption) {
  const expansionCell1 = expansionOption.expansionCell1
  const expansionCell2 = expansionOption.expansionCell2

  const validExpansionCell1 = expansionCell1 && !expansionCell1.traversed
  const validExpansionCell2 = expansionCell2 && !expansionCell2.traversed

  return validExpansionCell1 && validExpansionCell2
}

function getCell (row, column) {
  if (row < 0 || row >= gridHeight || column < 0 || column >= gridWidth) {
    return null
  }
  return grid[row][column]
}