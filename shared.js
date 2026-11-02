export const firebaseConfig = {
  apiKey: "AIzaSyC9wbyYhGRJUESS-nK4sbPH2CcQUbvuTmyM",
  authDomain: "rozklad-9f809.firebaseapp.com",
  projectId: "rozklad-9f809",
  storageBucket: "rozklad-9f809.firebasestorage.app",
  messagingSenderId: "654912835999",
  appId: "1:654912835999:web:89a3c8c41d45ae4fe42daa"
};

export const days = [
  {name:"Понеділок",emoji:"🌿"},
  {name:"Вівторок",emoji:"☀️"},
  {name:"Середа",emoji:"⭐"},
  {name:"Четвер",emoji:"📘"},
  {name:"П'ятниця",emoji:"🎯"},
  {name:"Субота",emoji:"☕"},
  {name:"Неділя",emoji:"🌙"}
];

export const hours = [];
for(let h=8;h<=21;h++){
  hours.push(`${h}:00`);
  if(h!==21) hours.push(`${h}:30`);
}

export function toMinutes(time){
  const [h,m]=time.split(":").map(Number);
  return h*60+m;
}

export function createDefaultSchedule(){
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

export function stateLabel(state){
  if(state==="free") return "Вільно";
  if(state==="booked") return "Зайнято";
  return "—";
}

export function nextState(state){
  if(state==="free") return "booked";
  if(state==="booked") return "unavailable";
  return "free";
}
