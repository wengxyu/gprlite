(() => {
  const placement = document.getElementById('placement');
  const bscan = document.getElementById('bscan');
  const pctx = placement.getContext('2d');
  const bctx = bscan.getContext('2d');

  const maxObjects = 3;
  const objects = []; // {x: m, z: m, shape: 'point'|'square', size_m: number}
  let draggingIndex = -1;
  let selectedIndex = -1;

  function val(id){ return parseFloat(document.getElementById(id).value); }

  function physToPix(xm, zm){
    const width_m = val('width_m');
    const max_depth_m = val('max_depth_m');
    const x = (xm / width_m) * placement.width;
    const y = (zm / max_depth_m) * placement.height;
    return {x, y};
  }
  function pixToPhys(xp, yp){
    const width_m = val('width_m');
    const max_depth_m = val('max_depth_m');
    const x = (xp / placement.width) * width_m;
    const z = (yp / placement.height) * max_depth_m;
    return {x, z};
  }

  function drawPlacement(){
    // background and ground surface line
    pctx.clearRect(0,0,placement.width, placement.height);
    pctx.fillStyle = '#0a0a0a';
    pctx.fillRect(0,0,placement.width, placement.height);
    pctx.strokeStyle = '#334155';
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.moveTo(0, 0.5);
    pctx.lineTo(placement.width, 0.5);
    pctx.stroke();

    // grid
    pctx.strokeStyle = '#1f2937';
    pctx.lineWidth = 1;
    const grid = 5;
    for(let i=1;i<grid;i++){
      const x = (i/grid)*placement.width;
      const y = (i/grid)*placement.height;
      pctx.beginPath(); pctx.moveTo(x,0); pctx.lineTo(x,placement.height); pctx.stroke();
      pctx.beginPath(); pctx.moveTo(0,y); pctx.lineTo(placement.width,y); pctx.stroke();
    }

    // objects
    objects.forEach((o, idx) => {
      const {x,y} = physToPix(o.x, o.z);
      const color = ['#f87171','#34d399','#60a5fa'][idx%3];
      pctx.fillStyle = color;
      pctx.strokeStyle = selectedIndex === idx ? '#fde047' : color;
      pctx.lineWidth = selectedIndex === idx ? 3 : 1.5;
      if(o.shape === 'square' && o.size_m > 0){
        const width_m = val('width_m');
        const max_depth_m = val('max_depth_m');
        const half = o.size_m/2;
        const wpx = (o.size_m/width_m) * placement.width;
        const hpx = (o.size_m/max_depth_m) * placement.height;
        pctx.strokeRect(x - wpx/2, y - hpx/2, wpx, hpx);
        pctx.fillRect(x - 4, y - 4, 8, 8);
      } else {
        pctx.beginPath(); pctx.arc(x,y,8,0,Math.PI*2); pctx.fill();
      }
      pctx.fillStyle = '#e5e7eb';
      pctx.font = '12px system-ui, sans-serif';
      const label = o.shape === 'square' ? `square ~${o.size_m.toFixed(2)}m` : 'point';
      pctx.fillText(`x=${o.x.toFixed(2)}m, z=${o.z.toFixed(2)}m (${label})`, x+10, y-10);
    });
  }

  function nearestObject(xp, yp){
    let best = -1, bestD = 1e9;
    objects.forEach((o, idx) => {
      const pt = physToPix(o.x, o.z);
      const d = Math.hypot(pt.x - xp, pt.y - yp);
      if(d < bestD){ bestD = d; best = idx; }
    });
    return (bestD <= 12) ? best : -1;
  }

  placement.addEventListener('mousedown', (e) => {
    const rect = placement.getBoundingClientRect();
    const xp = e.clientX - rect.left;
    const yp = e.clientY - rect.top;
    const idx = nearestObject(xp, yp);
    if(idx >= 0){ draggingIndex = idx; selectedIndex = idx; syncObjectControls(); drawPlacement(); return; }
    if(objects.length >= maxObjects) return;
    const p = pixToPhys(xp, yp);
    objects.push({x: +p.x.toFixed(2), z: +p.z.toFixed(2), shape: 'point', size_m: 0.0});
    selectedIndex = objects.length - 1;
    syncObjectControls();
    drawPlacement();
  });
  window.addEventListener('mousemove', (e) => {
    if(draggingIndex < 0) return;
    const rect = placement.getBoundingClientRect();
    const xp = e.clientX - rect.left;
    const yp = e.clientY - rect.top;
    const p = pixToPhys(xp, yp);
    // clamp
    const width_m = val('width_m');
    const max_depth_m = val('max_depth_m');
    objects[draggingIndex].x = Math.min(width_m, Math.max(0, +p.x.toFixed(2)));
    objects[draggingIndex].z = Math.min(max_depth_m, Math.max(0, +p.z.toFixed(2)));
    drawPlacement();
  });
  window.addEventListener('mouseup', () => draggingIndex = -1);

  document.getElementById('addObj').addEventListener('click', () => {
    if(objects.length >= maxObjects) return;
    const width_m = val('width_m');
    const max_depth_m = val('max_depth_m');
    objects.push({x: +(width_m/2).toFixed(2), z: +(max_depth_m/3).toFixed(2), shape: 'point', size_m: 0.0});
    selectedIndex = objects.length - 1;
    syncObjectControls();
    drawPlacement();
  });
  document.getElementById('clearObj').addEventListener('click', () => { objects.length = 0; selectedIndex=-1; syncObjectControls(); drawPlacement(); drawBscan([]); });

  async function runSimulation(){
    const payload = {
      width_m: val('width_m'),
      max_depth_m: val('max_depth_m'),
      traces: Math.max(20, Math.min(600, Math.floor(val('traces')))),
      samples: Math.max(20, Math.min(600, Math.floor(val('samples')))),
      epsilon_r: Math.max(1.0, val('epsilon_r')),
      wavelength_m: Math.max(0.01, val('wavelength_m')),
      objects: objects
    };
    const res = await fetch('/api/simulate', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const data = await res.json();
    drawBscan(data);
  }

  function drawBscan(data){
    bctx.clearRect(0,0,bscan.width,bscan.height);
    if(!data || !data.matrix){
      // empty background
      bctx.fillStyle = '#0a0a0a';
      bctx.fillRect(0,0,bscan.width,bscan.height);
      return;
    }
    const M = data.matrix;
    const rows = M.length, cols = M[0].length;
    const img = bctx.createImageData(bscan.width, bscan.height);
    // map matrix -> canvas with nearest scaling
    for(let y=0;y<bscan.height;y++){
      const j = Math.floor((y/(bscan.height-1))*(rows-1));
      for(let x=0;x<bscan.width;x++){
        const i = Math.floor((x/(bscan.width-1))*(cols-1));
        const v = Math.max(0, Math.min(1, M[j][i]));
        // grayscale colormap with slight blue tint
        const idx = (y*bscan.width + x) * 4;
        const g = Math.floor(v*255);
        img.data[idx] = g*0.8;      // R
        img.data[idx+1] = g*0.9;    // G
        img.data[idx+2] = 255 - g;  // B
        img.data[idx+3] = 255;      // A
      }
    }
    bctx.putImageData(img, 0, 0);

    // overlay target verticals and apex labels
    bctx.save();
    bctx.strokeStyle = '#f59e0b';
    bctx.lineWidth = 1;
    bctx.fillStyle = '#e5e7eb';
    bctx.font = '12px system-ui, sans-serif';
    const width_m = val('width_m');
    const max_depth_m = val('max_depth_m');
    objects.forEach((o) => {
      const x = (o.x/width_m) * bscan.width;
      const z = (o.z/max_depth_m) * bscan.height;
      bctx.beginPath(); bctx.moveTo(x,0); bctx.lineTo(x,bscan.height); bctx.stroke();
      bctx.fillText(`apex z≈${o.z.toFixed(2)}m`, x+6, z-6);
    });
    bctx.restore();
  }

  document.getElementById('runSim').addEventListener('click', runSimulation);

  // --- Parameter help popups ---
  const helps = {
    width_m: {
      title: 'Scan Width',
      text: 'The horizontal distance covered by the scan. Wider scans include more positions (X), so you see more of each hyperbola.'
    },
    max_depth_m: {
      title: 'Max Depth',
      text: 'The vertical range (Z). Deeper ranges show more of the hyperbola tails but dilute resolution if sample count stays fixed.'
    },
    traces: {
      title: 'Traces',
      text: 'Number of lateral positions (columns). More traces increase lateral resolution of the B-scan.'
    },
    samples: {
      title: 'Samples',
      text: 'Number of depth samples (rows). More samples increase vertical resolution of the B-scan.'
    },
    epsilon_r: {
      title: 'Relative Permittivity (εr)',
      text: 'Controls wave speed v = c / √εr (c≈0.3 m/ns). Higher εr slows waves, increasing two-way travel time and apparent depth-to-time mapping.'
    },
    wavelength_m: {
      title: 'Wavelength',
      text: 'Sets blur thickness around the hyperbola. Shorter wavelengths give sharper hyperbolas; longer wavelengths blur them more.'
    }
  };

  // create a reusable modal
  const helpModal = document.createElement('div');
  helpModal.id = 'helpModal';
  helpModal.innerHTML = '<div class="modal"><h3 id="helpTitle"></h3><p id="helpText"></p><button id="helpClose">Close</button></div>';
  document.body.appendChild(helpModal);
  const helpTitle = helpModal.querySelector('#helpTitle');
  const helpText = helpModal.querySelector('#helpText');
  const helpClose = helpModal.querySelector('#helpClose');
  helpClose.addEventListener('click', ()=> helpModal.classList.remove('show'));

  function attachHelp(id){
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('click', () => {
      const key = id.replace('_help','');
      const cfg = helps[key];
      if(!cfg) return;
      helpTitle.textContent = cfg.title;
      helpText.textContent = cfg.text;
      helpModal.classList.add('show');
    });
  }
  ['width_m_help','max_depth_m_help','traces_help','samples_help','epsilon_r_help','wavelength_m_help'].forEach(attachHelp);

  // --- Object controls (shape/size) ---
  const shapeSel = document.getElementById('obj_shape');
  const sizeInp = document.getElementById('obj_size');
  const selInfo = document.getElementById('sel_info');
  function syncObjectControls(){
    if(selectedIndex < 0 || selectedIndex >= objects.length){
      selInfo.textContent = 'No object selected';
      shapeSel.value = 'point';
      sizeInp.value = 0;
      shapeSel.disabled = true; sizeInp.disabled = true;
      return;
    }
    const o = objects[selectedIndex];
    selInfo.textContent = `Selected object #${selectedIndex+1}`;
    shapeSel.disabled = false; sizeInp.disabled = false;
    shapeSel.value = o.shape;
    sizeInp.value = o.size_m;
  }
  shapeSel.addEventListener('change', ()=>{
    if(selectedIndex<0) return; objects[selectedIndex].shape = shapeSel.value; drawPlacement();
  });
  sizeInp.addEventListener('input', ()=>{
    if(selectedIndex<0) return; objects[selectedIndex].size_m = Math.max(0, parseFloat(sizeInp.value)||0); drawPlacement();
  });

  // Clicking on bscan near an apex -> show calculation
  const apexTip = document.createElement('div');
  apexTip.id = 'apexTip';
  document.body.appendChild(apexTip);
  function hideApex(){ apexTip.classList.remove('show'); }
  bscan.addEventListener('mouseleave', hideApex);
  bscan.addEventListener('click', (e)=>{
    if(objects.length===0) return;
    const rect = bscan.getBoundingClientRect();
    const xp = e.clientX - rect.left;
    const yp = e.clientY - rect.top;
    // find nearest object's apex (x at object.x, z at object.z)
    const width_m = val('width_m');
    const max_depth_m = val('max_depth_m');
    const eps = val('epsilon_r');
    const c = 0.3; // m/ns
    const v = c/Math.sqrt(Math.max(1.0, eps));
    let bestI=-1, bestD=1e9, bestPx={x:0,y:0};
    objects.forEach((o, idx)=>{
      const ax = (o.x/width_m)*bscan.width;
      const ay = (o.z/max_depth_m)*bscan.height;
      const d = Math.hypot(ax-xp, ay-yp);
      if(d<bestD){bestD=d; bestI=idx; bestPx={x:ax,y:ay};}
    });
    if(bestI<0 || bestD>24) { hideApex(); return; }
    const o = objects[bestI];
    const T = 2*o.z / v; // ns
    // Show step-by-step
    apexTip.innerHTML = `<div class="panel"><b>Apex Calculation</b><br>
      εr = ${eps.toFixed(2)}, c ≈ 0.3 m/ns<br>
      v = c/√εr = ${(v).toFixed(3)} m/ns<br>
      apex depth z₀ = ${o.z.toFixed(2)} m<br>
      two-way time T = 2·z₀/v = ${(T).toFixed(2)} ns</div>`;
    apexTip.style.left = `${rect.left + bestPx.x + 12}px`;
    apexTip.style.top = `${rect.top + bestPx.y + 12}px`;
    apexTip.classList.add('show');
  });

  // Initial draw
  drawPlacement();
  syncObjectControls();
})();
