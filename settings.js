const roomCode = localStorage.getItem("room_code");
if (!roomCode) window.location.href = "index.html";

document.getElementById("room-code-display").textContent = roomCode;

async function loadIntensity() {
  const { data } = await supabaseClient
    .from("rooms").select("intensity_level").eq("room_code", roomCode).single();
  const level = data?.intensity_level || 2;
  document.getElementById("intensity-slider").value = level;
  document.getElementById("intensity-val").textContent = level;
}

document.getElementById("intensity-slider").oninput = async (e) => {
  const level = parseInt(e.target.value);
  document.getElementById("intensity-val").textContent = level;
  await supabaseClient.from("rooms").update({ intensity_level: level }).eq("room_code", roomCode);
};

document.getElementById("notif-btn").onclick = async () => {
  if (!("Notification" in window)) {
    document.getElementById("notif-status").textContent = "Notifications aren't supported on this browser.";
    return;
  }
  const permission = await Notification.requestPermission();
  document.getElementById("notif-status").textContent =
    permission === "granted" ? "Enabled ✅" : "Permission denied.";
};

document.getElementById("reset-pin-btn").onclick = () => {
  const vaultKey = "vault_pin_" + roomCode;
  localStorage.removeItem(vaultKey);
  alert("PIN cleared. You'll be asked to set a new one next time you open Gallery.");
};

document.getElementById("leave-room-btn").onclick = () => {
  if (confirm("This will remove the room code from this device. You'll need to re-enter it to get back in. Continue?")) {
    localStorage.removeItem("room_code");
    localStorage.removeItem("my_role");
    window.location.href = "index.html";
  }
};

loadIntensity();
