(function () {
  function decodeResumeParam() {
    try {
      var url = new URL(window.location.href);
      var resume = url.searchParams.get("resume");
      if (!resume) return null;

      var json = decodeURIComponent(escape(atob(decodeURIComponent(resume))));
      return JSON.parse(json);
    } catch (e) {
      console.warn("Impossible de décoder resume param", e);
      return null;
    }
  }

  function writeStorageObject(storage, data) {
    if (!storage || !data || typeof data !== "object") return;

    Object.keys(data).forEach(function (key) {
      try {
        var value = data[key];

        if (value === undefined || value === null) {
          return;
        }

        if (typeof value === "string") {
          storage.setItem(key, value);
        } else {
          storage.setItem(key, JSON.stringify(value));
        }
      } catch (e) {
        console.warn("Erreur écriture storage pour la clé", key, e);
      }
    });
  }

  function preloadResumeState() {
    var payload = decodeResumeParam();
    if (!payload || !payload.state) return;

    var state = payload.state || {};
    var offlineState = state.offlineState || {};
    var bookmark = payload.bookmark || state.hash || state.location || "";

    window.__ADAPT_RESUME_PAYLOAD__ = payload;

    try {
      writeStorageObject(window.localStorage, offlineState);
    } catch (e) {
      console.warn("Erreur preload localStorage", e);
    }

    try {
      writeStorageObject(window.sessionStorage, offlineState);
    } catch (e) {
      console.warn("Erreur preload sessionStorage", e);
    }

    if (bookmark) {
      try {
        window.location.hash = bookmark;
      } catch (e) {
        console.warn("Erreur restauration hash", e);
      }
    }
  }

  preloadResumeState();
})();