var framerate = 60;
var canvasId = "main-canvas";
var mouseEventsElement = "header";
var pauseButtonId = "pause";


// requestAnimationFrame to a FPS 
var stop = false;
var frameCount = 0;
var fps, fpsInterval, startTime, now, then, elapsed;

//Canvas objects
var objects = [];
const radiusInteractionSize = 500;
const moveInteractionSize = 400;
const moveInteractionMaxRadius = 10;

var smallestRadius = 2;
const circleSizes = [
        smallestRadius,
        smallestRadius,
        smallestRadius * 2,
        smallestRadius * 3.5,
        smallestRadius * 3.5
    ];
const circleMaxSize = [
        circleSizes[0] * 2,
        circleSizes[1] * 2.5,
        circleSizes[2] * 3,
        circleSizes[3] * 2.8,
        circleSizes[4] * 2.8
    ];
const circleColors = [
        '#555555',
        '#FBD8B0',
        '#047870',
        '#1DCA7F',
        '#6898AE']

const margin = {
    top: smallestRadius * 45,
    bottom: smallestRadius * 15,
    left: smallestRadius * 15,
    right: smallestRadius * 15
};

const spaceBetweenCircles = {
    x: smallestRadius * 22,
    y: smallestRadius * 22
};

// Scheme 
const default_scheme = [
        [0, 0, 0, 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 3, 4, 3, 3, 2, 1, 3, 3, 1, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 0, 1, 3, 3, 1, 1, 3, 2, 0, 0],
        [0, 0, 0, 3, 3, 2, 3, 4, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 3, 1, 1, 3, 3, 1, 1, 3, 2, 0, 0, 0, 0, 0, 0],
        [3, 2, 1, 1, 2, 3, 1, 3, 1, 1, 2, 3, 1, 0, 0, 0, 0, 0],
        [1, 1, 2, 3, 1, 2, 1, 2, 4, 3, 1, 1, 3, 0, 0, 0, 0, 0],
        [0, 2, 3, 2, 1, 2, 3, 3, 1, 1, 3, 2, 2, 1, 2, 0, 0, 0],
        [0, 0, 0, 2, 2, 2, 2, 1, 1, 3, 3, 3, 2, 2, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 1, 3, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 1, 3, 3, 3],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 1, 3, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 1, 3, 3, 3, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 3, 3, 3, 3],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 3, 3, 3]]

// Mouse
const mousePosition = {
    x: innerWidth,
    y: innerHeight
};
const mouseSmoothSpeed = {
    x: 0.06,
    y: 0.06
};

// Utility Functions
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)]
}

function distance(x1, y1, x2, y2) {
    const xDist = x2 - x1
    const yDist = y2 - y1

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2))
}


// -------------------------------------------------------------------------------
// --------------------------------------- READY?
// -------------------------------------------------------------------------------
$(window).on("load", function(){
    var pauseButton = document.getElementById(pauseButtonId);
    var header = document.getElementById(mouseEventsElement);
    var canvasArea = {
        canvas: document.getElementById(canvasId),

        start: function () {
            this.canvas.width = innerWidth;
            this.canvas.height = innerHeight;
            this.context = this.canvas.getContext('2d');
        },

        clear: function () {
            this.context.clearRect(0, 0,
                this.canvas.width,
                this.canvas.height);
        }
    }

    canvasArea.start();
    init();
    startAnimating(framerate);

    // pause animation
    pauseButton.addEventListener('click', event => {
        stop = !stop;
        if (stop)
            pauseButton.getElementsByTagName('i')[0].className = "fa fa-toggle-off";
        else
            pauseButton.getElementsByTagName('i')[0].className = "fa fa-toggle-on";
    })

    // Mouse events
    header.addEventListener('mousemove', event => {
        mousePosition.x = event.clientX;
        mousePosition.y = event.clientY;
    })

    // For mobile
    header.addEventListener('touchstart', event => {
        mousePosition.x = event.touches[0].pageX;
        mousePosition.y = event.touches[0].pageY;
    })
    header.addEventListener('touchmove', event => {
        mousePosition.x = event.touches[0].pageX;
        mousePosition.y = event.touches[0].pageY;
    })

    //Resize event
    addEventListener('resize', () => {
        canvasArea.canvas.width = innerWidth;
        canvasArea.canvas.height = innerHeight;
        init();
    })


    function Object(x, y, radius, minRadius, maxRadius, color) {
        this.context = canvasArea.context;

        this.x = x;
        this.y = y;
        this.startX = this.x;
        this.startY = this.y;
        this.radius = radius;
        this.minRadius = minRadius;
        this.maxRadius = maxRadius;
        this.color = color;
        this.alpha = 1;

        this.bottom = canvasArea.canvas.height - this.radius;
        this.right = canvasArea.canvas.width - this.radius;
        this.left = 0 + this.radius;

        this.lastMouse = {
            x: mousePosition.x,
            y: mousePosition.y
        };


        this.update = function () {
            this.updateRadius();
            this.move();
            this.draw();
        }


        this.move = function () {
            let distanceToMouse = distance(this.startX, this.startY, this.lastMouse.x, this.lastMouse.y);
            let radius = (distanceToMouse / moveInteractionSize) * moveInteractionMaxRadius;
            if (radius > moveInteractionMaxRadius) radius = moveInteractionMaxRadius;

            let A = {
                x: this.startX,
                y: this.startY
            };
            let B = {
                x: this.lastMouse.x,
                y: this.lastMouse.y
            };
            let W = {
                x: B.x - A.x,
                y: B.y - A.y
            };
            let Wi = {
                x: W.x * radius / Math.sqrt(Math.pow(W.x, 2) + Math.pow(W.y, 2)),
                y: W.y * radius / Math.sqrt(Math.pow(W.x, 2) + Math.pow(W.y, 2))
            };
            let C = {
                x: A.x + Wi.x,
                y: A.y + Wi.y
            };

            this.x = C.x;
            this.y = C.y;
        }

        this.click = function () {
            let distanceToMouse = distance(this.x, this.y, mousePosition.x, mousePosition.y);
            if (distanceToMouse <= this.radius + 5 && isMousePressed == true) {
                this.startFalling = true;
            }
        }

        this.smoothMouse = function () {
            this.lastMouse.x +=
                (mousePosition.x - this.lastMouse.x) * mouseSmoothSpeed.x;
            this.lastMouse.y +=
                (mousePosition.y - this.lastMouse.y) * mouseSmoothSpeed.y;
        }

        this.updateRadius = function () {
            this.smoothMouse();
            let distanceToMouse = distance(this.x, this.y, this.lastMouse.x, this.lastMouse.y);

            let radius = (1 - (distanceToMouse / radiusInteractionSize)) * this.maxRadius;
            if (radius < this.minRadius) radius = this.minRadius;
            this.radius = radius;

        }

        this.updateCircle = function (size, minRadius, maxRadius, color, alpha) {
            this.radius = size;
            this.minRadius = minRadius;
            this.maxRadius = maxRadius;
            this.color = color;
            this.alpha = alpha;
            this.draw();
        }

        this.draw = function () {
            this.context.beginPath();
            this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.context.globalAlpha = this.alpha;
            this.context.fillStyle = this.color;
            this.context.fill();
            this.context.closePath();
        }
    }

    function init() {
        objects = [];

        let circlesAmount = {
            x: Math.round((canvasArea.canvas.width - (margin.left + margin.right)) / spaceBetweenCircles.x),
            y: Math.round((canvasArea.canvas.height - (margin.top + margin.bottom)) / spaceBetweenCircles.y)
        };

        // Amount of pixels necessary for centring circles
        let center = {
            x: Math.round((canvasArea.canvas.width - ((spaceBetweenCircles.x) * (circlesAmount.x)) - (margin.left + margin.right) + spaceBetweenCircles.x) / 2),
            y: Math.round((canvasArea.canvas.height - ((spaceBetweenCircles.y) * (circlesAmount.y)) - (margin.top + margin.bottom) + spaceBetweenCircles.y) / 2)
        };

        // Createing circles
        for (let y = 0; y < circlesAmount.x; y++) {
            var x_pos = circleSizes[0] + margin.left + (spaceBetweenCircles.x * y) + center.x;
            let x_objects = []

            for (var x = 0; x < circlesAmount.y; x++) {
                var y_pos = circleSizes[0] + margin.top + (spaceBetweenCircles.y * x) + center.y;

                x_objects.push(new Object(
                    x_pos, y_pos, circleSizes[0], circleSizes[0], circleMaxSize[0],
                    circleColors[0]));

            }
            objects.push(x_objects);
        }
        loadScheme(default_scheme);
    }

    function loadScheme(scheme) {
        let alpha = 1;
        let emptyToSkip = 0;

        for (let y = objects[0].length - 1; y >= 0; y--) {
            let isEmpty = true;
            for (let x = 0; x < objects.length; x++) {
                if (y < scheme.length && x < scheme[0].length) {
                    if (scheme[y][x] != 0) {
                        isEmpty = false;
                        break;
                    };
                }
            }
            if (isEmpty) {
                emptyToSkip += 1;
            } else break;
        }

        for (let x = 0; x < objects.length; x++) {
            for (let y = 0; y < objects[x].length; y++) {
                let x_number = objects.length;
                let y_number = objects[x].length;
                let x_shift = x_number - scheme[0].length;
                let y_shift = y_number - scheme.length;
                if (x_shift < 0) x_shift = 0;
                if (y_shift < 0) y_shift = 0;
                //if (x_number < 15) alpha = 0.35;



                if (y < scheme.length && x < scheme[0].length) {
                    try {
                        let number = scheme[y][x];
                        if (number != 0) {
                            objects[x + x_shift][y + y_shift + emptyToSkip].updateCircle(
                                circleSizes[number], circleSizes[number], circleMaxSize[number], circleColors[number],
                                alpha);
                        }
                    } catch (err) {
                        console.log(err.message);
                    }
                }
            }
        }
    }




    function startAnimating(fps) {
        fpsInterval = 1000 / fps;
        then = Date.now();
        animate();
    }

    function animate() {

        requestAnimationFrame(animate);
        now = Date.now();
        elapsed = now - then;

        // if enough time has elapsed, draw the next frame
        if (elapsed > fpsInterval && !stop) {
            then = now - (elapsed % fpsInterval);

            canvasArea.clear();
            for (var i = 0; i < objects.length; i++) {
                for (var j = 0; j < objects[i].length; j++) {
                    objects[i][j].update();
                }
            }


        }
    }
})
