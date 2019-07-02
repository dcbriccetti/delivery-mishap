let noiseX = 0;

/** Returns scaled, shifted Perlin noise at the current x (noiseX) and the specified y position */
const pn = (y, from, to) => noise(noiseX, y) * (to - from) + from;

class Particle {
    constructor() {
        // Units are metric: m, m/s, m/s², etc.
        const cv = createVector;
        this.pos     = cv(0, 0, 0);
        this.vel     = cv(pn(0, -10, 40), pn(1, 10, 70), pn(2, -30, 10));
        this.accel   = cv(0, -9.81, 0);
        this.rot     = cv(0, 0, 0);
        this.rotVel  = cv(pn(3, 0, TAU), 0, pn(4, 0, TAU));
        this.color   = [random(255), random(255), random(255)];
        noiseX += 0.1;
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
        this.pos = createVector(20, 1, -20);
    }

    update() {
        const closest = this.boxes.reduce((a, b) => a && b ? a.pos.dist(this.pos) < b.pos.dist(this.pos) ? b : a : b, undefined);
        if (closest) {
            const to = p5.Vector.sub(closest.pos, this.pos).normalize();
            this.pos.x += to.x;
            this.pos.z += to.z;
        }
    }

    draw() {
        noStroke();
        fill('yellow');
        pushed(() => {
            translate(this.pos.x, this.pos.y, this.pos.z);
            ellipsoid(1, 2, 1);
        });
    }
}

let boxes = [];
let nextLaunch;
let collector;

function setup() {
    createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);
    collector = new Collector(boxes);
}

function draw() {
    background(135, 206, 235);
    translateAndScaleWorld(() => {
        drawGround();
        boxes.forEach(p => {
            p.update();
            p.draw();
        });
        //collector.update();
        //collector.draw();
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
    const getNextLaunch = () => secs() + random(0.3);

    if (!nextLaunch || secs() > nextLaunch) {
        boxes.push(new Particle());
        if (boxes.length > 1000)
            boxes.shift();
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
