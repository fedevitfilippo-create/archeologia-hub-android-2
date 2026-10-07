(function () {
  "use strict";

  const KEY = "archeologia_hub_study_v2";

  const DEFAULT = {
    favorites: [],
    notes: [],
    studyMinutes: 0,
    quizBest: 0,
    quizLast: 0,
    sessions: 0
  };

  const QUIZ = [
    {q:"Quale ordine architettonico presenta il capitello con volute?",o:["Dorico","Ionico","Tuscanico","Composito"],a:1},
    {q:"Quale edificio romano era destinato principalmente agli spettacoli gladiatori?",o:["Basilica","Anfiteatro","Curia","Terme"],a:1},
    {q:"Che cosa indica il termine 'stratigrafia' in archeologia?",o:["Lo studio delle monete","Lo studio della sequenza degli strati","La catalogazione delle statue","La ricostruzione 3D"],a:1},
    {q:"Quale materiale è particolarmente caratteristico dell'architettura romana?",o:["Calcestruzzo","Porcellana","Acciaio","Ardesia industriale"],a:0},
    {q:"Il Partenone si trova ad Atene e appartiene principalmente a quale ordine?",o:["Dorico","Ionico","Corinzio","Composito"],a:0},
    {q:"Che cos'è un'epigrafe?",o:["Un'iscrizione","Un vaso","Una tecnica muraria","Un tipo di mosaico"],a:0},
    {q:"La domus romana era:",o:["Una casa unifamiliare","Un mercato","Una caserma","Un tempio"],a:0},
    {q:"Quale civiltà è associata alle grandi tombe dipinte di Tarquinia?",o:["Etrusca","Fenicia","Minoica","Punica"],a:0},
    {q:"Il foro romano era principalmente:",o:["Un'area pubblica e politica","Un porto","Una necropoli","Una cava"],a:0},
    {q:"In archeologia, una 'US' indica normalmente:",o:["Un'Unità Stratigrafica","Un'Unità Statistica","Un'Urna Sacra","Un'Uscita di Scavo"],a:0},
    {q:"Il mosaico è generalmente realizzato mediante:",o:["Tessere","Mattoni refrattari","Lastre di acciaio","Solo affresco"],a:0},
    {q:"Il termine 'provenienza' di un reperto indica soprattutto:",o:["Il suo contesto di rinvenimento","Il suo prezzo","Il peso","Il colore"],a:0}
  ];

  const FLASHCARDS = [
    ["Stratigrafia","Studio della successione e dei rapporti tra gli strati archeologici."],
    ["US","Unità Stratigrafica: l'unità minima di osservazione e documentazione della sequenza stratigrafica."],
    ["Domus","Abitazione urbana romana organizzata attorno a spazi come atrio e peristilio."],
    ["Insula","Edificio abitativo plurifamiliare tipico della città romana."],
    ["Foro","Spazio pubblico centrale della città romana, con funzioni politiche, religiose e commerciali."],
    ["Epigrafe","Iscrizione incisa o applicata su un supporto materiale."],
    ["Anfiteatro","Edificio per spettacoli con arena centrale e cavea sviluppata attorno ad essa."],
    ["Opus caementicium","Calcestruzzo romano impiegato ampiamente nelle costruzioni."],
    ["Necropoli","Area destinata alle sepolture."],
    ["Tessera","Piccolo elemento utilizzato per comporre un mosaico."]
  ];

  let state = load();
  let timer = null;
  let timerSeconds = 25 * 60;
  let quizIndex = 0;
  let quizScore = 0;
  let flashIndex = 0;
  let flashFlipped = false;

  function load() {
    try {
      return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (_) {
      return Object.assign({}, DEFAULT);
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function fmt(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2,"0");
    const s = (sec % 60).toString().padStart(2,"0");
    return m + ":" + s;
  }

  function root() {
    return document.getElementById("ah-study-root");
  }

  function panel() {
    const r = root();
    return r ? r.querySelector(".ah-study-panel") : null;
  }

  function showPanel(title, body) {
    const p = panel();
    if (!p) return;

    p.innerHTML =
      '<div class="ah-study-head"><div><span class="ah-study-kicker">ARCHEOLOGIA HUB</span><h2>' +
      esc(title) +
      '</h2></div><button class="ah-study-close" data-action="close">×</button></div>' +
      '<div class="ah-study-body">' + body + '</div>';

    p.classList.add("is-open");
  }

  function closePanel() {
    const p = panel();
    if (p) p.classList.remove("is-open");
  }

  function dashboard() {
    showPanel("Centro Studio",
      '<div class="ah-study-grid">' +
      card("⭐","Preferiti",state.favorites.length,"favorites") +
      card("📝","Appunti",state.notes.length,"notes") +
      card("⏱️","Minuti studiati",state.studyMinutes,"timer") +
      card("🧠","Miglior quiz",state.quizBest + "%","quiz") +
      '</div>' +
      '<div class="ah-study-actions">' +
      action("🔎","Ricerca nell'app","search") +
      action("⭐","Preferiti","favorites") +
      action("📝","I miei appunti","notes") +
      action("🧠","Quiz","quiz") +
      action("🃏","Flashcard","flashcards") +
      action("🎓","Modalità esame","exam") +
      action("⏱️","Timer 25 min","timer") +
      action("📊","Progressi","progress") +
      '</div>' +
      '<div class="ah-study-tip">I dati di studio vengono salvati localmente sul dispositivo.</div>'
    );
  }

  function card(icon,title,value,actionName) {
    return '<button class="ah-study-stat" data-action="' + actionName + '">' +
      '<span class="ah-study-stat-icon">' + icon + '</span>' +
      '<span class="ah-study-stat-title">' + esc(title) + '</span>' +
      '<strong>' + esc(value) + '</strong></button>';
  }

  function action(icon,title,name) {
    return '<button class="ah-study-action" data-action="' + name + '">' +
      '<span>' + icon + '</span><b>' + esc(title) + '</b><i>›</i></button>';
  }

  function favorites() {
    let list = state.favorites.length
      ? state.favorites.map((x,i) =>
          '<div class="ah-study-list-item"><span>⭐ ' + esc(x) +
          '</span><button data-remove-favorite="' + i + '">Rimuovi</button></div>').join("")
      : '<div class="ah-study-empty">Nessun preferito ancora.</div>';

    showPanel("Preferiti",
      '<div class="ah-study-inline-form"><input id="ah-fav-input" placeholder="Nome di un sito, monumento o argomento"><button data-action="add-favorite">Aggiungi</button></div>' +
      '<div class="ah-study-list">' + list + '</div>'
    );
  }

  function notes() {
    let list = state.notes.length
      ? state.notes.slice().reverse().map((n,i) =>
          '<article class="ah-study-note"><div>' + esc(n.text) +
          '</div><small>' + new Date(n.date).toLocaleString("it-IT") + '</small></article>').join("")
      : '<div class="ah-study-empty">Nessun appunto salvato.</div>';

    showPanel("I miei appunti",
      '<textarea id="ah-note-input" class="ah-study-textarea" placeholder="Scrivi un appunto di archeologia..."></textarea>' +
      '<button class="ah-study-primary" data-action="add-note">Salva appunto</button>' +
      '<div class="ah-study-list">' + list + '</div>'
    );
  }

  function timerView() {
    showPanel("Timer di studio",
      '<div class="ah-study-timer">' + fmt(timerSeconds) + '</div>' +
      '<p class="ah-study-center">Sessione da 25 minuti. Al termine vengono registrati 25 minuti di studio.</p>' +
      '<div class="ah-study-actions two">' +
      '<button class="ah-study-primary" data-action="timer-start">▶ Avvia</button>' +
      '<button class="ah-study-secondary" data-action="timer-reset">↺ Reset</button>' +
      '</div>'
    );
  }

  function updateTimer() {
    const el = document.querySelector("#ah-study-root .ah-study-timer");
    if (el) el.textContent = fmt(timerSeconds);
  }

  function startTimer() {
    if (timer) return;

    timer = setInterval(function() {
      timerSeconds--;
      updateTimer();

      if (timerSeconds <= 0) {
        clearInterval(timer);
        timer = null;
        timerSeconds = 25 * 60;

        state.studyMinutes += 25;
        state.sessions += 1;

        save();

        alert("Sessione completata. Hai studiato 25 minuti.");
        timerView();
      }
    },1000);
  }

  function resetTimer() {
    if (timer) clearInterval(timer);

    timer = null;
    timerSeconds = 25 * 60;

    updateTimer();
  }

  function quiz() {
    const item = QUIZ[quizIndex % QUIZ.length];

    showPanel("Quiz di archeologia",
      '<div class="ah-study-progress">Domanda ' +
      (quizIndex + 1) +
      " · Punteggio " +
      quizScore +
      '</div>' +
      '<div class="ah-study-question">' +
      esc(item.q) +
      '</div>' +
      '<div class="ah-study-options">' +
      item.o.map((x,i) =>
        '<button data-answer="' + i + '">' +
        esc(x) +
        '</button>'
      ).join("") +
      '</div>'
    );
  }

  function answerQuiz(i) {
    const item = QUIZ[quizIndex % QUIZ.length];
    const correct = Number(i) === item.a;

    if (correct) quizScore++;

    quizIndex++;

    if (quizIndex % 5 === 0) {
      const pct = Math.round((quizScore / 5) * 100);

      state.quizLast = pct;

      if (pct > state.quizBest) {
        state.quizBest = pct;
      }

      save();

      showPanel("Risultato sessione",
        '<div class="ah-study-result"><strong>' +
        pct +
        '%</strong><span>' +
        (
          pct >= 80
            ? "Ottimo lavoro."
            : pct >= 60
              ? "Buona base, continua a ripassare."
              : "Ripassa gli argomenti e riprova."
        ) +
        '</span></div>' +
        '<button class="ah-study-primary" data-action="quiz-reset">Nuovo quiz</button>'
      );
    } else {
      quiz();

      if (!correct) {
        setTimeout(function() {
          alert(
            "Risposta non corretta. La risposta era: " +
            item.o[item.a]
          );
        },50);
      }
    }
  }

  function resetQuiz() {
    quizIndex = 0;
    quizScore = 0;
    quiz();
  }

  function flashcards() {
    const f = FLASHCARDS[flashIndex % FLASHCARDS.length];

    showPanel("Flashcard",
      '<div class="ah-study-flash" data-action="flip-card">' +
      '<span class="ah-study-flash-label">' +
      (flashFlipped ? "RISPOSTA" : "TERMINE") +
      '</span>' +
      '<strong>' +
      esc(flashFlipped ? f[1] : f[0]) +
      '</strong>' +
      '<small>Tocca la scheda per girarla</small></div>' +
      '<div class="ah-study-actions two">' +
      '<button class="ah-study-secondary" data-action="flash-prev">‹ Precedente</button>' +
      '<button class="ah-study-primary" data-action="flash-next">Successiva ›</button>' +
      '</div>'
    );
  }
