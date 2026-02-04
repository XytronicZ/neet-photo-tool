// ===============================
// NEET PHOTO TOOL (Blogger + GitHub)
// ===============================

const rules = {
  passport: { w: 413, h: 531, ratio: 3.5/4.5, text: true, maxKB: 200 },
  postcard: { w: 1200, h: 1800, ratio: 4/6, text: true, maxKB: 200 },
  signature: { w: 600, h: 300, ratio: NaN, text: false, maxKB: 30 }
};

let cropper = null;
const imgEl = document.getElementById('nt-target-image');

// Restore saved name
const savedName = localStorage.getItem("nt_name");
if (savedName) document.getElementById("nt-name").value = savedName;

// Upload
document.getElementById('nt-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    imgEl.src = ev.target.result;
    document.getElementById('nt-upload-stage').style.display = 'none';
    document.getElementById('nt-editor-stage').style.display = 'block';
    setTimeout(initCropper, 100);
  };
  reader.readAsDataURL(file);
});

// Init Cropper
function initCropper() {
  const type = ntType();
  if (cropper) cropper.destroy();

  cropper = new Cropper(imgEl, {
    aspectRatio: rules[type].ratio,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.85,
    guides: true,
    center: true,
    cropBoxMovable: isNaN(rules[type].ratio),
    cropBoxResizable: isNaN(rules[type].ratio),
    toggleDragModeOnDblclick: false
  });
}

// Rotate / Reset
function ntRotate(deg) { if (cropper) cropper.rotate(deg); }
function ntReset() { if (cropper) cropper.reset(); }

// Doc type change
function updateSettings() {
  const type = ntType();
  const isSig = type === 'signature';

  document.getElementById('nt-text-section').style.display = isSig ? 'none' : 'block';

  const slider = document.getElementById('nt-kb-slider');
  slider.max = rules[type].maxKB - 10;
  slider.value = rules[type].maxKB - 40;
  document.getElementById('nt-kb-disp').innerText = slider.value + " KB";

  if (cropper) initCropper();
}

// Start processing
function ntStartProcess() {
  document.getElementById('nt-loading').style.display = 'flex';
  setTimeout(generateImage, 500);
}

// Generate
function generateImage() {
  const type = ntType();
  const cfg = rules[type];
  const addText = document.getElementById('nt-add-text')?.checked;

  const canvas = cropper.getCroppedCanvas({ fillColor: "#fff", imageSmoothingQuality: "high" });
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = cfg.w;
  finalCanvas.height = cfg.h;
  const ctx = finalCanvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, cfg.w, cfg.h);
  ctx.drawImage(canvas, 0, 0, cfg.w, cfg.h);

  if (cfg.text && addText) {
    const name = document.getElementById("nt-name").value.toUpperCase();
    const dateVal = document.getElementById("nt-date").value;

    let dateStr = "DD-MM-YYYY";
    if (dateVal) {
      const d = new Date(dateVal);
      dateStr = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
    }

    const stripH = cfg.h * 0.18;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, cfg.h - stripH, cfg.w, stripH);

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.font = `bold ${cfg.w * 0.07}px Arial`;
    ctx.fillText(name || "NAME", cfg.w/2, cfg.h - stripH/2 - stripH*0.15);
    ctx.fillText(dateStr, cfg.w/2, cfg.h - stripH/2 + stripH*0.35);
  }

  let q = 0.95;
  const targetKB = parseInt(document.getElementById("nt-kb-slider").value);

  (function compress() {
    finalCanvas.toBlob(blob => {
      if (blob.size/1024 > targetKB && q > 0.1) {
        q -= 0.05;
        compress();
      } else finish(blob);
    }, "image/jpeg", q);
  })();
}

// Finish
function finish(blob) {
  const url = URL.createObjectURL(blob);
  document.getElementById("nt-final-img").src = url;
  document.getElementById("nt-dl-btn").href = url;
  document.getElementById("nt-final-size").innerText =
    "Final Size: " + (blob.size/1024).toFixed(1) + " KB";

  document.getElementById('nt-loading').style.display = 'none';
  document.getElementById('nt-editor-stage').style.display = 'none';
  document.getElementById('nt-result-stage').style.display = 'block';
}

// Helpers
function ntType() {
  return document.getElementById("nt-doctype").value;
}

// Save name
document.getElementById("nt-name").addEventListener("input", e => {
  localStorage.setItem("nt_name", e.target.value);
});
