import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { firebaseConfig, days, hours, createDefaultSchedule, stateLabel } from "./shared.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const grid = document.getElementById("daysGrid");
const allBtn = document.getElementById("allFilterBtn");
const freeBtn = document.getElementById("freeFilterBtn");
const onlineStatus = document.getElementById("onlineStatus");

let filter = "all";
let schedule = createDefaultSchedule();

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
        <div class="day-sub">Оберіть зручний вільний час</div>
      </div>
    </div>
    <div class="day-counts">
      <span class="count free">🟢 Вільно: ${freeCount}</span>
      <span class="count booked">🔴 Зайнято: ${bookedCount}</span>
    </div>`;

  const list = document.createElement("div");
  list.className = "slot-list";
  let visible = 0;

  hours.forEach(time => {
    const state = schedule[day.name]?.[time] || "unavailable";
    if(filter === "free" && state !== "free") return;
    visible++;

    const slot = document.createElement("div");
    slot.className = `slot ${state}`;
    slot.title = state === "free"
      ? `${day.name}, ${time} — вільно`
      : state === "booked"
        ? `${day.name}, ${time} — заброньовано`
        : `${day.name}, ${time} — недоступно`;

    slot.innerHTML = `<span class="time">${time}</span><span class="state">${stateLabel(state)}</span>`;
    list.appendChild(slot);
  });

  if(!visible){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "На цей день вільних віконець немає.";
    list.appendChild(empty);
  }

  card.append(head, list);
  return card;
}

function render(){
  grid.innerHTML = "";
  days.forEach(day => grid.appendChild(renderDay(day)));
  allBtn.classList.toggle("active", filter === "all");
  freeBtn.classList.toggle("active", filter === "free");
}

allBtn.addEventListener("click", () => { filter = "all"; render(); });
freeBtn.addEventListener("click", () => { filter = "free"; render(); });

render();

onSnapshot(doc(db, "schedule", "current"), snapshot => {
  if(snapshot.exists()){
    const data = snapshot.data();
    if(data.days) schedule = data.days;
  }
  onlineStatus.textContent = "● Розклад онлайн";
  render();
}, error => {
  console.error(error);
  onlineStatus.textContent = "● Не вдалося підключитися";
});
