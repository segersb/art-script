const CANVAS_HEIGHT = 1000
const CANVAS_WIDTH = 800

function setup () {
  noLoop();
  colorMode(HSB);
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
  translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
  branch(140)
}

function branch (length) {
  if (length < 4) {
    return
  }

  for (let i = 0; i < length; i++) {
    if (length > 10) {
      const hue = randomGaussian(15, 15)
      const saturation = randomGaussian(95, 5)
      const brightness = randomGaussian(30, 5)
      stroke(hue, saturation, brightness)
    } else {
      const hue = randomGaussian(120, 15)
      const saturation = randomGaussian(85, 5)
      const brightness = randomGaussian(40, 5)
      stroke(hue, saturation, brightness)
    }

    const deviation = Math.max(1, length / 30)
    line(
      randomGaussian(0, deviation),
      randomGaussian(0, deviation),
      randomGaussian(0, deviation),
      randomGaussian(-length, deviation)
    )
  }

  translate(0, -length)

  let sideLength = length * randomGaussian(0.7, 0.1);

  push()
  rotate(randomGaussian(-PI / 10, PI / 50))
  branch(randomGaussian(sideLength, sideLength * 0.2))
  pop()

  push()
  rotate(randomGaussian(PI / 10, PI / 100))
  branch(randomGaussian(sideLength, sideLength * 0.2))
  pop()
}