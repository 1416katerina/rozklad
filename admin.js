import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9wbYhGRJUESS-nK4sbPH2CcQUbvuTmyM",
  authDomain: "rozklad-9f809.firebaseapp.com",
  projectId: "rozklad-9f809",
  storageBucket: "rozklad-9f809.firebasestorage.app",
  messagingSenderId: "654912835999",
  appId: "1:654912835999:web:89a3c8c41d45ae4fe42daa"
};

const ADMIN_EMAILS = [
  "1416katerina@gmail.com",
  "fantomkatren@gmail.com"
];

const days = [
  {name:"Понеділок",emoji:"🌿"},
  {name:"Вівторок",emoji:"☀️"},
  {name:"Середа",emoji:"⭐"},
  {name:"Четвер",emoji:"📘"},
  {name:"П'ятниця",emoji:"🎯"},
  {name:"Субота",emoji:"☕"},
  {name:"Неділя",emoji:"🌙"}
];

const hours=[];
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

function nextState(state){
  if(state==="free") return "booked";
  if(state==="booked") return "unavailable";
  return "free";
}

const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
const auth=getAuth(app);

const loginPanel=document.getElementById("loginPanel");
const adminPanel=document.getElementById("adminPanel");
const emailInput=document.getElementById("emailInput");
const passwordInput=document.getElementById("passwordInput");
const loginBtn=document.getElementById("loginBtn");
const loginMessage=document.getElementById("loginMessage");
const adminUser=document.getElementById("adminUser");
const logoutBtn=document.getElementById("logoutBtn");
const resetBtn=document.getElementById("resetBtn");
const grid=document.getElementById("adminDaysGrid");
const saveMessage=document.getElementById("saveMessage");

let schedule=createDefaultSchedule();
let unsubscribeSchedule=null;

function isAdmin(email){
  return ADMIN_EMAILS.includes((email||"").toLowerCase());
}

function authMessage(error){
  const c=error?.code||"";
  if(c.includes("invalid-credential")) return "Неправильний email або пароль.";
  if(c.includes("user-not-found")) return "Користувача не знайдено.";
  if(c.includes("wrong-password")) return "Неправильний пароль.";
  if(c.includes("too-many-requests")) return "Забагато спроб входу. Спробуйте пізніше.";
  if(c.includes("operation-not-allowed")) return "У Firebase не увімкнено Email/Password.";
  if(c.includes("network-request-failed")) return "Помилка мережі.";
  if(c.includes("api-key-not-valid")) return "Firebase не прийняв API key.";
  return `Помилка входу: ${c || "невідома"}`;
}

async function saveSchedule(){
  saveMessage.textContent="Зберігаю...";
  await setDoc(doc(db,"schedule","current"),{
    days:schedule,
    updatedAt:serverTimestamp()
  },{merge:true});
  saveMessage.textContent="✓ Збережено. Учні вже бачать оновлення.";
}

function renderDay(day){
  const card=document.createElement("section");
  card.className="day-card";

  const vals=Object.values(schedule[day.name]||{});
  const freeCount=vals.filter(v=>v==="free").length;
  const bookedCount=vals.filter(v=>v==="booked").length;

  const head=document.createElement("div");
  head.className="day-head";
  head.innerHTML=`
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

  const list=document.createElement("div");
  list.className="slot-list";

  hours.forEach(time=>{
    const state=schedule[day.name]?.[time]||"unavailable";
    const slot=document.createElement("button");
    slot.type="button";
    slot.className=`slot admin-slot ${state}`;
    slot.innerHTML=`<span class="time">${time}</span><span class="state">${stateLabel(state)}</span>`;

    slot.addEventListener("click",async()=>{
      schedule[day.name][time]=nextState(schedule[day.name][time]);
      render();
      try{
        await saveSchedule();
      }catch(error){
        console.error(error);
        saveMessage.textContent="Помилка збереження: "+(error.code||error.message||"невідома");
      }
    });

    list.appendChild(slot);
  });

  card.append(head,list);
  return card;
}

function render(){
  grid.innerHTML="";
  days.forEach(day=>grid.appendChild(renderDay(day)));
}

loginBtn.addEventListener("click",async()=>{
  loginMessage.textContent="";
  try{
    const email=emailInput.value.trim().toLowerCase();
    if(!isAdmin(email)){
      loginMessage.textContent="Ця пошта не має доступу адміністратора.";
      return;
    }
    await signInWithEmailAndPassword(auth,email,passwordInput.value);
  }catch(error){
    console.error(error);
    loginMessage.textContent=authMessage(error);
  }
});

passwordInput.addEventListener("keydown",e=>{
  if(e.key==="Enter") loginBtn.click();
});

logoutBtn.addEventListener("click",()=>signOut(auth));

resetBtn.addEventListener("click",async()=>{
  if(!confirm("Скинути весь розклад до початкового стану?")) return;
  schedule=createDefaultSchedule();
  render();
  try{
    await saveSchedule();
  }catch(error){
    saveMessage.textContent="Помилка збереження: "+(error.code||error.message||"невідома");
  }
});

onAuthStateChanged(auth,user=>{
  if(user && isAdmin(user.email)){
    loginPanel.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    adminUser.textContent=`Ви увійшли як ${user.email}`;

    if(unsubscribeSchedule) unsubscribeSchedule();
    unsubscribeSchedule=onSnapshot(doc(db,"schedule","current"),async snapshot=>{
      if(snapshot.exists() && snapshot.data().days){
        schedule=snapshot.data().days;
      }else{
        schedule=createDefaultSchedule();
        try{await saveSchedule();}catch(e){
          console.error(e);
          saveMessage.textContent="Не вдалося створити початковий розклад.";
        }
      }
      render();
    },error=>{
      console.error(error);
      saveMessage.textContent="Помилка читання Firestore: "+(error.code||error.message||"невідома");
    });
  }else{
    loginPanel.classList.remove("hidden");
    adminPanel.classList.add("hidden");

    if(user && !isAdmin(user.email)){
      loginMessage.textContent="Цей акаунт не має доступу адміністратора.";
      signOut(auth);
    }

    if(unsubscribeSchedule){
      unsubscribeSchedule();
      unsubscribeSchedule=null;
    }
  }
});
