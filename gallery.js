const roomCode = localStorage.getItem("room_code");
if (!roomCode) window.location.href = "index.html";

const vaultKey = "vault_pin_" + roomCode;
let pendingFile = null;

function showError(msg) {
  document.getElementById("vault-error").textContent = msg;
}

document.getElementById("unlock-btn").onclick = () => {
  const entered = document.getElementById("pin-input").value.trim();
  const savedPin = localStorage.getItem(vaultKey);

  if (!savedPin) {
    if (entered.length < 4) { showError("Choose a PIN with at least 4 digits."); return; }
    localStorage.setItem(vaultKey, entered);
    unlockGallery();
    return;
  }

  if (entered === savedPin) {
    unlockGallery();
  } else {
    showError("Incorrect PIN.");
  }
};

function unlockGallery() {
  document.getElementById("vault-lock-screen").style.display = "none";
  document.getElementById("gallery-content").style.display = "block";
  loadMedia();
}

if (!localStorage.getItem(vaultKey)) {
  document.getElementById("set-pin-note").textContent = "No PIN set yet — enter one now to create it.";
}

document.getElementById("upload-btn").onclick = () => {
  document.getElementById("file-input").click();
};

document.getElementById("file-input").onchange = (e) => {
  pendingFile = e.target.files[0];
  if (pendingFile) {
    document.getElementById("caption-input").style.display = "block";
    document.getElementById("confirm-upload-btn").style.display = "block";
  }
};

document.getElementById("confirm-upload-btn").onclick = async () => {
  if (!pendingFile) return;
  const caption = document.getElementById("caption-input").value.trim();
  const btn = document.getElementById("confirm-upload-btn");
  btn.textContent = "Uploading...";
  btn.disabled = true;

  const filePath = `${roomCode}/${Date.now()}_${pendingFile.name}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("gallery-media")
    .upload(filePath, pendingFile);

  if (uploadError) {
    alert("Upload failed: " + uploadError.message);
    btn.textContent = "Upload"; btn.disabled = false;
    return;
  }

  const { data: urlData } = supabaseClient.storage
    .from("gallery-media")
    .getPublicUrl(filePath);

  const myRole = localStorage.getItem("my_role") || "a";

  await supabaseClient.from("media").insert({
    room_code: roomCode,
    file_url: urlData.publicUrl,
    caption: caption,
    uploader: myRole
  });

  pendingFile = null;
  document.getElementById("caption-input").value = "";
  document.getElementById("caption-input").style.display = "none";
  btn.style.display = "none";
  btn.textContent = "Upload"; btn.disabled = false;
  loadMedia();
};

async function loadMedia() {
  const { data, error } = await supabaseClient
    .from("media")
    .select("*")
    .eq("room_code", roomCode)
    .order("uploaded_at", { ascending: false });

  if (error) { alert("Loading gallery failed: " + error.message); return; }

  const grid = document.getElementById("media-grid");
  grid.innerHTML = "";

  data.forEach(item => {
    const isVideo = item.file_url.match(/\.(mp4|mov|webm)$/i);
    const card = document.createElement("div");
    card.className = "media-card";
    card.innerHTML = `
      ${isVideo
        ? `<video src="${item.file_url}" controls></video>`
        : `<img src="${item.file_url}">`}
      <p class="caption">${item.caption || ""}</p>
    `;
    grid.appendChild(card);
  });
}
