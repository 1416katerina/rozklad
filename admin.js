import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  firebaseConfig, days, hours, createDefaultSchedule, stateLabel, nextState
} from "./shared.js";

const ADMIN_EMAIL = "1416katerina@gmail.com";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginPanel = document.getElementById("loginPanel");
const adminPanel = document.getElementById("adminPanel");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const adminUser = document.getElementById("adminUser");
const logoutBtn = document.getElementById("logoutBtn");
const resetBtn = document.getElementById("resetBtn");
const grid = document.getElementById("adminDaysGrid");
const saveMessage = document.getElementById("saveMessage");

let schedule = createDefaultSchedule();
let unsubscribeSchedule = null;

async function saveSchedule(){
  saveMessage.textContent = "Зберігаю...";
  await setDoc(doc(db, "schedule", "current"), {
    days: schedule,
    updatedAt: serverTimestamp()
  }, { merge: true });
  saveMessage.textContent = "✓ Збережено. Учні вже бачать оновлення.";
}

function renderDay(day){
  const card = document.createElement("section");
  card.className = "day-card";

  const vals = Object.values(schedule[day.name] || {});
  const freeCount = vals.filter(v => v === "free").length;
  const bookedCount = vals.filter(v => v === "booked").length;

  const head = document.createElement("div");
  head.className = "day-head";
  head.innerHTML = `
    <div class="day-left">
      <div class="day-icon">${day.emoji}</div>
      <div>
        <h2 class="day-name">${day.name}</h2>
        <div class="day-sub">Натискайте на час, щоб змінити статус</div>
      </div>
    </div>
    <div class="day-counts">
      <span class="count free">🟢 Вільно: ${freeCount}</span>
      <span class="count booked">🔴 Зайнято: ${bookedCount}</span>
    </div>`;

  const list = document.createElement("div");
  list.className = "slot-list";

  hours.forEach(time => {
    const state = schedule[day.name]?.[time] || "unavailable";
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `slot admin-slot ${state}`;
    slot.innerHTML = `<span class="time">${time}</span><span class="state">${stateLabel(state)}</span>`;

    slot.addEventListener("click", async () => {
      schedule[day.name][time] = nextState(schedule[day.name][time]);
      render();
      try{
        await saveSchedule();
      }catch(error){
        console.error(error);
        saveMessage.textContent = "Помилка збереження. Перевірте правила Firestore.";
      }
    });

    list.appendChild(slot);
  });

  card.append(head, list);
  return card;
}

function render(){
  grid.innerHTML = "";
  days.forEach(day => grid.appendChild(renderDay(day)));
}

loginBtn.addEventListener("click", async () => {
  loginMessage.textContent = "";
  try{
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
  }catch(error){
    console.error(error);
    loginMessage.textContent = "Не вдалося увійти. Перевірте email і пароль.";
  }
});

passwordInput.addEventListener("keydown", event => {
  if(event.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", () => signOut(auth));

resetBtn.addEventListener("click", async () => {
  if(!confirm("Скинути весь розклад до початкового стану?")) return;
  schedule = createDefaultSchedule();
  render();
  try{
    await saveSchedule();
  }catch(error){
    console.error(error);
    saveMessage.textContent = "Помилка збереження.";
  }
});

onAuthStateChanged(auth, user => {
  if(user && user.email === ADMIN_EMAIL){
    loginPanel.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    adminUser.textContent = `Ви увійшли як ${user.email}`;

    if(unsubscribeSchedule) unsubscribeSchedule();
    unsubscribeSchedule = onSnapshot(doc(db, "schedule", "current"), async snapshot => {
      if(snapshot.exists() && snapshot.data().days){
        schedule = snapshot.data().days;
      }else{
        schedule = createDefaultSchedule();
        try{ await saveSchedule(); }catch(e){ console.error(e); }
      }
      render();
    });
  }else{
    loginPanel.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    if(user) signOut(auth);
    if(unsubscribeSchedule){
      unsubscribeSchedule();
      unsubscribeSchedule = null;
    }
  }
});
