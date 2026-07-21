const roomInput = document.getElementById("room-input");
const joinBtn = document.getElementById("join-btn");
const roomError = document.getElementById("room-error");

// If already joined a room, skip straight to Today screen
const savedRoom = localStorage.getItem("room_code");
if (savedRoom) {
  window.location.href = "today.html";
}

joinBtn.addEventListener("click", async () => {
  const code = roomInput.value.trim().toLowerCase().replace(/\s+/g, "-");
  if (!code) {
    roomError.textContent = "Please enter a room code.";
    return;
  }

  // Check if room exists, create if not
  const { data: existing } = await supabaseClient
    .from("rooms")
    .select("room_code")
    .eq("room_code", code)
    .single();

  if (!existing) {
    const { error } = await supabaseClient
      .from("rooms")
      .insert({ room_code: code });
    if (error) {
      roomError.textContent = "Something went wrong creating the room.";
      return;
    }
  }

  localStorage.setItem("room_code", code);
  window.location.href = "today.html";
});
