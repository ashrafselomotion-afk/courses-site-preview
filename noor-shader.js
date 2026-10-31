// Noor's living light: liquid brand colors with portals emerging from the logo.
// Plain script so it also runs on the look-only preview. Drives any <canvas data-noor-shader>
// inside a [data-noor-hero] section. Add ?noorT=12 (and &noorS=0.5 for scroll) to freeze a frame.
(function () {
  var VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

  var FRAGMENT = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 u_res;uniform float u_t;uniform float u_s;uniform vec2 u_m;uniform float u_mp;",
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);",
    " return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.02+vec2(17.,9.);a*=.5;}return v;}",
    // Distance to the logo's portal shape, a pill; negative inside.
    "float pill(vec2 p,float w,float r){return length(vec2(max(abs(p.x)-w,0.),p.y))-r;}",
    "vec2 pillNormal(vec2 p,float w){vec2 q=vec2(sign(p.x)*max(abs(p.x)-w,0.),p.y);return q/max(length(q),.0001);}",
    // The brand's gradient, as a flowing liquid.
    "vec3 liquid(vec2 p,float t){",
    " vec2 q=p*.62;",
    " vec2 w=vec2(fbm(q+vec2(0.,t*.07)),fbm(q+vec2(5.2,1.3)-t*.055));",
    " float f=fbm(q+2.6*w+vec2(t*.03,-t*.04));",
    " float side=smoothstep(-1.3,1.3,p.x-p.y*.9+(w.x-.5)*2.6+sin(t*.09)*.5);",
    " vec3 pink=vec3(1.,.27,.47),coral=vec3(1.,.5,.42),lilac=vec3(.74,.62,.98);",
    " vec3 blue=vec3(.3,.42,.95),aqua=vec3(.13,.88,.82),mint=vec3(.66,.97,.84),lime=vec3(.78,.98,.5);",
    " vec3 warm=mix(pink,coral,smoothstep(.3,.7,w.y));",
    " warm=mix(warm,lilac,smoothstep(.42,.72,f));",
    " vec3 cool=mix(blue,aqua,smoothstep(.3,.62,f));",
    " cool=mix(cool,mint,smoothstep(.55,.78,w.x));",
    " vec3 c=mix(warm,cool,side);",
    " c=mix(c,lilac,smoothstep(.34,.0,abs(side-.5))*.75);",
    " c=mix(c,lime,smoothstep(.6,.76,w.y*.6+f*.55)*.75);",
    " c=mix(c,vec3(1.,.97,.99),smoothstep(.6,.82,f+(w.y-.5)*.5)*.8);",
    " return c;}",
    "void main(){",
    " float m=min(u_res.x,u_res.y);",
    " vec2 p=(gl_FragCoord.xy-.5*u_res)/m*2.;",
    " vec2 world=p;",
    " float portrait=u_res.x<u_res.y?1.42:1.;",
    // Scrolling flies the camera through the gate.
    " float s=u_s;",
    " p*=exp(-s*s*4.2);",
    " float base=.205*portrait;",
    " float ratio=1.3;",
    " vec2 disp=vec2(0.);float rim=0.,depth=0.;",
    " float phase=u_t*.018+s*1.1;",
    " for(int i=0;i<7;i++){",
    "  float d=fract(float(i)/7.+phase);",
    "  float size=base*exp(d*3.4);",
    "  float fade=smoothstep(0.,.14,d)*smoothstep(1.,.72,d);",
    "  float wd=size*ratio;",
    "  float sd=pill(p,wd,size);",
    "  float inside=smoothstep(size*.03,-size*.03,sd);",
    "  disp+=pillNormal(p,wd)*inside*smoothstep(-size*.55,0.,sd)*.17*fade;",
    "  rim+=fade*exp(-abs(sd)/(.03+size*.09));",
    "  depth+=fade*(inside*.045-(1.-inside)*exp(-max(sd,0.)/(size*.3))*.16);",
    " }",
    // The still innermost portal that holds the logo.
    " float sd=pill(p,base*ratio,base);",
    " float inner=smoothstep(.012,-.012,sd);",
    " disp+=pillNormal(p,base*ratio)*inner*smoothstep(-base*.7,0.,sd)*.2;",
    " rim+=exp(-abs(sd)/.05)*.7;",
    " depth-=(1.-inner)*exp(-max(sd,0.)/.09)*.14;",
    // The pointer gently stirs the light.
    " vec2 toM=world-u_m;float near=exp(-dot(toM,toM)*2.4)*u_mp;",
    " disp+=toM*near*.28;",
    " vec3 c=liquid(p+disp,u_t);",
    " c=mix(c,c*c*(3.-2.*c),.35);",
    " c*=1.+depth;",
    " c*=mix(1.,.86,inner);",
    " c=mix(c,vec3(1.,.97,.99),clamp(rim*.34+near*.07,0.,.8));",
    // Stepping through the gate: light floods out into the page.
    " vec3 paper=vec3(.949,.949,.961);",
    " c=mix(c,vec3(1.),smoothstep(.55,.82,s)*.85);",
    " c=mix(c,paper,smoothstep(.8,.98,s));",
    // Film grain, which also prevents color banding.
    " float g=hash(gl_FragCoord.xy*.73+fract(u_t)*41.)-.5;",
    " c+=g*.075*(1.-smoothstep(.8,.98,s));",
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

    var u = {};
    ["u_res", "u_t", "u_s", "u_m", "u_mp"].forEach(function (name) {
      u[name] = gl.getUniformLocation(program, name);
    });

    var params = new URLSearchParams(location.search);
    var frozenTime = params.get("noorT");
    var frozenScroll = params.get("noorS");
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

    var scroll = 0;
    var scrollTarget = 0;
    function readScroll() {
      var r = hero.getBoundingClientRect();
      var range = r.height - window.innerHeight;
      scrollTarget = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
    }

    var mouse = [0, 0];
    var mouseTarget = [0, 0];
    var presence = 0;
    var presenceTarget = 0;
    function onPointer(e) {
      var r = canvas.getBoundingClientRect();
      var m = Math.min(r.width, r.height);
      mouseTarget = [((e.clientX - r.left - r.width / 2) / m) * 2, (-(e.clientY - r.top - r.height / 2) / m) * 2];
      presenceTarget = e.pointerType === "touch" ? 0 : 1;
    }
    function onLeave() {
      presenceTarget = 0;
    }

    var visible = true;
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    });
    observer.observe(canvas);

    function draw(time) {
      gl.uniform2f(u.u_res, canvas.width, canvas.height);
      gl.uniform1f(u.u_t, time);
      gl.uniform1f(u.u_s, scroll);
      gl.uniform2f(u.u_m, mouse[0], mouse[1]);
      gl.uniform1f(u.u_mp, presence);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function applyScroll() {
      hero.style.setProperty("--noor-s", scroll.toFixed(4));
    }

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

      var elapsed = now - last;
      last = now;
      // Keep a smooth frame rate by trading resolution, never by dropping motion.
      if (elapsed > 30) slow++;
      else fast++;
      if (slow + fast >= 12) {
        if (slow > 6 && quality > 0.35) {
          quality = Math.max(0.35, quality * 0.75);
          resize();
        }
        slow = fast = 0;
      }

      // Based on elapsed time, so slower devices keep up with the scroll.
      var seconds = Math.min(elapsed, 250) / 1000;
      var follow = 1 - Math.exp(-seconds * 7);
      var drift = 1 - Math.exp(-seconds * 3);
      scroll += (scrollTarget - scroll) * follow;
      mouse[0] += (mouseTarget[0] - mouse[0]) * drift;
      mouse[1] += (mouseTarget[1] - mouse[1]) * drift;
      presence += (presenceTarget - presence) * drift;
      applyScroll();
      draw((now - startedAt) / 1000 + 40);
      window.__noorFrames = (window.__noorFrames || 0) + 1;
      window.__noorQuality = quality;
      schedule();
    }

    function stop() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("resize", onResize);
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", schedule);
      var lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    }

    function drawStill() {
      readScroll();
      scroll = frozenScroll !== null ? parseFloat(frozenScroll) : still ? 0 : scrollTarget;
      applyScroll();
      draw(frozenTime !== null ? parseFloat(frozenTime) : 52);
    }

    function onResize() {
      resize();
      readScroll();
      if (still || frozenTime !== null) drawStill();
    }
    function onScroll() {
      readScroll();
    }

    addEventListener("resize", onResize);
    resize();
    hero.dataset.noorLive = "1";

    if (still || frozenTime !== null) {
      drawStill();
      return;
    }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", schedule);
    readScroll();
    scroll = scrollTarget;
    schedule();
  }

  function scan() {
    document.querySelectorAll("canvas[data-noor-shader]").forEach(start);
  }

  scan();
  // Pages can change without a reload when moving around the site.
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
