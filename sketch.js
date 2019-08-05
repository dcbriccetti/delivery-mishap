let noiseX = 0;

/** Returns scaled, shifted Perlin noise at the current x (noiseX) and the specified y position */
const pn = (y, from, to) => noise(noiseX, y) * (to - from) + from;

class Particle {
    constructor(id) {
        // Units are metric: m, m/s, m/s², etc.
        const cv = createVector;
        this.id      = id;
        this.pos     = cv(0, 0, 0);
        this.vel     = cv(pn(0, -20, 30), pn(1, 10, 70), pn(2, -30, 10));
        this.accel   = cv(0, -9.81, 0);
        this.rot     = cv(0, 0, 0);
        this.rotVel  = cv(pn(3, 0, TAU), 0, pn(4, 0, TAU));
        this.color   = [random(255), random(255), random(255)];
        noiseX += 0.1;
        this.claimed = false;
        this.lastUpdate = secs();
    }

    update() {
        if (this.pos.y >= 0) {
            const dt = secs() - this.lastUpdate;
            this.lastUpdate = secs();
            const mult = p5.Vector.mult;
            const Δpos = mult(this.vel, dt);
            const Δvel = mult(this.accel, dt);
            const Δrot = mult(this.rotVel, dt);
            this.pos.add(Δpos);
            this.vel.add(Δvel);
            this.rot.add(Δrot);
        }
    }

    draw() {
        fill(this.color[0], this.color[1], this.color[2]);
        stroke('black');
        pushed(() => {
            translate(this.pos.x, this.pos.y, this.pos.z);
            rotateX(this.rot.x);
            rotateY(this.rot.y);
            rotateZ(this.rot.z);
            box(1);  // Meters
        });
    }
}

class Collector {
    constructor(boxes) {
        this.boxes = boxes;
        this.pos = createVector(random(100), 1, -random(100));
        this.targetBox = undefined;
    }

    update() {
        if (this.pauseUntil && this.pauseUntil > secs())
            return;
        this.pauseUntil = undefined;

        if (this.targetBox !== undefined) {
            this.moveToward();
        } else {
            if (this.boxes.length) {
                let closestBoxIndex = -1;
                let shortestSqDist;
                this.boxes.forEach((box, i) => {
                    const d = p5.Vector.sub(this.boxes[i].pos, this.pos).magSq();
                    if (! box.claimed && box.vel.y < 0 && box.pos.y < 5 && (closestBoxIndex === -1 || d < shortestSqDist)) {
                        closestBoxIndex = i;
                        shortestSqDist = d;
                    }
                });
                if (closestBoxIndex >= 0) {
                    this.targetBox = this.boxes[closestBoxIndex];
                    this.targetBox.claimed = true;
                    this.moveToward();
                }
            }
        }
    }

    moveToward() {
        const boxPos = this.targetBox.pos;
        this.targetPosDirection = p5.Vector.sub(boxPos, this.pos).normalize();
        this.pos.x += this.targetPosDirection.x;
        this.pos.z += this.targetPosDirection.z;
        const closestBoxPos = this.targetBox.pos;
        const distToClosest = closestBoxPos.dist(this.pos);
        if (distToClosest < 3) {
            const i = this.boxes.findIndex(box => box.id === this.targetBox.id);
            this.boxes.splice(i, 1);
            this.pauseUntil = secs() + random(0.1);
            this.targetBox = undefined;
        }
    }

    draw() {
        noStroke();
        fill(255, 255, 0, 128);
        pushed(() => {
            translate(this.pos.x, this.pos.y, this.pos.z);
            cone(2, 6);
        });
    }
}

let boxes = [];
let nextBoxId = 1;
let collectors = [];
let nextLaunch;

function setup() {
    createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);
    collectors = Array.from(Array(5).keys(), () => new Collector(boxes));
}

function draw() {
    background(135, 206, 235);
    translateAndScaleWorld(() => {
        drawGround();
        boxes.forEach(p => {
            p.update();
            p.draw();
        });
        collectors.forEach(c => {
            c.update();
            c.draw();
        });
    });
    launch();
}

function drawGround() {
    fill(34, 139, 34);
    const edge = 1000;
    pushed(() => {
        translate(0, -1.4, 0);
        box(edge, 1, edge);
    });
}

function launch() {
    const getNextLaunch = () => secs() + pn(6, 0.01, 0.1);

    if (!nextLaunch || secs() > nextLaunch) {
        boxes.push(new Particle(nextBoxId++));
        nextLaunch = getNextLaunch();
    }
}

pushed = (block) => {
    push();
    block();
    pop();
};

/** Places the origin at the bottom left, makes y increase going up, and scales meters to pixels */
function translateAndScaleWorld(block) {
    const pixelsPerMeter = 30;
    const margin = 1.2 * pixelsPerMeter;
    pushed(() => {
        translate(-width / 2 + margin, height / 2 - margin, 0);
        scale(pixelsPerMeter, -pixelsPerMeter, pixelsPerMeter);
        block();
    });
}

const secs = () => millis() / 1000;
