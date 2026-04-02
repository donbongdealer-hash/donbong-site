(function(){
  const _P={c1:[0.12,0.85,0.4,1],c2:[0.25,0.95,0.5,1],c3:[0.05,0.2,0.08,1],c4:[0.02,0.1,0.04,1],con:5.8,li:0.6,sa:0.14};
  const VS=`attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}`;
  const FS=`precision mediump float;uniform float t;uniform vec2 r;uniform vec4 c1,c2,c3,c4;uniform float con,li,sa;void main(){vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;float len=length(uv);float ang=atan(uv.y,uv.x)+t*-0.18-16.*(sa*len+(1.-sa));uv=vec2(len*cos(ang),len*sin(ang))*26.;float s=t*5.5;vec2 u2=vec2(uv.x+uv.y);for(int i=0;i<6;i++){u2+=sin(max(uv.x,uv.y)*1.1)+uv;uv+=0.5*vec2(cos(5.1+0.38*u2.y+s*0.14),sin(u2.x-0.13*s));uv-=cos(uv.x+uv.y)-sin(uv.x*0.65-uv.y);}float m=0.28*con+0.55*sa+1.3;float res=min(2.,max(0.,length(uv)*0.032*m));float p1=max(0.,1.-m*abs(1.-res));float p2=max(0.,1.-m*abs(res));float p3=1.-min(1.,p1+p2);float l=(li-0.15)*max(p1*6.-5.,0.)+li*max(p2*6.-5.,0.);float split=sin(u2.x*0.38+u2.y*0.22+s*0.18)*0.5+0.5;vec4 bg=mix(c3,c4,split);gl_FragColor=(0.25/con)*c1+(1.-0.25/con)*(c1*p1+c2*p2+vec4(p3*bg.rgb,p3*c1.a))+l;}`;
  const wrap=document.getElementById('glbg');
  const canvas=document.createElement('canvas');canvas.style.cssText='width:100%;height:100%;';wrap.appendChild(canvas);
  const gl=canvas.getContext('webgl',{alpha:false,depth:false});
  if(!gl)return;
  const mkS=(tp,src)=>{const s=gl.createShader(tp);gl.shaderSource(s,src);gl.compileShader(s);return s;};
  const prog=gl.createProgram();gl.attachShader(prog,mkS(gl.VERTEX_SHADER,VS));gl.attachShader(prog,mkS(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);gl.useProgram(prog);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,-1,3,3,-1]),gl.STATIC_DRAW);
  const pa=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(pa);gl.vertexAttribPointer(pa,2,gl.FLOAT,false,0,0);
  const UL={t:gl.getUniformLocation(prog,'t'),r:gl.getUniformLocation(prog,'r'),c1:gl.getUniformLocation(prog,'c1'),c2:gl.getUniformLocation(prog,'c2'),c3:gl.getUniformLocation(prog,'c3'),c4:gl.getUniformLocation(prog,'c4'),con:gl.getUniformLocation(prog,'con'),li:gl.getUniformLocation(prog,'li'),sa:gl.getUniformLocation(prog,'sa')};
  const resize=()=>{canvas.width=wrap.offsetWidth;canvas.height=wrap.offsetHeight;gl.viewport(0,0,canvas.width,canvas.height);};
  resize();window.addEventListener('resize',resize);
  function animate(now){gl.uniform1f(UL.t,now*.001);gl.uniform2f(UL.r,canvas.width,canvas.height);gl.uniform4fv(UL.c1,_P.c1);gl.uniform4fv(UL.c2,_P.c2);gl.uniform4fv(UL.c3,_P.c3);gl.uniform4fv(UL.c4,_P.c4);gl.uniform1f(UL.con,_P.con);gl.uniform1f(UL.li,_P.li);gl.uniform1f(UL.sa,_P.sa);gl.drawArrays(gl.TRIANGLES,0,3);updateUIColors(_P);requestAnimationFrame(animate);}
  requestAnimationFrame(animate);
  function hsl2rgb(h,s,l){h/=360;let r,g,b;if(s===0)r=g=b=l;else{const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;const t=c=>{let k=c;if(k<0)k+=1;if(k>1)k-=1;if(k<1/6)return p+(q-p)*6*k;if(k<.5)return q;if(k<2/3)return p+(q-p)*(2/3-k)*6;return p;};r=t(h+1/3);g=t(h);b=t(h-1/3);}return[r,g,b];}
  const rnd=(a,b)=>a+Math.random()*(b-a);
  function buildPalette(){
    const baseH=Math.random()*360;const h2=(baseH+150+rnd(-12,12))%360;
    const toG=(rgb)=>[...rgb,1];
    return{c1:toG(hsl2rgb(baseH,0.9,0.52)),c2:toG(hsl2rgb(h2,0.9,0.58)),c3:toG(hsl2rgb((h2+35)%360,0.85,0.12)),c4:toG(hsl2rgb(baseH,0.4,0.06)),con:rnd(4.8,6.2),li:rnd(.55,.7),sa:rnd(.1,.18)};
  }
  function updateUIColors(palette) {
    const c1 = palette.c1.map(v => v * 255);
    const root = document.documentElement;
    const toHex = (rgb) => { const r = Math.round(rgb[0]).toString(16).padStart(2,'0'); const g = Math.round(rgb[1]).toString(16).padStart(2,'0'); const b = Math.round(rgb[2]).toString(16).padStart(2,'0'); return `#${r}${g}${b}`; };
    root.style.setProperty('--accent', toHex(c1));
    root.style.setProperty('--accent-dim', `rgba(${c1[0]},${c1[1]},${c1[2]},0.15)`);
    root.style.setProperty('--accent-glow', `rgba(${c1[0]},${c1[1]},${c1[2]},0.35)`);
    root.style.setProperty('--border-light', `rgba(${c1[0]},${c1[1]},${c1[2]},0.25)`);
    const c3 = palette.c3.map(v => v * 255);
    root.style.setProperty('--bg-primary', toHex(c3));
    root.style.setProperty('--surface', `rgba(${c3[0]},${c3[1]},${c3[2]},0.72)`);
    root.style.setProperty('--card-bg', `rgba(${c3[0]},${c3[1]},${c3[2]},0.85)`);
    const goldHue = (Math.atan2(c1[1],c1[0])*180/Math.PI+30)%360;
    const goldRgb = hsl2rgb(goldHue,0.8,0.5).map(v=>v*255);
    root.style.setProperty('--gold', toHex(goldRgb));
  }
  document.getElementById('rnd-btn').addEventListener('click',()=>{
    const next=buildPalette();const from={c1:[..._P.c1],c2:[..._P.c2],c3:[..._P.c3],c4:[..._P.c4],con:_P.con,li:_P.li,sa:_P.sa};
    const start=performance.now();const dur=900;
    function step(now){let t=Math.min(1,(now-start)/dur);t=t*t*(3-2*t);_P.c1=from.c1.map((v,i)=>v+(next.c1[i]-v)*t);_P.c2=from.c2.map((v,i)=>v+(next.c2[i]-v)*t);_P.c3=from.c3.map((v,i)=>v+(next.c3[i]-v)*t);_P.c4=from.c4.map((v,i)=>v+(next.c4[i]-v)*t);_P.con=from.con+(next.con-from.con)*t;_P.li=from.li+(next.li-from.li)*t;_P.sa=from.sa+(next.sa-from.sa)*t;updateUIColors(_P);if(t<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  });
})();