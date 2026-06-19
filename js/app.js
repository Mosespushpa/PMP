(function () {
  'use strict';

  console.log("✅ App Started");

  document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM Ready");

    const grid = document.getElementById("media-grid");

    // ✅ GET SONGS
    const songs = MediaPreloader.getAllMedia();
    console.log("Songs:", songs);

    // ✅ RENDER UI
    renderSongs(grid, songs);
  });

  // =========================
  // ✅ RENDER FUNCTION
  // =========================
  function renderSongs(container, songs) {
    if (!container) return;

    container.innerHTML = "";

    songs.forEach((song, index) => {
      const card = document.createElement("div");
      card.className = "media-card";

      // Poster path
      const poster = song.poster
        ? `${song.folder}${song.poster}`
        : "assets/default.jpg";

      card.innerHTML = `
        <div class="media-poster-container">
          <img src="${poster}" class="media-poster" />
          <button class="play-button" data-index="${index}">▶</button>
        </div>
        <div class="media-metadata">
          <div class="media-title">${song.title}</div>
          <div class="media-artist">${song.artist}</div>
        </div>
      `;

      container.appendChild(card);
    });

    // ✅ CLICK EVENTS
    container.addEventListener("click", function (e) {
      if (e.target.classList.contains("play-button")) {
        const index = e.target.dataset.index;
        playSong(songs[index]);
      }
    });
  }

  // =========================
  // ✅ SIMPLE PLAYER
  // =========================
  function playSong(song) {
    const player = document.getElementById("media-player");

    const src = `${song.folder}${song.filename}`;

    player.src = src;
    player.play();

    console.log("▶ Playing:", song.title);
  }

})();
