const roomCode = localStorage.getItem("room_code");
if (!roomCode) window.location.href = "index.html";

const bodyParts = ["Neck", "Lips", "Ears", "Collarbone", "Inner thigh", "Lower back", "Hands", "Chest", "Shoulders"];
const actions = ["Kiss", "Bite gently", "Trace with a finger", "Whisper something", "Massage", "Lick"];

const scenarios = [
  { text: "You're strangers meeting at a hotel bar for the first time.", intensity: 3 },
  { text: "Give your partner a 5-minute massage, no talking allowed.", intensity: 2 },
  { text: "One of you is blindfolded for the next 10 minutes.", intensity: 4 },
  { text: "Whoever loses the next round has to follow one command from the other.", intensity: 3 },
  { text: "Recreate your first kiss, but slower.", intensity: 2 },
  { text: "Take turns describing your favorite memory together in explicit detail.", intensity: 4 }
];

let intensityFilter = 3;

document.getElementById("intensity-slider").oninput = (e) => {
  intensityFilter = parseInt(e.target.value);
  document.getElementById("intensity-label").textContent = intensityFilter;
  loadGames();
};

async function loadGames() {
  const { data, error } = await supabaseClient
    .from("games")
    .select("*")
    .lte("intensity", intensityFilter);

  const list = document.getElementById("games-list");
  list.innerHTML = "";

  if (error) { list.innerHTML = `<p class="error">${error.message}</p>`; return; }
  if (!data || data.length === 0) { list.innerHTML = `<p>No games at this intensity yet.</p>`; return; }

  data.forEach(game => {
    const card = document.createElement("div");
    card.className = "answer-card";
    card.innerHTML = `
      <p style="font-weight:bold;">${game.title} ${game.has_in_app_version ? '<span class="tag" style="margin-left:6px;">Play</span>' : ""}</p>
      <p style="font-size:14px;">${game.description}</p>
      <p style="font-size:12px;color:#888;">${game.duration_minutes} min • ${game.requires_props ? "Needs props" : "No props needed"}</p>
    `;
    if (game.has_in_app_version) {
      card.style.cursor = "pointer";
      card.onclick = () => {
        if (game.title.toLowerCase().includes("dice")) openDiceModal();
        else if (game.title.toLowerCase().includes("scenario") || game.title.toLowerCase().includes("card")) openScenarioModal();
      };
    }
    list.appendChild(card);
  });
}

function openDiceModal() {
  document.getElementById("dice-modal").style.display = "flex";
}
document.getElementById("close-dice-btn").onclick = () => {
  document.getElementById("dice-modal").style.display = "none";
};
document.getElementById("roll-btn").onclick = () => {
  const action = actions[Math.floor(Math.random() * actions.length)];
  const part = bodyParts[Math.floor(Math.random() * bodyParts.length)];
  document.getElementById("dice-result").textContent = `${action} the ${part}`;
};

function openScenarioModal() {
  document.getElementById("scenario-modal").style.display = "flex";
}
document.getElementById("close-scenario-btn").onclick = () => {
  document.getElementById("scenario-modal").style.display = "none";
};
document.getElementById("draw-btn").onclick = () => {
  const options = scenarios.filter(s => s.intensity <= intensityFilter);
  const pick = options[Math.floor(Math.random() * options.length)];
  document.getElementById("scenario-text").textContent = pick ? pick.text : "No scenarios at this intensity.";
};

document.getElementById("surprise-btn").onclick = async () => {
  const { data } = await supabaseClient.from("games").select("*").lte("intensity", intensityFilter);
  if (!data || data.length === 0) return;
  const pick = data[Math.floor(Math.random() * data.length)];
  alert(`Tonight's game: ${pick.title}\n\n${pick.description}`);
};

loadGames();
