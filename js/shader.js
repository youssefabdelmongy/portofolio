/* shader.js — raw WebGL "ink tide" hero backdrop.
   No libraries. Renders a domain-warped fbm field in the site palette at a
   reduced buffer size, pauses offscreen / hidden tab. Runs on phones too (the
   wow has to survive the small screen), at a smaller buffer and 30fps, and
   bails out only for reduced-motion or missing WebGL — the CSS gradient
   underneath is the fallback. */
window.PF = window.PF || {};
(function (PF) {
  const hero = document.querySelector('.hero');
  if (!hero || PF.reduceMotion()) return;
  const coarse = PF.isCoarse();

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  const FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uS;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
    'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}',
    'void main(){',
    '  float asp=uRes.x/uRes.y;',
    '  vec2 p=(gl_FragCoord.xy-uRes*.5)/uRes.y;',
    '  vec2 m=(uM-uRes*.5)/uRes.y;',
    '  float t=uT*.055;',
    '  vec2 q=vec2(fbm(p*1.55+vec2(0.,t)),fbm(p*1.55+vec2(5.2,1.3)-t*.7));',
    '  vec2 r=vec2(fbm(p*1.55+q*1.5+vec2(1.7,9.2)+t*.85),fbm(p*1.55+q*1.5+vec2(8.3,2.8)-t*.6));',
    '  float f=fbm(p*1.25+r*1.75);',
    '  float dm=length((p-m*.5)*vec2(asp*.9,.85));',
    '  f+=smoothstep(1.05,0.,dm)*.26;',
    '  float band=smoothstep(.44,.66,f);',
    '  float band2=smoothstep(.55,.78,f);',
    '  float rib=.5+.5*sin(p.y*3.4+r.x*2.6+t*1.2);',
    '  float side=smoothstep(-.55,.75,p.x);',
    '  vec3 ink=vec3(.039,.039,.043);',
    '  vec3 navy=vec3(.075,.115,.235);',
    '  vec3 orange=vec3(.894,.341,.180);',
    '  vec3 amber=vec3(.949,.663,.231);',
    '  vec3 col=mix(ink,navy,smoothstep(.18,.86,f)*1.05);',
    '  col=mix(col,orange,pow(band,1.7)*(.55+.45*rib)*(.35+.65*side)*(.75+.35*uS));',
    '  col=mix(col,amber,pow(band2,4.5)*rib*.55*(.3+.7*side));',
    '  col*= .82+.28*smoothstep(1.5,.15,length(p*vec2(.62,.95)));',
    '  col+=(hash(gl_FragCoord.xy+fract(uT)*13.7)-.5)*.014;',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  const canvas = document.createElement('canvas');
  canvas.className = 'hero__shader';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  const gl = canvas.getContext('webgl', {
    antialias: false, alpha: false, depth: false, stencil: false,
    powerPreference: 'low-power', preserveDrawingBuffer: false
  }) || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.remove(); return; }

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uT = gl.getUniformLocation(prog, 'uT');
  const uM = gl.getUniformLocation(prog, 'uM');
  const uS = gl.getUniformLocation(prog, 'uS');

  let w = 1, h = 1, dpr = 1;
  function resize() {
    const r = hero.getBoundingClientRect();
    /* deliberately low-res: phones get a smaller buffer so it stays smooth */
    dpr = Math.min(window.devicePixelRatio || 1, 1.5) * (coarse ? 0.42 : 0.55);
    w = Math.max(2, Math.round(r.width * dpr));
    h = Math.max(2, Math.round(r.height * dpr));
    canvas.width = w; canvas.height = h;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    draw();
  }

  /* the field is steered by the hand, or by the thumb on a phone */
  let mx = 0.5, my = 0.72;
  function steer(cx, cy) {
    const r = canvas.getBoundingClientRect();
    mx = PF.lerp(mx, (cx - r.left) * dpr, 0.14);
    my = PF.lerp(my, (r.height - (cy - r.top)) * dpr, 0.14);
  }
  window.addEventListener('mousemove', function (e) { steer(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') steer(e.clientX, e.clientY);
  }, { passive: true });
  /* on touch, the tide drifts on its own so the hero is never a still image */
  let drift = 0;

  let time = 0, last = performance.now(), visible = true, dirty = true;

  function draw() {
    gl.uniform1f(uT, time);
    gl.uniform2f(uM, mx, my);
    gl.uniform1f(uS, PF.scroll ? PF.clamp(PF.scroll.y / 900, 0, 1) : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    dirty = false;
  }

  /* ~40fps on desktop, ~30fps on phones, only while the hero is on screen */
  PF.tick(function (t, dt) {
    if (!visible) return;
    if (t - last < (coarse ? 33 : 24)) return;
    last = t;
    time += dt * 0.001;
    if (coarse) {
      drift += dt * 0.00016;
      mx = (0.5 + Math.cos(drift * 1.7) * 0.34) * w;
      my = (0.5 + Math.sin(drift * 2.1) * 0.3) * h;
    }
    if (Math.abs(PF.scroll ? PF.scroll.y : 0) > window.innerHeight * 1.05) return;
    draw();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && dirty) { last = performance.now(); draw(); }
    }, { threshold: 0 }).observe(hero);
  }

  gl.uniform2f(uRes, 1, 1);
  resize();
  window.addEventListener('resize', PF.debounce(resize, 180));
  workerFallbackTeardown();
  hero.classList.add('has-shader');

  /* if the context is lost (GPU reset, tab discard) drop back to CSS gradient */
  function workerFallbackTeardown() {
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      canvas.remove();
      hero.classList.remove('has-shader');
    });
  }
})(window.PF);
