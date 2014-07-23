var player = new Player();
var view = new View(document.getElementById('game'));
var world = new World();

function init() {
  requestAnimationFrame(clock);
}

function clock() {
  view.render(world, player);
  player.yRotation += Math.PI * 0.001;
  player.xRotation += Math.PI * 0.0005;
  requestAnimationFrame(clock);
}

function World() {
  this.grid = new Uint8Array(64 * 64 * 64);

  for (var i = 1; i < this.grid.length; i++) {
    if (Math.random() < 0.01) this.grid[i] = 1;
  }
}

function Player() {
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.xRotation = 0;   // looking up & down
  this.yRotation = 0;   // looking side-to-side
}

function View(canvas) {
  this.canvas = canvas;
  this.width = canvas.width = window.innerWidth >> 1 | 0;
  this.height = canvas.height = window.innerHeight >> 1 | 0;

  this.ctx = canvas.getContext('2d');
  this.pixels = this.ctx.getImageData(0, 0, this.width, this.height);
  this.buffer = new ArrayBuffer(this.pixels.data.length);
  this.buf8 = new Uint8ClampedArray(this.buffer);
  this.buf32 = new Uint32Array(this.buffer);
}

View.prototype.render = function(world, viewpoint) {
  var w = this.width;
  var h = this.height;

  var pixels = this.pixels;
  var buf8 = this.buf8;
  var ctx = this.ctx;

  var ox = viewpoint.x;
  var oy = viewpoint.y;
  var oz = viewpoint.z;

  var xRot = viewpoint.xRotation;
  var xSin = Math.sin(xRot);
  var xCos = Math.cos(xRot);

  var yRot = viewpoint.yRotation;
  var ySin = Math.sin(yRot);
  var yCos = Math.cos(yRot);

  var x, y;
  var tx, ty, tz;     // view-space
  var tx1, ty1, tz1;  // after x rotation
  var tx2, ty2, tz2;  // after y rotation

  var grid = world.grid;
  var axis, offset;
  var dx, dy, dz;     // deltas for each axis for each iteration
  var scale;
  var xp, yp, zp;
  var dist, closest;
  var r, g, b;

  tz = 1; // focal length

  for (y = 0; y < h; y++) {
    ty = (y - h / 2) / h;
    for (x = 0; x < w; x++) {
      tx = (x - w / 2) / h;

      // x-axis rotation
      ty1 = ty * xCos - tz * xSin;
      tz1 = ty * xSin + tz * xCos;
      tx1 = tx;

      // y-axis rotation
      tz2 = tz1 * yCos - tx1 * ySin;
      tx2 = tz1 * ySin + tx1 * yCos;
      ty2 = ty1;

      closest = 32;
      r = g = b = 0;

      for (axis = 0; axis < 3; axis++) {
        // x
        if (axis === 0) {
          scale = 1 / (tx2 < 0 ? -tx2 : tx2);
          offset = ox - (ox | 0);
        }
        // y
        else if (axis === 1) {
          scale = 1 / (ty2 < 0 ? -ty2 : ty2);
          offset = 1 - (oy - (oy | 0));
        }
        // z
        else if (axis === 2) {
          scale = 1 / (tz2 < 0 ? -tz2 : tz2);
          offset = 1 - (oz - (oz | 0));
        }

        dx = tx2 * scale;
        dy = ty2 * scale;
        dz = tz2 * scale;

        xp = ox + dx * offset;
        yp = oy + dy * offset;
        zp = oz + dz * offset;

        // compensate for flooring negatives
        if (axis === 0 && tx2 < 0) xp--;
        else if (axis === 1 && ty2 < 0) yp--;
        else if (axis === 2 && tz2 < 0) zp--;

        dist = scale * offset;

        while (dist < closest) {
          var block = grid[(zp & 63) << 12 | (yp & 63) << 6 | (xp & 63)];

          if (block > 0) {
            if (axis === 0) {
              r = 255;
              g = b = 0;
            }
            else if (axis === 1) {
              g = 255;
              r = b = 0;
            }
            else if (axis === 2) {
              b = 255;
              r = g = 0;
            }
            closest = dist;
          }

          xp += dx;
          yp += dy;
          zp += dz;
          dist += scale;
        }
      }

      this.buf32[x + y * w] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
  }

  pixels.data.set(buf8);
  ctx.putImageData(pixels, 0, 0);
};

