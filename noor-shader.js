// Noor's light: flowing waves in the brand colors behind the logo's nested portals.
// Plain script so it also runs on the look-only preview. Drives any <canvas data-noor-shader>
// inside a [data-noor-hero] section. Add ?noorT=12 to freeze a frame.
(function () {
  var VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

  var FRAGMENT = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 u_res;uniform float u_t;",
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);",
    " return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.02+vec2(17.,9.);a*=.5;}return v;}",
    // Distance to the logo's portal shape, a pill; negative inside.
    "float pill(vec2 p,float w,float r){return length(vec2(max(abs(p.x)-w,0.),p.y))-r;}",
    // The soft brand colors, as slow waves.
    "vec3 waves(vec2 p,float t){",
    " vec2 q=p*.7;",
    " vec2 w=vec2(fbm(q+vec2(0.,t*.09)),fbm(q+vec2(5.2,1.3)-t*.075));",
    " float f=fbm(q+3.*w+vec2(t*.04,-t*.05));",
    " vec3 pink=vec3(1.,.373,.525),aqua=vec3(.247,.878,.835),lilac=vec3(.804,.718,.933);",
    " vec3 sky=vec3(.576,.651,.961),white=vec3(.976,.957,.973);",
    // Long ribbons of color rolling across the frame.
    " float band=.5+.5*sin(p.x*1.6+p.y*2.4+f*8.5+t*.16);",
    " float a=length(p-vec2(-1.2,-.85)+(w-.5)*2.9);",
    " float b=length(p-vec2(1.1,.85)+(w.yx-.5)*2.9);",
    " vec3 c=mix(lilac,sky,smoothstep(.35,.8,band)*.55);",
    " c=mix(c,white,smoothstep(.62,.98,band)*.72);",
    " c=mix(c,aqua,smoothstep(1.5,.25,b+(band-.5)*.5));",
    " c=mix(c,pink,smoothstep(1.6,.25,a+(band-.5)*.5));",
    " return c;}",
    "void main(){",
    " float aspect=u_res.x/u_res.y;",
    " vec2 p=(gl_FragCoord.xy-.5*u_res)/u_res.y*2.;",
    " bool tall=aspect<1.;",
    " float ratio=tall?1.45:2.1;",
    " float width=2.*aspect;",
    " float widest=tall?1.32:.88,wide=tall?1.04:.62,mid=tall?.82:.4,small=tall?.64:.25;",
    " vec2 total=vec2(0.);float glow=0.,edge=0.;",
    " vec2 shift=vec2(0.);",
    " for(int i=0;i<4;i++){",
    "  float n=float(i);",
    "  float frac=i==0?widest:i==1?wide:i==2?mid:small;",
    // The gentle breathing from before, each portal a little out of step.
    "  float breathe=1.+sin(u_t*.35-n*.7)*.018;",
    "  float W=frac*width*breathe;",
    "  float r=W/ratio*.5;",
    "  float sd=pill(p,W*.5-r,r);",
    "  float inside=smoothstep(.012,-.012,sd);",
    // Each portal shows the waves from its own turning angle.
    "  float ang=(mod(n,2.)<.5?1.:-1.)*u_t*.05+n*1.3;",
    "  shift+=inside*vec2(cos(ang),sin(ang))*.55;",
    "  edge+=exp(-abs(sd)/.035)*.42;",
    "  glow+=inside*exp(sd/.09)*.2;",
    " }",
    " vec3 c=waves(p+shift,u_t);",
    " c=mix(c,vec3(1.),clamp(edge+glow,0.,.72));",
    // Film grain, which also prevents color banding.
    " c+=(hash(gl_FragCoord.xy*.73+fract(u_t)*41.)-.5)*.055;",
    " gl_FragColor=vec4(c,1.);",
    "}",
  ].join("\n");

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function start(canvas) {
    if (canvas.dataset.noorRunning) return;
    canvas.dataset.noorRunning = "1";

    var hero = canvas.closest("[data-noor-hero]");
    var gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl || !hero) return; // The CSS version underneath stays visible.

    var vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var position = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(program, "u_res");
    var uTime = gl.getUniformLocation(program, "u_t");

    var frozenTime = new URLSearchParams(location.search).get("noorT");
    var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Render resolution falls automatically on slower devices.
    var quality = 1;
    function resize() {
      var r = canvas.getBoundingClientRect();
      // The light is soft, so about a megapixel looks the same as full resolution.
      var ratio = Math.min(window.devicePixelRatio || 1, Math.sqrt(1000000 / Math.max(1, r.width * r.height))) * quality;
      canvas.width = Math.max(1, Math.round(r.width * ratio));
      canvas.height = Math.max(1, Math.round(r.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function draw(time) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    var visible = true;
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    });
    observer.observe(canvas);

    var frame = 0;
    var running = false;
    var startedAt = performance.now();
    var last = startedAt;
    var slow = 0;
    var fast = 0;

    function schedule() {
      if (!running && visible && !document.hidden) {
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    function tick(now) {
      running = false;
      if (!canvas.isConnected) return stop();

      // Keep a smooth frame rate by trading resolution, never by dropping motion.
      if (now - last > 30) slow++;
      else fast++;
      if (slow + fast >= 12) {
        if (slow > 6 && quality > 0.35) {
          quality = Math.max(0.35, quality * 0.75);
          resize();
        }
        slow = fast = 0;
      }
      draw((now - startedAt) / 1000 + 40);
      window.__noorFrames = (window.__noorFrames || 0) + 1;
      schedule();
    }

    function stop() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", schedule);
      var lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    }

    function drawStill() {
      draw(frozenTime !== null ? parseFloat(frozenTime) : 52);
    }

    function onResize() {
      resize();
      if (still || frozenTime !== null) drawStill();
    }

    addEventListener("resize", onResize);
    resize();
    hero.dataset.noorLive = "1";

    if (still || frozenTime !== null) {
      drawStill();
      return;
    }
    document.addEventListener("visibilitychange", schedule);
    schedule();
  }

  function scan() {
    document.querySelectorAll("canvas[data-noor-shader]").forEach(start);
  }

  scan();
  // Pages can change without a reload when moving around the site.
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
