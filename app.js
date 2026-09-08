const $=id=>document.getElementById(id);
const KEY="personal_ai_v1";
let cfg=JSON.parse(localStorage.getItem(KEY)||"{}");
let messages=JSON.parse(localStorage.getItem(KEY+"_chat")||"[]");
let memory=JSON.parse(localStorage.getItem(KEY+"_memory")||"[]");

function save(){localStorage.setItem(KEY,JSON.stringify(cfg));localStorage.setItem(KEY+"_chat",JSON.stringify(messages));localStorage.setItem(KEY+"_memory",JSON.stringify(memory));}
function render(){const c=$("chat");c.innerHTML="";messages.slice(-80).forEach(m=>{const d=document.createElement("div");d.className="msg "+(m.role==="user"?"user":"ai");d.textContent=m.content;c.appendChild(d)});c.scrollTop=c.scrollHeight}
function setStatus(x){$("status").textContent=x}
function add(role,content){messages.push({role,content});save();render()}
function systemPrompt(){
  const mem=memory.length?`\n\nMEMORY (user-approved local notes):\n${memory.map(x=>"- "+x).join("\n")}`:"";
  return `${cfg.personality||"You are a helpful personal AI assistant."}\nAssistant name: ${cfg.name||"Nova"}.${mem}\n\nTOOLS: You may receive tool results in the conversation. If the user asks to remember something, clearly state that it has been saved only when the app actually saves it.`;
}
async function askAI(){
  const key=cfg.apiKey;
  if(!key){add("ai","Open Settings ⚙️ and add your OpenRouter API key first.");return}
  const body={model:"openrouter/free",messages:[{role:"system",content:systemPrompt()},...messages.slice(-20)]};
  setStatus("Thinking…");
  try{
    const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{
      "Content-Type":"application/json","Authorization":"Bearer "+key,
      "HTTP-Referer":location.href,"X-Title":"My Personal AI"
    },body:JSON.stringify(body)});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error?.message||"API request failed");
    add("assistant",data.choices?.[0]?.message?.content||"No response.");
    speak(data.choices?.[0]?.message?.content||"");
  }catch(e){add("assistant","Error: "+e.message)}
  setStatus("Ready");
}
function toolCommand(text){
  const t=text.trim();
  if(/^\/calc\s+/i.test(t)){try{return "Calculator: "+Function('"use strict";return ('+t.replace(/^\/calc\s+/i,"")+')')()}catch{return "Calculator: invalid expression"}}
  if(/^\/time$/i.test(t))return "Local time: "+new Date().toLocaleString();
  if(/^\/remember\s+/i.test(t)){const x=t.replace(/^\/remember\s+/i,"").trim();if(x){memory.push(x);save();return "Saved to local memory: "+x}}
  if(/^\/forget\s+/i.test(t)){const x=t.replace(/^\/forget\s+/i,"").trim();memory=memory.filter(m=>!m.toLowerCase().includes(x.toLowerCase()));save();return "Removed matching memory items."}
  if(/^\/memory$/i.test(t))return memory.length?"Memory:\n"+memory.map((x,i)=>`${i+1}. ${x}`).join("\n"):"Memory is empty.";
  return null;
}
$("sendBtn").onclick=async()=>{const v=$("input").value.trim();if(!v)return;$("input").value="";add("user",v);const tool=toolCommand(v);if(tool){add("assistant",tool);speak(tool);return}await askAI()};
$("input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("sendBtn").click()}});

$("settingsBtn").onclick=()=>{$("apiKey").value=cfg.apiKey||"";$("assistantName").value=cfg.name||"Nova";$("personality").value=cfg.personality||$("personality").value;$("settings").showModal()};
$("saveSettings").onclick=()=>{cfg.apiKey=$("apiKey").value.trim();cfg.name=$("assistantName").value.trim()||"Nova";cfg.personality=$("personality").value.trim();save();$("settings").close();setStatus("Saved")};
$("clearMemory").onclick=()=>{memory=[];save();setStatus("Memory cleared")};
$("closeSettings").onclick=()=>$("settings").close();

let recognition=null;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){recognition=new SR();recognition.lang="en-US";recognition.interimResults=false;recognition.onstart=()=>{$("micBtn").classList.add("active");setStatus("Listening…")};recognition.onend=()=>{$("micBtn").classList.remove("active");setStatus("Ready")};recognition.onresult=e=>{$("input").value=e.results[0][0].transcript;$("sendBtn").click()}}
$("micBtn").onclick=()=>{if(!recognition){alert("Voice input is not supported in this browser. Try Chrome.");return}try{recognition.start()}catch{}};
function speak(text){if(!text||!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";speechSynthesis.speak(u)}
render();
