class Particle {
    constructor() {
        // Units are metric: m, m/s, m/s², etc.
        this.pos     = createVector(0, 0, 0);
        this.vel     = createVector(random(20) - 5, 20 + random(30), -random(30));
        this.accel   = createVector(0, -9.81, 0);
        this.rot     = createVector(0, 0, 0);
        this.rotVel  = createVector(random(TAU * 1), 0, random(TAU * 1));
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
        fill('yellow');
        stroke('blue');
        strokeWeight(5);
        pushed(() => {
            translate(this.pos.x, this.pos.y, this.pos.z);
            rotateX(this.rot.x);
            rotateY(this.rot.y);
            rotateZ(this.rot.z);
            box(2);  // Meters
        });
    }
}

let particles = [];
let nextLaunch;

function setup() {
    createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);
}

function draw() {
    background('blue');
    translateAndScaleWorld(() => {
        drawGround();
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        launch();
    });
}

function drawGround() {
    fill('green');
    let edge = 1000;
    pushed(() => {
        translate(0, -1, 0);
        box(edge, 1, edge);
    });
}

function launch() {
    const getNextLaunch = () => secs() + random(0.3);

    if (!nextLaunch || secs() > nextLaunch) {
        particles.push(new Particle());
        if (particles.length > 1000)
            particles.shift();
        nextLaunch = getNextLaunch();
    }
}

pushed = function (block) {
    push();
    block();
    pop();
};

/** Places the origin at the bottom center, makes y increase going up, and scales meters to pixels */
function translateAndScaleWorld(block) {
    const pixelsPerMeter = 30;
    const margin = 1.2 * pixelsPerMeter;
    pushed(() => {
        translate(-width / 2 + margin, height / 2 - margin, 0);
        scale(pixelsPerMeter, -pixelsPerMeter, pixelsPerMeter);
        block();
    });
}

function secs() {
    return millis() / 1000;
}
