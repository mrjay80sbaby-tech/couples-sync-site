const roomCode = localStorage.getItem("room_code");
if (!roomCode) window.location.href = "index.html";

// Figure out if I'm "partner A" or "partner B" for this room (first visitor = A, second = B)
let myRole = localStorage.getItem("my_role");

async function ensureRole() {
  if (myRole) return myRole;
  const { data: room } = await supabaseClient
    .from("rooms")
    .select("*")
    .eq("room_code", roomCode)
    .single();

  // naive approach: if no role set yet, check if any prompt has answer_a filled by someone else
  // simplest fix: let user pick once, store locally
  const role = localStorage.getItem("my_role") || (confirm("Are you Partner A? (Cancel = Partner B)") ? "a" : "b");
  localStorage.setItem("my_role", role);
  myRole = role;
  return role;
}

async function getTodayPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  let { data: prompt } = await supabaseClient
    .from("daily_prompts")
    .select("*")
    .eq("room_code", roomCode)
    .eq("date", today)
    .single();

  if (!prompt) {
    // pick a random prompt from bank matching room intensity
    const { data: room } = await supabaseClient
      .from("rooms").select("intensity_level").eq("room_code", roomCode).single();
    const maxIntensity = room?.intensity_level || 2;

    const { data: bankOptions } = await supabaseClient
      .from("prompt_bank")
      .select("*")
      .lte("intensity", maxIntensity);

    const pick = bankOptions[Math.floor(Math.random() * bankOptions.length)];

    const { data: created } = await supabaseClient
      .from("daily_prompts")
      .insert({
        room_code: roomCode, date: today,
        text: pick.text, category: pick.category, intensity: pick.intensity
      })
      .select().single();
    prompt = created;
  }
  return prompt;
}

async function render() {
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

    await supabaseClient
      .from("daily_prompts")
      .update({ [field]: text, both_answered: bothAnswered })
      .eq("id", prompt.id);

    render();
  };
}

render();
