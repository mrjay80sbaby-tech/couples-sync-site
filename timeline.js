const roomCode = localStorage.getItem("room_code");
if (!roomCode) window.location.href = "index.html";

document.getElementById("add-btn").onclick = () => {
  document.getElementById("add-modal").style.display = "flex";
};
document.getElementById("cancel-btn").onclick = () => {
  document.getElementById("add-modal").style.display = "none";
};

document.getElementById("save-btn").onclick = async () => {
  const title = document.getElementById("title-input").value.trim();
  const date = document.getElementById("date-input").value;
  const note = document.getElementById("note-input").value.trim();

  if (!title || !date) { alert("Please add a title and date."); return; }

  const { error } = await supabaseClient.from("timeline_events").insert({
    room_code: roomCode, title, date, note
  });

  if (error) { alert("Saving failed: " + error.message); return; }

  document.getElementById("title-input").value = "";
  document.getElementById("date-input").value = "";
  document.getElementById("note-input").value = "";
  document.getElementById("add-modal").style.display = "none";
  loadTimeline();
};

async function loadTimeline() {
  const { data, error } = await supabaseClient
    .from("timeline_events")
    .select("*")
    .eq("room_code", roomCode)
    .order("date", { ascending: false });

  const list = document.getElementById("timeline-list");
  list.innerHTML = "";

  if (error) { list.innerHTML = `<p class="error">${error.message}</p>`; return; }
  if (!data || data.length === 0) { list.innerHTML = `<p>No memories added yet.</p>`; return; }

  data.forEach(event => {
    const card = document.createElement("div");
    card.className = "answer-card";
    card.innerHTML = `
      <p style="font-weight:bold;">${event.title}</p>
      <p style="font-size:12px;color:#888;">${new Date(event.date).toLocaleDateString()}</p>
      ${event.note ? `<p style="margin-top:6px;">${event.note}</p>` : ""}
    `;
    list.appendChild(card);
  });
}

loadTimeline();
