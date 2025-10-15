const state = {
  photos: [null, null, null],
  note: "",
  frame: 0,
  color: "#000000",
  colorChoices: ["#232323", "#f6d88b", "#f1e6f2", "#dfe5ef", "#ffffff"]
};
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
function show(view){ qsa(".view").forEach(v=>v.classList.remove("is-active")); qs(`.view[data-view="${view}"]`).classList.add("is-active"); window.scrollTo(0,0); }
qs("#aboutBtn").addEventListener("click",()=>qs("#aboutDialog").showModal());
qsa("[data-nav]").forEach(b=>b.addEventListener("click",()=>{const dest=b.getAttribute("data-nav"); if(dest==="camera") initCamera(); show(dest);} ));
qsa("[data-next]").forEach(b=>b.addEventListener("click",()=>{const dest=b.getAttribute("data-next"); if(dest==="frames") buildFrames(); if(dest==="customize") buildCustomize(); show(dest);} ));
qsa(".upload-slot").forEach(slot=>{
  const input = slot.querySelector("input");
  slot.addEventListener("click",()=>input.click());
  input.addEventListener("change",e=>{
    const f=e.target.files[0]; if(!f) return;
    const url=URL.createObjectURL(f);
    const img=slot.querySelector("img"); img.src=url;
    slot.classList.add("has-image");
    state.photos[Number(slot.getAttribute("data-slot"))]=url;
  });
});
const noteInput = qs("#noteInput");
noteInput.addEventListener("input",()=> state.note = noteInput.value);

// Camera
let stream;
async function initCamera(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720}});
    qs("#cameraVideo").srcObject = stream;
    renderThumbs();
  }catch(e){ alert("Camera not available. Please use Upload Photos."); }
}
function stopCamera(){ if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } }
qs("#snapBtn").addEventListener("click",()=>{
  const video=qs("#cameraVideo"), canvas=qs("#cameraCanvas");
  canvas.width=640; canvas.height=480;
  canvas.getContext("2d").drawImage(video,0,0,640,480);
  const slot = state.photos.findIndex(p=>!p);
  const dataUrl = canvas.toDataURL("image/jpeg",0.9);
  if(slot!==-1) state.photos[slot]=dataUrl;
  renderThumbs();
});
qs("#retakeBtn").addEventListener("click",()=>{ state.photos=[null,null,null]; renderThumbs(); });
function renderThumbs(){
  const wrap=qs("#cameraThumbs"); wrap.innerHTML="";
  state.photos.forEach(p=>{ const img=new Image(); img.width=90; img.height=90; img.src=p||"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect width='100%' height='100%' fill='%23f6c667'/></svg>"; wrap.appendChild(img); });
}

// Frames
function buildFrames(){
  stopCamera();
  const row = qs("#framesRow"); row.innerHTML="";
  const variants=[{id:0,slots:[1,1,1],tall:true},{id:1,slots:[.9,.9,.9],tall:true},{id:2,slots:[1.2,.9,1.3],tall:true},{id:3,slots:[1,1],tall:false}];
  variants.forEach(v=>{
    const card=document.createElement("div"); card.className="frame-card "+(v.tall?"frame-tall":"");
    const slots=document.createElement("div"); slots.className="frame-slots";
    v.slots.forEach(()=>{ const s=document.createElement("div"); s.className="slot"; s.style.height=v.tall?"80px":"100px"; slots.appendChild(s); });
    card.appendChild(slots);
    card.addEventListener("click",()=>{ state.frame=v.id; qsa(".frame-card").forEach(el=>el.style.outline=""); card.style.outline="4px solid #c22b4c"; });
    row.appendChild(card);
  });
}

// Customize
function buildCustomize(){
  const preview=qs("#stripPreview"); preview.innerHTML="";
  state.photos.forEach(src=>{ const img=new Image(); img.className="strip-photo"; img.draggable=false; img.src=src||"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23ddd'/></svg>"; preview.appendChild(img); });
  const note=document.createElement("div"); note.className="strip-note"; note.textContent=state.note||""; preview.appendChild(note);

  const sw=qs("#colorSwatches"); sw.innerHTML="";
  state.colorChoices.forEach(col=>{ const b=document.createElement("button"); b.className="swatch"; b.style.background=col; if(col===state.color) b.classList.add("is-active"); b.onclick=()=>{ state.color=col; buildCustomize(); }; sw.appendChild(b); });

  preview.style.borderColor=state.color;

  qsa(".sticker").forEach(btn=>{
    btn.onclick=()=>{ const el=document.createElement("div"); el.className="sticker-drop"; el.textContent=btn.textContent; el.style.left="80px"; el.style.top="80px"; preview.appendChild(el); makeDraggable(el,preview); };
  });

  qs("#downloadBtn").onclick=()=>downloadStrip(preview);
}
function makeDraggable(el,container){
  let sx=0,sy=0,ox=0,oy=0;
  el.onpointerdown=e=>{
    sx=e.clientX; sy=e.clientY;
    const r=el.getBoundingClientRect(), cr=container.getBoundingClientRect();
    ox=r.left-cr.left; oy=r.top-cr.top;
    el.setPointerCapture(e.pointerId);
    el.onpointermove=ev=>{
      const nx=ox+(ev.clientX-sx), ny=oy+(ev.clientY-sy);
      el.style.left=Math.max(0,Math.min(cr.width-20,nx))+"px";
      el.style.top=Math.max(0,Math.min(cr.height-20,ny))+"px";
    };
    el.onpointerup=()=>{ el.onpointermove=null; };
  };
}

// Export canvas
async function downloadStrip(previewEl){
  const rect=previewEl.getBoundingClientRect();
  const canvas=document.createElement("canvas");
  canvas.width=600; canvas.height=Math.round(600*(rect.height/rect.width));
  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
  const frame=40, bottom=160, border=state.color;
  ctx.fillStyle=border;
  ctx.fillRect(0,0,canvas.width,frame);
  ctx.fillRect(0,0,frame,canvas.height);
  ctx.fillRect(canvas.width-frame,0,frame,canvas.height);
  ctx.fillRect(0,canvas.height-bottom,canvas.width,bottom);

  const innerW=canvas.width-frame*2, innerH=canvas.height-bottom-frame*2;
  const h=innerH/3-18, gap=27;
  for(let i=0;i<3;i++){
    const y=frame+i*(h+gap);
    const img=await loadImage(state.photos[i]);
    drawContain(ctx,img,frame+8,y,innerW-16,h);
  }
  ctx.fillStyle="#fffaf0"; ctx.font="36px 'Gochi Hand', system-ui"; ctx.textAlign="center";
  ctx.fillText(state.note||"", canvas.width/2, canvas.height-60);

  const a=document.createElement("a");
  a.download="photostrip.png";
  a.href=canvas.toDataURL("image/png");
  a.click();
}
function loadImage(src){ return new Promise(res=>{ const img=new Image(); img.crossOrigin="anonymous"; img.onload=()=>res(img); img.src=src||"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23ddd'/></svg>"; }); }
function drawContain(ctx,img,x,y,w,h){ const r=Math.min(w/img.width,h/img.height); const dw=img.width*r, dh=img.height*r; const dx=x+(w-dw)/2, dy=y+(h-dh)/2; ctx.fillStyle="#000"; ctx.fillRect(x,y,w,h); ctx.drawImage(img,dx,dy,dw,dh); }

renderThumbs();