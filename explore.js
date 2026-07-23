const roomCode = localStorage.getItem("room_code");
if (!roomCode) window.location.href = "index.html";
const myRole = localStorage.getItem("my_role") || "a";

async function ensureSeeded() {
  const { data: existing } = await supabaseClient
    .from("ynm_items").select("id").eq("room_code", roomCode).limit(1);

  if (existing && existing.length > 0) return;

  const starterItems = [
    "Role-play", "Blindfolds", "Restraints (soft)", "Massage oil", "Trying a new location",
    "Toys", "Dirty talk scripts", "Food play", "Photography/video together",
    "Public-adjacent settings (balcony, car)", "Temperature play", "Specific roleplay scenarios",
    "Ice", "Costumes", "Reading erotica together", "New position or furniture",
    "Morning intimacy ritual", "Weekend no-phones intimacy day"
  ];

  await supabaseClient.from("ynm_items").insert(
    starterItems.map(text => ({ room_code: roomCode, text }))
  );
}

async function loadItems() {
  const responseField = myRole === "a" ? "response_a" : "response_b";
  const { data, error } = await supabaseClient
    .from("ynm_items")
    .select("*")
    .eq("room_code", roomCode)
    .is(responseField, null);

  const list = document.getElementById("items-list");
  list.innerHTML = "";

  if (error) { list.innerHTML = `<p class="error">${error.message}</p>`; return; }
  if (!data || data.length === 0) { list.innerHTML = `<p>You've answered everything so far. Check back later or ask your partner to add more in Settings.</p>`; return; }

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "answer-card";
    card.innerHTML = `
      <p style="margin-bottom:8px;">${item.text}</p>
      <div style="display:flex; gap:8px;">
        <button class="ynm-btn" data-id="${item.id}" data-val="no">No</button>
        <button class="ynm-btn" data-id="${item.id}" data-val="maybe">Maybe</button>
        <button class="ynm-btn" data-id="${item.id}" data-val="yes">Yes</button>
      </div>
    `;
    list.appendChild(card);
  });

  document.querySelectorAll(".ynm-btn").forEach(btn => {
    btn.onclick = async () => {
      await respond(btn.dataset.id, btn.dataset.val);
    };
  });
}

async function respond(itemId, value) {
  const responseField = myRole === "a" ? "response_a" : "response_b";
  const otherField = myRole === "a" ? "response_b" : "response_a";

  // Fetch current state to check partner's response (never displayed, only compared)
  const { data: current } = await supabaseClient
    .from("ynm_items").select("*").eq("id", itemId).single();

  const partnerResponse = current[otherField];
  const isMatch = value === "yes" && partnerResponse === "yes";

  await supabaseClient
    .from("ynm_items")
    .update({ [responseField]: value, is_match: isMatch })
    .eq("id", itemId);

  loadItems();
}

document.getElementById("show-matches-btn").onclick = async () => {
  const { data, error } = await supabaseClient
    .from("ynm_items")
    .select("text")
    .eq("room_code", roomCode)
    .eq("is_match", true);

  const list = document.getElementById("matches-list");
  list.innerHTML = "";

  if (error) { list.innerHTML = `<p class="error">${error.message}</p>`; }
  else if (!data || data.length === 0) { list.innerHTML = `<p>No matches yet — keep answering!</p>`; }
  else {
    data.forEach(item => {
      const p = document.createElement("p");
      p.textContent = "✅ " + item.text;
      list.appendChild(p);
    });
  }

  document.getElementById("matches-modal").style.display = "flex";
};

document.getElementById("close-matches-btn").onclick = () => {
  document.getElementById("matches-modal").style.display = "none";
};

ensureSeeded().then(loadItems);
