const roomCode = localStorage.getItem("room_code");
if (!roomCode) window.location.href = "index.html";

let myRole = localStorage.getItem("my_role");

function showError(msg) {
  document.getElementById("prompt-text").textContent = "Something went wrong: " + msg;
  document.getElementById("prompt-category").textContent = "Error";
}

async function ensureRole() {
  if (myRole) return myRole;
  const role = confirm("Are you Partner A? (Cancel = Partner B)") ? "a" : "b";
  localStorage.setItem("my_role", role);
  myRole = role;
  return role;
}

async function getTodayPrompt() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing, error: fetchError } = await supabaseClient
    .from("daily_prompts")
    .select("*")
    .eq("room_code", roomCode)
    .eq("date", today);

  if (fetchError) throw new Error("Fetching today's prompt failed: " + fetchError.message);
  if (existing && existing.length > 0) return existing[0];

  const { data: room, error: roomError } = await supabaseClient
    .from("rooms").select("intensity_level").eq("room_code", roomCode);
  if (roomError) throw new Error("Fetching room failed: " + roomError.message);
  const maxIntensity = (room && room[0]?.intensity_level) || 2;

  const { data: bankOptions, error: bankError } = await supabaseClient
    .from("prompt_bank")
    .select("*")
    .lte("intensity", maxIntensity);

  if (bankError) throw new Error("Fetching prompt bank failed: " + bankError.message);
  if (!bankOptions || bankOptions.length === 0) throw new Error("Prompt bank is empty for this intensity level.");

  const pick = bankOptions[Math.floor(Math.random() * bankOptions.length)];

  const { data: created, error: insertError } = await supabaseClient
    .from("daily_prompts")
    .insert({
      room_code: roomCode, date: today,
      text: pick.text, category: pick.category, intensity: pick.intensity
    })
    .select();

  if (insertError) throw new Error("Creating today's prompt failed: " + insertError.message);
  return created[0];
}

async function render() {
  try {
    await ensureRole();
    const prompt = await getTodayPrompt();

    document.getElementById("prompt-category").textContent = prompt.category;
    document.getElementById("prompt-text").textContent = prompt.text;

    const myAnswer = myRole === "a" ? prompt.answer_a : prompt.answer_b;
    const partnerAnswer = myRole === "a" ? prompt.answer_b : prompt.answer_a;

    if (prompt.both_answered) {
      document.getElementById("answer-section").style.display = "none";
      document.getElementById("waiting-section").style.display = "none";
      document.getElementById("reveal-section").style.display = "block";
      document.getElementById("my-answer-text").textContent = myAnswer;
      document.getElementById("partner-answer-text").textContent = partnerAnswer;
    } else if (myAnswer) {
      document.getElementById("answer-section").style.display = "none";
      document.getElementById("waiting-section").style.display = "block";
    } else {
      document.getElementById("answer-section").style.display = "block";
    }

    document.getElementById("submit-answer-btn").onclick = async () => {
      const text = document.getElementById("answer-input").value.trim();
      if (!text) return;

      const field = myRole === "a" ? "answer_a" : "answer_b";
      const otherField = myRole === "a" ? "answer_b" : "answer_a";
      const bothAnswered = !!prompt[otherField];

      const { error } = await supabaseClient
        .from("daily_prompts")
        .update({ [field]: text, both_answered: bothAnswered })
        .eq("id", prompt.id);

      if (error) { showError("Saving answer failed: " + error.message); return; }
      render();
    };
  } catch (err) {
    showError(err.message);
  }
}

render();
