// Noor's light: flowing waves in the measured brand colors behind the logo's nested portals.
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
    "uniform vec2 u_res;uniform float u_t;uniform sampler2D u_brand;",
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);",
    " return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.02+vec2(17.,9.);a*=.5;}return v;}",
    // Distance to the logo's portal shape, a pill; negative inside.
    "float pill(vec2 p,float w,float r){return length(vec2(max(abs(p.x)-w,0.),p.y))-r;}",
    // Every color on screen comes from the map measured off the brand file, smoothly blended.
    "vec3 brand(vec2 uv){",
    " vec2 size=vec2(7.,5.);",
    " vec2 st=clamp(uv,0.,1.)*size-.5;",
    " vec2 i=floor(st),f=fract(st);f=f*f*(3.-2.*f);",
    " return texture2D(u_brand,(i+f+.5)/size).rgb;}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/u_res;",
    " uv.y=1.-uv.y;",
    " float aspect=u_res.x/u_res.y;",
    " vec2 p=(gl_FragCoord.xy-.5*u_res)/u_res.y*2.;",
    " bool tall=aspect<1.;",
    " float ratio=tall?1.45:2.1;",
    " float width=2.*aspect;",
    " float widest=tall?1.32:.88,wide=tall?1.04:.62,mid=tall?.82:.4,small=tall?.64:.25;",
    // Waves only move the brand's colors around; they never add new ones.
    " float t=u_t;",
    " vec2 q=p*.8;",
    " vec2 w=vec2(fbm(q+vec2(0.,t*.09)),fbm(q+vec2(5.2,1.3)-t*.075));",
    " float f=fbm(q+3.*w+vec2(t*.04,-t*.05));",
    " vec2 flow=(w-.5)*.2+vec2(sin(p.y*2.2+f*7.+t*.16),cos(p.x*1.7+f*7.-t*.13))*.05;",
    " vec2 look=uv-.5;",
    " float rim=0.,shade=0.;",
    " for(int i=0;i<4;i++){",
    "  float n=float(i);",
    "  float frac=i==0?widest:i==1?wide:i==2?mid:small;",
    // The gentle breathing, each portal a little out of step.
    "  float W=frac*width*(1.+sin(t*.35-n*.7)*.018);",
    "  float r=W/ratio*.5;",
    "  float sd=pill(p,W*.5-r,r);",
    "  float inside=smoothstep(.035,-.035,sd);",
    // As in the brand image, each inner portal holds the whole gradient again, closer together.
    "  look*=mix(1.,1.34,inside);",
    "  rim+=exp(-abs(sd)/.03)*.2;",
    "  shade+=(1.-inside)*exp(-max(sd,0.)/.16)*.05;",
    " }",
    " vec3 c=brand(.5+look+flow);",
    // Blending fades color a little, so restore the strength measured in the brand file.
    " c=mix(vec3(dot(c,vec3(.299,.587,.114))),c,1.38);",
    " c*=1.-shade;",
    " c=mix(c,vec3(.98,.97,.99),clamp(rim,0.,.6));",
    // Film grain, which also prevents color banding.
    " c+=(hash(gl_FragCoord.xy*.73+fract(t)*41.)-.5)*.05;",
    " gl_FragColor=vec4(c,1.);",
    "}",
  ].join("\n");

  // Sampled from the Noor brand image: seven columns by five rows.
  var BRAND = [
    "EAE0F9 E3DFFB CACFFB A4CCF2 7ED4E7 77DFE2 93E4E6",
    "F3E0ED EEE2F6 DFDAFD 97C8F1 55DBDF 91E6E5 A1EBE8",
    "F8BED4 FCC3CF F9D0DD BCD2F3 BDF0EC CBF3EE C7EDEE",
    "FC9BB7 FE89A2 FA82AA DAAEE2 EBE8F4 F6F4F8 E6EEF4",
    "FC85A6 F783B5 E896D1 D7ADE4 D1C7EB E0DFF1 F2EEF7",
  ].join(" ").split(" ");

  function brandTexture(gl) {
    var bytes = new Uint8Array(BRAND.length * 4);
    BRAND.forEach(function (hex, i) {
      bytes[i * 4] = parseInt(hex.slice(0, 2), 16);
      bytes[i * 4 + 1] = parseInt(hex.slice(2, 4), 16);
      bytes[i * 4 + 2] = parseInt(hex.slice(4, 6), 16);
      bytes[i * 4 + 3] = 255;
    });
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 7, 5, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

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

    brandTexture(gl);
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
