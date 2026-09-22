/* Breda Pastel Studio — wires.js (v1.0.0)
   Draws the thin teal "wire sculpture" connectors between page elements.

   Markup:
     <div class="bps-stage" data-wires>            ← the canvas (position: relative)
       <div id="a" class="bps-disc" data-wire-to="#b" data-wire-arrow>AIR</div>
       <div id="b" class="bps-card">Clean air on the canal route.</div>
     </div>

   Attributes on the source element:
     data-wire-to="#id[, #id2]"   one or more targets
     data-wire-arrow              small arrowhead at the target end
     data-wire-from="right"       side to leave from: left | right | top | bottom | auto (default auto)
     data-wire-into="left"        side to arrive at: same values (default auto)
     data-wire-bend="0.5"         curvature 0..1 (default 0.45)

   The overlay SVG (class bps-wires) is (re)built on load, on resize and when the
   stage changes size. Wires stay purely decorative: they carry no information the
   text does not already give, so they need no ARIA role.                        */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function anchor(rect, side, box) {
    var x = rect.left - box.left, y = rect.top - box.top, w = rect.width, h = rect.height;
    switch (side) {
      case 'left':   return { x: x,        y: y + h / 2, nx: -1, ny: 0 };
      case 'right':  return { x: x + w,    y: y + h / 2, nx: 1,  ny: 0 };
      case 'top':    return { x: x + w / 2, y: y,        nx: 0,  ny: -1 };
      default:       return { x: x + w / 2, y: y + h,    nx: 0,  ny: 1 };
    }
  }

  function autoSides(ra, rb) {
    var dx = (rb.left + rb.width / 2) - (ra.left + ra.width / 2);
    var dy = (rb.top + rb.height / 2) - (ra.top + ra.height / 2);
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? ['right', 'left'] : ['left', 'right'];
    return dy > 0 ? ['bottom', 'top'] : ['top', 'bottom'];
  }

  function draw(stage) {
    var old = stage.querySelector(':scope > svg.bps-wires');
    if (old) old.remove();
    var sources = stage.querySelectorAll('[data-wire-to]');
    if (!sources.length) return;
    var box = stage.getBoundingClientRect();
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'bps-wires');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    svg.setAttribute('preserveAspectRatio', 'none');

    sources.forEach(function (src) {
      src.getAttribute('data-wire-to').split(',').forEach(function (sel) {
        var dst = stage.querySelector(sel.trim()) || document.querySelector(sel.trim());
        if (!dst) return;
        var ra = src.getBoundingClientRect(), rb = dst.getBoundingClientRect();
        var sides = autoSides(ra, rb);
        var from = src.getAttribute('data-wire-from') || 'auto';
        var into = src.getAttribute('data-wire-into') || 'auto';
        var A = anchor(ra, from === 'auto' ? sides[0] : from, box);
        var B = anchor(rb, into === 'auto' ? sides[1] : into, box);
        var bend = parseFloat(src.getAttribute('data-wire-bend') || '0.45');
        var dist = Math.hypot(B.x - A.x, B.y - A.y);
        var k = Math.max(28, dist * bend);
        var c1 = { x: A.x + A.nx * k, y: A.y + A.ny * k };
        var c2 = { x: B.x + B.nx * k, y: B.y + B.ny * k };
        var d = 'M ' + A.x + ' ' + A.y + ' C ' + c1.x + ' ' + c1.y + ', ' + c2.x + ' ' + c2.y + ', ' + B.x + ' ' + B.y;
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
        if (src.hasAttribute('data-wire-arrow')) {
          var ang = Math.atan2(B.y - c2.y, B.x - c2.x);
          var s = 7;
          var p1 = { x: B.x - s * Math.cos(ang - 0.5), y: B.y - s * Math.sin(ang - 0.5) };
          var p2 = { x: B.x - s * Math.cos(ang + 0.5), y: B.y - s * Math.sin(ang + 0.5) };
          var head = document.createElementNS(NS, 'path');
          head.setAttribute('class', 'bps-wire-head');
          head.setAttribute('d', 'M ' + B.x + ' ' + B.y + ' L ' + p1.x + ' ' + p1.y + ' L ' + p2.x + ' ' + p2.y + ' Z');
          svg.appendChild(head);
        }
      });
    });
    stage.appendChild(svg);
  }

  function drawAll() {
    document.querySelectorAll('[data-wires]').forEach(draw);
  }

  var pending = null;
  function schedule() {
    if (pending) cancelAnimationFrame(pending);
    pending = requestAnimationFrame(function () { pending = null; drawAll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', drawAll);
  else drawAll();
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(schedule);
    document.querySelectorAll('[data-wires]').forEach(function (s) { ro.observe(s); });
  }
  window.bpsWires = { redraw: drawAll };
})();
