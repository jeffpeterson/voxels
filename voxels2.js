var camera = new Camera(document.getElementById('game'));

function init() {
  requestAnimationFrame(clock);
}

function clock() {
  camera.render();
  requestAnimationFrame(clock);
}

function Camera(canvas) {
  this.canvas = canvas;
  this.width = canvas.width = window.innerWidth >> 2 | 0;
  this.height = canvas.height = window.innerHeight >> 2 | 0;

  this.ctx = canvas.getContext('2d');
  this.pixels = this.ctx.getImageData(0, 0, this.width, this.height);
  this.buffer = new ArrayBuffer(this.pixels.data.length);
  this.buf8 = new Uint8ClampedArray(this.buffer);
  this.buf32 = new Uint32Array(this.buffer);
}

Camera.prototype.render = function() {
  var w = this.width;
  var h = this.height;
  var pixels = this.pixels;
  var buf8 = this.buf8;
  var ctx = this.ctx;

  var r, g, b;
  var x, y;

  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      r = 0;
      g = 0;
      b = 0;
      this.buf32[y * w + x] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
  }

  pixels.data.set(buf8);
  ctx.putImageData(pixels, 0, 0);
};

