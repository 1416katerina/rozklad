const days = [
  {name:"Понеділок",emoji:"🌿"},
  {name:"Вівторок",emoji:"☀️"},
  {name:"Середа",emoji:"⭐"},
  {name:"Четвер",emoji:"📘"},
  {name:"П'ятниця",emoji:"🎯"},
  {name:"Субота",emoji:"☕"},
  {name:"Неділя",emoji:"🌙"}
];

const grid=document.getElementById("daysGrid");
const allBtn=document.getElementById("allFilterBtn");
const freeBtn=document.getElementById("freeFilterBtn");
let filter="all";

const hours=[];
for(let h=8;h<=21;h++){
  hours.push(`${h}:00`);
  if(h!==21) hours.push(`${h}:30`);
}

function toMinutes(t){
  const [h,m]=t.split(":").map(Number);
  return h*60+m;
}

function createSchedule(){
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

const schedule=createSchedule();

function label(state){
  if(state==="free") return "Вільно";
  if(state==="booked") return "Зайнято";
  return "—";
}

function renderDay(day){
  const card=document.createElement("section");
  card.className="day-card";

  const vals=Object.values(schedule[day.name]);
  const freeCount=vals.filter(v=>v==="free").length;
  const bookedCount=vals.filter(v=>v==="booked").length;

  const head=document.createElement("div");
  head.className="day-head";
  head.innerHTML=`
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

  const list=document.createElement("div");
  list.className="slot-list";
  let visible=0;

  hours.forEach(time=>{
    const state=schedule[day.name][time];
    if(filter==="free" && state!=="free") return;
    visible++;

    const slot=document.createElement("div");
    slot.className=`slot ${state}`;
    slot.innerHTML=`<span class="time">${time}</span><span class="state">${label(state)}</span>`;
    list.appendChild(slot);
  });

  if(!visible){
    const empty=document.createElement("div");
    empty.className="empty";
    empty.textContent="На цей день вільних віконець немає.";
    list.appendChild(empty);
  }

  card.append(head,list);
  return card;
}

function render(){
  grid.innerHTML="";
  days.forEach(day=>grid.appendChild(renderDay(day)));
  allBtn.classList.toggle("active",filter==="all");
  freeBtn.classList.toggle("active",filter==="free");
}

allBtn.addEventListener("click",()=>{filter="all";render();});
freeBtn.addEventListener("click",()=>{filter="free";render();});
render();
