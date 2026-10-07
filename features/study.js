(function () {
  "use strict";

  const KEY = "archeologia_hub_study_v1";

  const state = JSON.parse(
    localStorage.getItem(KEY) ||
    '{"favorites":[],"notes":[],"studyMinutes":0,"quizScore":0}'
  );

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  window.ArcheologiaStudy = {
    addFavorite(id) {
      if (!state.favorites.includes(id)) {
        state.favorites.push(id);
        save();
      }
    },

    removeFavorite(id) {
      state.favorites =
        state.favorites.filter(x => x !== id);
      save();
    },

    isFavorite(id) {
      return state.favorites.includes(id);
    },

    addNote(text) {
      if (!text || !text.trim()) return;

      state.notes.push({
        text: text.trim(),
        date: new Date().toISOString()
      });

      save();
    },

    getNotes() {
      return state.notes;
    },

    addStudyMinutes(minutes) {
      state.studyMinutes += Number(minutes) || 0;
      save();
    },

    getProgress() {
      return {
        favorites: state.favorites.length,
        notes: state.notes.length,
        studyMinutes: state.studyMinutes,
        quizScore: state.quizScore
      };
    }
  };

  console.log("Archeologia Hub Study Engine caricato");
})();
