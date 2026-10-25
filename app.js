const vocab = {
  colors: [
    {en:"Red",it:"Rosso",emoji:"🔴",sound:"red"},{en:"Blue",it:"Blu",emoji:"🔵",sound:"blue"},
    {en:"Yellow",it:"Giallo",emoji:"🟡",sound:"yellow"},{en:"Green",it:"Verde",emoji:"🟢",sound:"green"},
    {en:"Pink",it:"Rosa",emoji:"🩷",sound:"pink"},{en:"Purple",it:"Viola",emoji:"🟣",sound:"purple"},
    {en:"Orange",it:"Arancione",emoji:"🟠",sound:"orange"},{en:"Brown",it:"Marrone",emoji:"🟤",sound:"brown"},
    {en:"Black",it:"Nero",emoji:"⚫",sound:"black"},{en:"White",it:"Bianco",emoji:"⚪",sound:"white"}
  ],
  animals: [
    {en:"Cat",it:"Gatto",emoji:"🐱"},{en:"Dog",it:"Cane",emoji:"🐶"},{en:"Rabbit",it:"Coniglio",emoji:"🐰"},
    {en:"Lion",it:"Leone",emoji:"🦁"},{en:"Elephant",it:"Elefante",emoji:"🐘"},{en:"Monkey",it:"Scimmia",emoji:"🐵"},
    {en:"Fish",it:"Pesce",emoji:"🐠"},{en:"Bird",it:"Uccello",emoji:"🐦"},{en:"Turtle",it:"Tartaruga",emoji:"🐢"},
    {en:"Butterfly",it:"Farfalla",emoji:"🦋"},
    { en: "Horse",it: "Cavallo",image: "images/cavallo.jpg" }
  ],
  numbers: [
    {en:"One",it:"Uno",emoji:"☝️"},{en:"Two",it:"Due",emoji:"✌️"},{en:"Three",it:"Tre",emoji:"🤟"},
    {en:"Four",it:"Quattro",emoji:"🍀"},{en:"Five",it:"Cinque",emoji:"🖐️"},{en:"Six",it:"Sei",emoji:"🎲"},
    {en:"Seven",it:"Sette",emoji:"🌈"},{en:"Eight",it:"Otto",emoji:"🐙"},{en:"Nine",it:"Nove",emoji:"🎈"},
    {en:"Ten",it:"Dieci",emoji:"🔟"}
  ],
  food: [
    {en:"Apple",it:"Mela",emoji:"🍎"},{en:"Banana",it:"Banana",emoji:"🍌"},{en:"Strawberry",it:"Fragola",emoji:"🍓"},
    {en:"Pizza",it:"Pizza",emoji:"🍕"},{en:"Bread",it:"Pane",emoji:"🍞"},{en:"Cheese",it:"Formaggio",emoji:"🧀"},
    {en:"Milk",it:"Latte",emoji:"🥛"},{en:"Ice cream",it:"Gelato",emoji:"🍦"},{en:"Carrot",it:"Carota",emoji:"🥕"},
    {en:"Cake",it:"Torta",emoji:"🍰"}
  ],
  family: [
    {en:"Mum",it:"Mamma",emoji:"👩"},{en:"Dad",it:"Papà",emoji:"👨"},{en:"Sister",it:"Sorella",emoji:"👧"},
    {en:"Brother",it:"Fratello",emoji:"👦"},{en:"Baby",it:"Neonato",emoji:"👶"},{en:"Grandma",it:"Nonna",emoji:"👵"},
    {en:"Grandpa",it:"Nonno",emoji:"👴"},{en:"Family",it:"Famiglia",emoji:"👨‍👩‍👧"},{en:"Parents",it:"Genitori",emoji:"🧑‍🤝‍🧑"},
    {en:"Friend",it:"Amico/a",emoji:"🧒"}
  ]
};
const categoryNames = {colors:"Colori",animals:"Animali",numbers:"Numeri",food:"Cibo",family:"Famiglia"};
const state = {game:"learn",category:"colors",stars:Number(localStorage.getItem("ea-stars")||0),quiz:null,quizCount:0,quizCorrect:0,answered:false,memory:[],memoryOpen:[],memoryMatched:[],memoryMoves:0,listening:null};
const $ = s => document.querySelector(s);
const content = $("#gameContent");
function updateStars(){ $("#totalStars").textContent=state.stars;$("#headerStars").textContent=state.stars;localStorage.setItem("ea-stars",state.stars); }
function say(word){
  if(!("speechSynthesis" in window)){toast("Il tuo browser non supporta la lettura vocale.");return;}
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word); utter.lang="en-GB"; utter.rate=.78; utter.pitch=1.08;
  const voices = speechSynthesis.getVoices(); const voice=voices.find(v=>v.lang==="en-GB")||voices.find(v=>v.lang.startsWith("en"));
  if(voice) utter.voice=voice;
  speechSynthesis.speak(utter);
}
let toastTimer;
function toast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200);}
function shuffled(arr){return [...arr].sort(()=>Math.random()-.5);}
function award(n=1){state.stars+=n;updateStars();toast(n===1?"Bravissima! Hai guadagnato una stella ⭐":`Fantastico! +${n} stelle ⭐`);}
function setGame(game){
  state.game=game;document.querySelectorAll(".game-card").forEach(b=>b.classList.toggle("selected",b.dataset.game===game));
  const titles={learn:["IL TUO VOCABOLARIO","Impara le parole"],quiz:["PICCOLA SFIDA","Indovina!"],memory:["ALLENA LA MEMORIA","Memory magico"],listen:["ORECCHIE DA CAMPIONESSA","Ascolta e trova"]};
  $("#gameEyebrow").textContent=titles[game][0];$("#gameTitle").textContent=titles[game][1];
  $("#categoryTabs").hidden=game==="memory";$("#helpSound").textContent=game==="listen"?"🔊 Ripeti la parola":"🔊 Prova l’audio";
  $("#footerTip").textContent=({learn:"Tocca una carta per ascoltare la parola inglese.",quiz:"Scegli con calma: puoi farcela!",memory:"Ricorda dove hai visto le carte.",listen:"Ascolta bene e trova l’immagine giusta."})[game];
  if(game==="quiz")newQuiz();else if(game==="memory")newMemory();else if(game==="listen")newListening();else renderLearn();
}
function setCategory(cat){state.category=cat;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.category===cat));if(state.game==="learn")renderLearn();else if(state.game==="quiz")newQuiz();else if(state.game==="listen")newListening();}
function renderLearn(){
 content.innerHTML=`<p class="game-intro">Ogni carta ti insegna una nuova parola. Premi l’altoparlante per sentirla in inglese!</p><div class="word-grid">${vocab[state.category].map((w,i)=>`<button class="word-card" data-word="${i}" aria-label="Ascolta ${w.en}"><span class="tiny-speaker">🔊</span><span class="emoji">${w.emoji}</span><span class="english">${w.en}</span><span class="italian">${w.it}</span></button>`).join("")}</div>`;
 content.querySelectorAll(".word-card").forEach(btn=>btn.addEventListener("click",()=>{const w=vocab[state.category][+btn.dataset.word];say(w.en);btn.classList.remove("confetti");void btn.offsetWidth;btn.classList.add("confetti");}));
}
function newQuiz(){
 state.answered=false;const list=vocab[state.category];const target=list[Math.floor(Math.random()*list.length)];const options=shuffled([target,...shuffled(list.filter(w=>w!==target)).slice(0,2)]);state.quiz={target,options};
 content.innerHTML=`<div class="quiz-box"><div class="round-label">DOMANDA ${state.quizCount+1} · CATEGORIA: ${categoryNames[state.category].toUpperCase()}</div><div class="question-emoji">${target.emoji}</div><div class="question-text">Come si dice in inglese?</div><button class="listen-big" id="quizListen" aria-label="Ascolta la parola">🔊</button><div class="answers">${options.map((w,i)=>`<button class="answer-btn" data-answer="${i}">${w.en}</button>`).join("")}</div><div class="feedback" id="feedback" aria-live="polite"></div><button class="next-btn" id="nextQuestion" hidden>Prossima domanda →</button></div>`;
 $("#quizListen").addEventListener("click",()=>say(target.en));
 content.querySelectorAll(".answer-btn").forEach(btn=>btn.addEventListener("click",()=>answerQuiz(+btn.dataset.answer)));
 $("#nextQuestion").addEventListener("click",newQuiz);
}
function answerQuiz(index){
 if(state.answered)return;state.answered=true;state.quizCount++;
 const {target,options}=state.quiz;const correct=options[index]===target;const buttons=[...content.querySelectorAll(".answer-btn")];
 buttons.forEach((b,i)=>{b.disabled=true;if(options[i]===target)b.classList.add("correct");else if(i===index)b.classList.add("wrong");});
 $("#feedback").textContent=correct?"Bravissima! Risposta corretta! 🎉":`Quasi! La risposta giusta è ${target.en}. Riprova! 💜`;
 if(correct){state.quizCorrect++;award(1);say(target.en);}$("#nextQuestion").hidden=false;$("#nextQuestion").textContent=correct?"Un’altra domanda →":"Riproviamo →";
}
function newListening(){
 const list=vocab[state.category];const target=list[Math.floor(Math.random()*list.length)];const options=shuffled([target,...shuffled(list.filter(w=>w!==target)).slice(0,3)]);state.listening={target,options,answered:false};
 content.innerHTML=`<div class="quiz-box"><div class="round-label">MISSIONE DI ASCOLTO</div><div class="question-text">Quale immagine senti?</div><div class="listen-prompt"><button class="listen-big" id="listenWord" aria-label="Ascolta la parola">🔊</button><p>Premi per ascoltare la parola inglese</p></div><div class="answers">${options.map((w,i)=>`<button class="answer-btn image-answer" data-answer="${i}" aria-label="${w.it}"><span style="font-size:31px;display:block">${w.emoji}</span><span style="font-size:12px">${w.it}</span></button>`).join("")}</div><div class="feedback" id="feedback" aria-live="polite"></div><button class="next-btn" id="nextQuestion" hidden>Prossima parola →</button></div>`;
 $("#listenWord").addEventListener("click",()=>say(target.en));
 content.querySelectorAll(".image-answer").forEach(btn=>btn.addEventListener("click",()=>answerListening(+btn.dataset.answer)));
 $("#nextQuestion").addEventListener("click",newListening);
 setTimeout(()=>say(target.en),350);
}
function answerListening(index){
 const s=state.listening;if(s.answered)return;s.answered=true;const correct=s.options[index]===s.target;
 content.querySelectorAll(".image-answer").forEach((b,i)=>{b.disabled=true;if(s.options[i]===s.target)b.classList.add("correct");else if(i===index)b.classList.add("wrong");});
 $("#feedback").textContent=correct?`Sì! ${s.target.en}! Ottimo ascolto! 🎉`:`La parola era ${s.target.en}. Ascolta ancora e riprova!`;
 if(correct){award(1);say(s.target.en);}$("#nextQuestion").hidden=false;
}
function newMemory(){
 const all=Object.values(vocab).flat();const picks=shuffled(all).slice(0,6);const deck=shuffled([...picks.map((w,i)=>({id:i,type:"emoji",value:w.emoji,word:w.en})),...picks.map((w,i)=>({id:i,type:"word",value:w.en,word:w.en}))]);
 state.memory=deck;state.memoryOpen=[];state.memoryMatched=[];state.memoryMoves=0;
 content.innerHTML=`<p class="game-intro" style="text-align:center">Trova le 6 coppie: abbina ogni immagine alla sua parola inglese.</p><div class="memory-stats" id="memoryStats">Coppie trovate: 0 / 6 · Tentativi: 0</div><div class="memory-grid">${deck.map((c,i)=>`<button class="memory-card" data-card="${i}" aria-label="Carta coperta">❔</button>`).join("")}</div><div class="feedback" id="memoryFeedback" style="text-align:center" aria-live="polite"></div>`;
 content.querySelectorAll(".memory-card").forEach(btn=>btn.addEventListener("click",()=>flipMemory(+btn.dataset.card)));
}
function flipMemory(index){
 if(state.memoryOpen.length===2||state.memoryMatched.includes(index)||state.memoryOpen.includes(index))return;
 state.memoryOpen.push(index);drawMemory();
 if(state.memoryOpen.length===2){
  state.memoryMoves++;const [a,b]=state.memoryOpen.map(i=>state.memory[i]);
  if(a.id===b.id&&a.type!==b.type){state.memoryMatched.push(...state.memoryOpen);say(a.word);state.memoryOpen=[];drawMemory();award(1);if(state.memoryMatched.length===12)$("#memoryFeedback").textContent=`Hai trovato tutte le coppie in ${state.memoryMoves} tentativi! Sei una campionessa! 🏆`;}
  else setTimeout(()=>{state.memoryOpen=[];drawMemory();},850);
 }
}
function drawMemory(){
 content.querySelectorAll(".memory-card").forEach((btn,i)=>{const c=state.memory[i],visible=state.memoryOpen.includes(i)||state.memoryMatched.includes(i);btn.classList.toggle("flipped",visible);btn.classList.toggle("matched",state.memoryMatched.includes(i));btn.innerHTML=visible?(c.type==="emoji"?`<span>${c.value}</span>`:`<span class="memory-face">${c.value}</span>`):"❔";btn.setAttribute("aria-label",visible?c.word:"Carta coperta");});
 const stats=$("#memoryStats");if(stats)stats.textContent=`Coppie trovate: ${state.memoryMatched.length/2} / 6 · Tentativi: ${state.memoryMoves}`;
}
document.querySelectorAll(".game-card").forEach(b=>b.addEventListener("click",()=>setGame(b.dataset.game)));
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setCategory(b.dataset.category)));
$("#helpSound").addEventListener("click",()=>{const list=vocab[state.category];say(list[Math.floor(Math.random()*list.length)].en);});
$("#resetGame").addEventListener("click",()=>setGame(state.game));
updateStars();setGame("learn");
