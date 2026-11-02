import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9wbYhGRJUESS-nK4sbPH2CcQUbvuTmyM",
  authDomain: "rozklad-9f809.firebaseapp.com",
  projectId: "rozklad-9f809",
  storageBucket: "rozklad-9f809.firebasestorage.app",
  messagingSenderId: "654912835999",
  appId: "1:654912835999:web:89a3c8c41d45ae4fe42daa"
};

const days = [
  {name:"Понеділок",emoji:"🌿"},
  {name:"Вівторок",emoji:"☀️"},
  {name:"Середа",emoji:"⭐"},
  {name:"Четвер",emoji:"📘"},
  {name:"П'ятниця",emoji:"🎯"},
  {name:"Субота",emoji:"☕"},
  {name:"Неділя",emoji:"🌙"}
];

const hours = [];
for(let h=8;h<=21;h++){
  hours.push(`${h}:00`);
  if(h!==21) hours.push(`${h}:30`);
}

function toMinutes(time){
  const [h,m]=time.split(":").map(Number);
  return h*60+m;
}

function createDefaultSchedule(){
  const data={};
  days.forEach((day,i)=>{
    data[day.name]={};
    hours.forEach(time=>{
      const m=toMinutes(time);
      let state="unavailable";
      if(i<=4 && m>=600 && m<=1110) state="free";
      if(i===5 && m>=780 && m<=990) state="free";
      data[day.name][time]=state;
    });
  });
  return data;
}

function stateLabel(state){
  if(state==="free") return "Вільно";
  if(state==="booked") return "Зайнято";
  return "—";
}

const dayTabs = document.getElementById("dayTabs");
const dayContent = document.getElementById("dayContent");
const allBtn = document.getElementById("allFilterBtn");
const freeBtn = document.getElementById("freeFilterBtn");

let filter = "all";
let schedule = createDefaultSchedule();
let selectedDay = days[0].name;

function renderTabs(){
  dayTabs.innerHTML = "";
  days.forEach(day=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className=`day-tab ${selectedDay===day.name?"active":""}`;
    btn.innerHTML=`<span>${day.emoji}</span>${day.name}`;
    btn.addEventListener("click",()=>{
      selectedDay=day.name;
      renderTabs();
      renderSelectedDay();
    });
    dayTabs.appendChild(btn);
  });
}

function renderSelectedDay(){
  const day=days.find(d=>d.name===selectedDay) || days[0];
  const values=Object.values(schedule[day.name]||{});
  const freeCount=values.filter(v=>v==="free").length;
  const bookedCount=values.filter(v=>v==="booked").length;

  const card=document.createElement("section");
  card.className="day-card";

  const title=document.createElement("div");
  title.className="day-title-row";
  title.innerHTML=`
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
    </div>`;

  const list=document.createElement("div");
  list.className="slot-list";
  let visible=0;

  hours.forEach(time=>{
    const state=schedule[day.name]?.[time] || "unavailable";
    if(filter==="free" && state!=="free") return;
    visible++;
    const slot=document.createElement("div");
    slot.className=`slot ${state}`;
    slot.innerHTML=`<span class="time">${time}</span><span class="state">${stateLabel(state)}</span>`;
    list.appendChild(slot);
  });

  if(!visible){
    const empty=document.createElement("div");
    empty.className="empty";
    empty.textContent="На цей день вільних віконець немає.";
    list.appendChild(empty);
  }

  card.append(title,list);
  dayContent.innerHTML="";
  dayContent.appendChild(card);
  allBtn.classList.toggle("active",filter==="all");
  freeBtn.classList.toggle("active",filter==="free");
}

allBtn.addEventListener("click",()=>{filter="all";renderSelectedDay();});
freeBtn.addEventListener("click",()=>{filter="free";renderSelectedDay();});

renderTabs();
renderSelectedDay();

try{
  const app=initializeApp(firebaseConfig);
  const db=getFirestore(app);

  onSnapshot(doc(db,"schedule","current"),snapshot=>{
    if(snapshot.exists() && snapshot.data().days){
      schedule=snapshot.data().days;
      renderSelectedDay();
    }
  },error=>{
    console.error("Firestore read error:",error);
  });
}catch(error){
  console.error("Firebase init error:",error);
}
