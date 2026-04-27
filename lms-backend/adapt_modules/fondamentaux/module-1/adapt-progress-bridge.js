(function () {
  function waitForAdapt(callback, maxAttempts) {
    maxAttempts = maxAttempts || 200;
    var attempts = 0;

    var interval = setInterval(function () {
      attempts += 1;

      if (window.Adapt && window.Adapt.offlineStorage) {
        clearInterval(interval);
        callback(window.Adapt);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.warn("Adapt non détecté pour le progress bridge.");
      }
    }, 300);
  }

  function safeClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      return {};
    }
  }

  function getCurrentHash() {
    try {
      return window.location.hash || "";
    } catch (e) {
      return "";
    }
  }

  function collectAdaptState(Adapt) {
    var offlineState = {};
    var location = "";
    var hash = "";
    var tracking = {};

    try {
      if (Adapt.offlineStorage && typeof Adapt.offlineStorage.get === "function") {
        var raw = Adapt.offlineStorage.get() || {};
        offlineState = safeClone(raw);
      }
    } catch (e) {
      console.warn("Impossible de lire Adapt.offlineStorage.get()", e);
    }

    try {
      location = offlineState._location || offlineState.location || "";
    } catch (e) {
      location = "";
    }

    hash = getCurrentHash();

    try {
      tracking = {
        completionData: offlineState._completionData || null,
        score: offlineState._score || null,
        status: offlineState._status || null,
        isCourseComplete: offlineState._isCourseComplete || null,
        currentTrackingPosition: offlineState._currentTrackingPosition || null,
        latestTrackingId: offlineState._latestTrackingId || null
      };
    } catch (e) {
      tracking = {};
    }

    return {
      bookmark: hash || location || "",
      state: {
        hash: hash,
        location: location,
        offlineState: offlineState,
        tracking: tracking
      }
    };
  }

  function restoreAdaptState(Adapt, payload) {
    if (!payload || typeof payload !== "object") return;

    var state = payload.state || {};
    var offlineState = state.offlineState || {};
    var bookmark = payload.bookmark || state.hash || state.location || "";

    try {
      if (
        Adapt.offlineStorage &&
        typeof Adapt.offlineStorage.set === "function" &&
        offlineState &&
        typeof offlineState === "object"
      ) {
        Object.keys(offlineState).forEach(function (key) {
          try {
            Adapt.offlineStorage.set(key, offlineState[key]);
          } catch (e) {
            console.warn("Impossible de restaurer la clé offlineStorage:", key, e);
          }
        });
      }
    } catch (e) {
      console.warn("Erreur restauration offlineStorage", e);
    }

    if (bookmark) {
      setTimeout(function () {
        try {
          if (window.location.hash !== bookmark) {
            window.location.hash = bookmark;
          }
        } catch (e) {
          console.warn("Impossible de restaurer le bookmark", e);
        }
      }, 500);
    }
  }

  waitForAdapt(function (Adapt) {
    var lastSent = "";
    var restoreApplied = false;

    function emitProgress() {
      var payload = collectAdaptState(Adapt);
      var serialized = JSON.stringify(payload);

      if (serialized === lastSent) return;
      lastSent = serialized;

      window.parent.postMessage(
        {
          type: "ADAPT_PROGRESS",
          bookmark: payload.bookmark,
          state: payload.state
        },
        "*"
      );
    }

    window.addEventListener("message", function (event) {
      var data = event.data;

      if (!data || data.type !== "ADAPT_RESTORE" || restoreApplied) return;

      restoreApplied = true;
      restoreAdaptState(Adapt, data.payload || {});
    });

    window.parent.postMessage({ type: "ADAPT_READY" }, "*");

    setTimeout(emitProgress, 1500);
    setTimeout(emitProgress, 3000);
    setTimeout(emitProgress, 5000);

    if (Adapt && typeof Adapt.on === "function") {
      Adapt.on("router:location", function () {
        setTimeout(emitProgress, 300);
      });

      Adapt.on("pageView:ready", function () {
        setTimeout(emitProgress, 500);
      });

      Adapt.on("componentView:postRender", function () {
        setTimeout(emitProgress, 500);
      });

      Adapt.on("assessment:complete", function () {
        setTimeout(emitProgress, 300);
      });
    }

    window.addEventListener("beforeunload", function () {
      emitProgress();
    });

    setInterval(emitProgress, 5000);
  });
})();