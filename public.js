import {
  firebaseConfig, days, hours, createDefaultSchedule, stateLabel
} from "./shared.js";

const dayTabs = document.getElementById("dayTabs");
const dayContent = document.getElementById("dayContent");
const allBtn = document.getElementById("allFilterBtn");
const freeBtn = document.getElementById("freeFilterBtn");

let filter = "all";
let schedule = createDefaultSchedule();
let selectedDay = days[0].name;

function getDay(dayName){
  return days.find(day => day.name === dayName) || days[0];
}

function renderTabs(){
  dayTabs.innerHTML = "";

  days.forEach(day => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `day-tab ${selectedDay === day.name ? "active" : ""}`;
    btn.innerHTML = `<span>${day.emoji}</span>${day.name}`;

    btn.addEventListener("click", () => {
      selectedDay = day.name;
      renderTabs();
      renderSelectedDay();
    });

    dayTabs.appendChild(btn);
  });
}

function renderSelectedDay(){
  const day = getDay(selectedDay);
  const values = Object.values(schedule[day.name] || {});
  const freeCount = values.filter(v => v === "free").length;
  const bookedCount = values.filter(v => v === "booked").length;

  const card = document.createElement("section");
  card.className = "day-card";

  const titleRow = document.createElement("div");
  titleRow.className = "day-title-row";
  titleRow.innerHTML = `
    <div class="day-title-left">
      <div class="day-icon">${day.emoji}</div>
      <div>
        <h3 class="day-name">${day.name}</h3>
        <div class="day-sub">Оберіть зручний час</div>
      </div>
    </div>
    <div class="day-counts">
      <span class="count free">🟢 Вільно: ${freeCount}</span>
      <span class="count booked">🔴 Зайнято: ${bookedCount}</span>
    </div>
  `;

  const list = document.createElement("div");
  list.className = "slot-list";

  let visible = 0;

  hours.forEach(time => {
    const state = schedule[day.name]?.[time] || "unavailable";
    if(filter === "free" && state !== "free") return;

    visible++;
    const slot = document.createElement("div");
    slot.className = `slot ${state}`;
    slot.innerHTML = `
      <span class="time">${time}</span>
      <span class="state">${stateLabel(state)}</span>
    `;
    list.appendChild(slot);
  });

  if(!visible){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "На цей день вільних віконець немає.";
    list.appendChild(empty);
  }

  card.append(titleRow, list);
  dayContent.innerHTML = "";
  dayContent.appendChild(card);

  allBtn.classList.toggle("active", filter === "all");
  freeBtn.classList.toggle("active", filter === "free");
}

allBtn.addEventListener("click", () => {
  filter = "all";
  renderSelectedDay();
});

freeBtn.addEventListener("click", () => {
  filter = "free";
  renderSelectedDay();
});

// Сторінка відображається одразу, навіть якщо Firebase тимчасово недоступний.
renderTabs();
renderSelectedDay();

// Firebase підключаємо після відображення сторінки.
(async function connectFirebase(){
  try{
    const [{ initializeApp }, { getFirestore, doc, onSnapshot }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js")
    ]);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    onSnapshot(doc(db, "schedule", "current"), snapshot => {
      if(snapshot.exists() && snapshot.data().days){
        schedule = snapshot.data().days;
        renderSelectedDay();
      }
    }, error => {
      console.error("Firestore:", error);
    });
  }catch(error){
    console.error("Firebase load:", error);
  }
})();
