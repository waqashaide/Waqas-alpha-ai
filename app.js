const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const chat=$("#chat"), prompt=$("#prompt");

function addMessage(text, who="ai"){
  const m=document.createElement("div"); m.className="msg "+who;
  const b=document.createElement("div"); b.className="bubble";
  // Lightweight Markdown: **bold** and `code`
  b.innerHTML=text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/`(.*?)`/g,"<code>$1</code>").replace(/\n/g,"<br>");
  m.appendChild(b); chat.appendChild(m); chat.scrollTop=chat.scrollHeight;
}
function send(){
  const t=prompt.value.trim(); if(!t)return;
  document.querySelector(".welcome")?.remove(); addMessage(t,"user"); prompt.value="";
  const typing=document.createElement("div"); typing.className="msg ai"; typing.innerHTML='<div class="typing">Waqas Alpha is thinking…</div>'; chat.appendChild(typing);
  setTimeout(()=>{
    typing.remove();
    const lower=t.toLowerCase();
    let answer;
    if(lower.includes("who is your creator")||lower.includes("who created you")||lower.includes("creator")){
      answer="My creator is **Professor Waqas**.";
    }else{
      answer="I’m **Waqas Alpha**, your personal AI. Connect your AI API in this project to replace this demo response with real-time model responses.";
    }
    addMessage(answer,"ai");
  },420);
}
$("#sendBtn").onclick=send;
prompt.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
prompt.addEventListener("input",()=>{prompt.style.height="auto";prompt.style.height=Math.min(prompt.scrollHeight,130)+"px"});

function openSettings(){ $("#overlay").classList.add("open"); $("#settings").classList.add("open") }
$("#settingsBtn").onclick=openSettings; $("#closeSettings").onclick=()=>{$("#overlay").classList.remove("open");$("#settings").classList.remove("open")}; $("#overlay").onclick=()=>$("#closeSettings").click();

$$("[data-set-theme]").forEach(btn=>btn.onclick=()=>{
  document.body.dataset.theme=btn.dataset.setTheme;
  $$("[data-set-theme]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");
});
$("#micBtn").onclick=()=>$("#micToggle").click();
$("#composerMic").onclick=()=>alert("Microphone input is ready. Connect Web Speech API or your preferred STT provider in app.js.");
$("#callBtn").onclick=()=>$("#callModal").classList.add("open");
$("#startCall").onclick=()=>{$("#closeSettings").click();$("#callModal").classList.add("open")};
$("#endCall").onclick=()=>$("#callModal").classList.remove("open");
$("#callMute").onclick=e=>{e.currentTarget.textContent=e.currentTarget.textContent.includes("Mute")?"🔇 Unmute":"🎙 Mute"};
$("#newChat").onclick=()=>location.reload();

function openImage(){ $("#imageModal").classList.add("open") }
$("#imageNav").onclick=openImage; $("#imageStudio").onclick=()=>{$("#closeSettings").click();openImage()};
$("#closeImage").onclick=()=>$("#imageModal").classList.remove("open");
$("#generateImage").onclick=()=>{
  const p=$("#imagePrompt").value.trim();
  if(!p)return alert("Describe the image first.");
  alert("Image generation UI is connected. Add your image API call inside generateImage() in app.js.");
};
