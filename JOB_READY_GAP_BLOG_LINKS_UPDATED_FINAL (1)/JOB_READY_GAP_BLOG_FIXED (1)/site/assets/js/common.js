/* ============================================================
   Uncodemy tutorial pages — shared JS engine
   Page-specific data (hero scenarios, search library, quiz
   questions) is passed in via UncodemyPage.init(config) from
   each page's own inline <script>.

   NOTE: Every feature block below is wrapped in its own guard /
   try-catch so that ONE missing element or one broken block can
   NEVER stop the rest of the page's JS from running. Earlier this
   file threw on line ~27 (#burger missing) which silently killed
   the hero slider, search, quiz, TOC and PDF button on every page
   that reached this file after that point. That single point of
   failure has been removed.
   ============================================================ */
window.UncodemyPage = (function () {
  "use strict";

  function safe(label, fn) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) {
        console.warn("[UncodemyPage] " + label + " block failed:", err);
      }
    }
  }

  function init(cfg) {
    cfg = cfg || {};

    /* reading progress */
    safe("reading progress", function () {
      var bar = document.getElementById("progress");
      var art = document.querySelector("article.tut");
      if (!bar || !art) return;
      function progress() {
        var top = art.offsetTop,
          h = art.offsetHeight;
        var p = (window.scrollY - top + window.innerHeight * 0.6) / h;
        bar.style.width = Math.max(0, Math.min(1, p)) * 100 + "%";
      }
      window.addEventListener("scroll", progress, { passive: true });
      progress();
    });

    /* mobile nav (legacy in-page burger/nav — only wires up if present) */
    safe("mobile nav toggle", function () {
      var burger = document.getElementById("burger"),
        nav = document.getElementById("nav");
      if (!burger || !nav) return;
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    /* hero auto-slider (page supplies SCENARIOS, stateOrder, renderScene) */
    safe("hero slider", function () {
      if (!(cfg.SCENARIOS && cfg.stateOrder && cfg.renderScene)) return;

      var stateOrder = cfg.stateOrder;
      var currentIndex = 0;
      var autoTimer = null;
      var slicer = document.getElementById("slicer");
      if (!slicer) return;
      var buttons = slicer.querySelectorAll("button");

      function renderScene(scene) {
        var s = cfg.SCENARIOS[scene] || cfg.SCENARIOS[stateOrder[0]];
        cfg.renderScene(s);
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", b.dataset.r === scene ? "true" : "false");
        });
      }

      function advanceScene() {
        currentIndex = (currentIndex + 1) % stateOrder.length;
        renderScene(stateOrder[currentIndex]);
      }

      function startAutoPlay() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(advanceScene, 4000);
      }

      function stopAutoPlay() {
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = null;
        }
      }

      slicer.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        stopAutoPlay();
        var scene = b.dataset.r;
        currentIndex = stateOrder.indexOf(scene);
        if (currentIndex === -1) currentIndex = 0;
        renderScene(scene);
        setTimeout(startAutoPlay, 5500);
      });

      renderScene(stateOrder[0]);
      startAutoPlay();

      var demo = document.querySelector(".demo");
      if (demo) {
        demo.addEventListener("mouseenter", stopAutoPlay);
        demo.addEventListener("mouseleave", startAutoPlay);
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          stopAutoPlay();
        } else {
          startAutoPlay();
        }
      });
    });

    /* search (page supplies LIB, defaultTrack, emptyMsg) */
    safe("search", function () {
      if (!cfg.LIB) return;
      var LIB = cfg.LIB;
      var q = document.getElementById("q"),
        sug = document.getElementById("suggest"),
        track = cfg.defaultTrack || null;
      if (!q || !sug) return;

      function paint(list) {
        if (!list.length) {
          sug.innerHTML =
            '<p class="empty">' + (cfg.emptyMsg || "Nothing matches that yet.") + "</p>";
        } else {
          sug.innerHTML = list
            .slice(0, 6)
            .map(function (x) {
              return (
                '<a href="#" role="option"><span>' +
                x.t +
                '</span><span class="tag">' +
                x.g +
                "</span></a>"
              );
            })
            .join("");
        }
        sug.classList.add("open");
        q.setAttribute("aria-expanded", "true");
      }

      function filter() {
        var v = q.value.trim().toLowerCase();
        var list = LIB.filter(function (x) {
          var inTrack = !track || x.g === track;
          if (!v) return inTrack;
          return (x.t + " " + x.g).toLowerCase().indexOf(v) > -1;
        });
        paint(
          list.length
            ? list
            : LIB.filter(function (x) {
                return (x.t + " " + x.g).toLowerCase().indexOf(v) > -1;
              })
        );
      }
      q.addEventListener("focus", filter);
      q.addEventListener("input", filter);

      var qbtn = document.getElementById("qbtn");
      if (qbtn) {
        qbtn.addEventListener("click", function () {
          q.focus();
          filter();
        });
      }

      document.addEventListener("click", function (e) {
        if (!e.target.closest(".fx-wrap")) {
          sug.classList.remove("open");
          q.setAttribute("aria-expanded", "false");
        }
      });
      sug.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (!a) return;
        e.preventDefault();
        var span = a.querySelector("span");
        q.value = span ? span.textContent : "";
        sug.classList.remove("open");
        q.setAttribute("aria-expanded", "false");
      });
      q.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          sug.classList.remove("open");
          q.setAttribute("aria-expanded", "false");
        }
      });

      var chips = document.getElementById("chips");
      if (chips) {
        chips.addEventListener("click", function (e) {
          var b = e.target.closest(".chip");
          if (!b) return;
          var on = b.getAttribute("aria-pressed") === "true";
          chips.querySelectorAll(".chip").forEach(function (x) {
            x.setAttribute("aria-pressed", "false");
          });
          b.setAttribute("aria-pressed", on ? "false" : "true");
          track = on ? null : b.textContent.trim();
          q.value = "";
          filter();
          q.focus();
        });
      }
    });

    /* code tabs + copy */
    safe("code tabs", function () {
      document.querySelectorAll("[data-code]").forEach(function (box) {
        var tabs = box.querySelectorAll(".code-tabs button"),
          panes = box.querySelectorAll("pre");
        tabs.forEach(function (t) {
          t.addEventListener("click", function () {
            tabs.forEach(function (x) {
              x.setAttribute("aria-selected", "false");
            });
            t.setAttribute("aria-selected", "true");
            panes.forEach(function (p) {
              p.hidden = p.dataset.p !== t.dataset.t;
            });
          });
        });
        var btn = box.querySelector("[data-copy]");
        if (!btn) return;
        btn.addEventListener("click", function () {
          var open = box.querySelector("pre:not([hidden])");
          if (!open) return;
          var txt = open.innerText;
          var done = function () {
            btn.textContent = "Copied";
            btn.classList.add("done");
            setTimeout(function () {
              btn.textContent = "Copy code";
              btn.classList.remove("done");
            }, 1800);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).then(done, function () {
              btn.textContent = "Press Ctrl+C";
            });
          } else {
            var ta = document.createElement("textarea");
            ta.value = txt;
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
              done();
            } catch (err) {
              btn.textContent = "Press Ctrl+C";
            }
            document.body.removeChild(ta);
          }
        });
      });
    });

    /* TOC scrollspy */
    safe("TOC scrollspy", function () {
      var links = Array.prototype.slice.call(document.querySelectorAll("#toc a"));
      if (!links.length) return;
      var targets = links
        .map(function (a) {
          try {
            return document.querySelector(a.getAttribute("href"));
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (!en.isIntersecting) return;
              links.forEach(function (a) {
                a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
              });
            });
          },
          { rootMargin: "-80px 0px -70% 0px" }
        );
        targets.forEach(function (t) {
          io.observe(t);
        });
      }
    });

    /* PDF */
    safe("PDF button", function () {
      var pdfBtn = document.getElementById("pdfBtn");
      if (!pdfBtn) return;
      pdfBtn.addEventListener("click", function () {
        window.print();
      });
    });

    /* quiz (page supplies QUIZ, resultText: {pass, fail}, passScore) */
    safe("quiz", function () {
      if (!cfg.QUIZ) return;
      var QUIZ = cfg.QUIZ;
      var passScore = cfg.passScore != null ? cfg.passScore : Math.ceil(QUIZ.length * 0.8);
      var qsEl = document.getElementById("qs"),
        scoreEl = document.getElementById("score"),
        doneEl = document.getElementById("qdone"),
        score = 0,
        answered = 0;
      if (!qsEl || !scoreEl || !doneEl) return;
      var MARKS = ["A", "B", "C", "D"];

      QUIZ.forEach(function (item, qi) {
        var d = document.createElement("div");
        d.className = "q";
        d.innerHTML =
          '<p class="qt"><span>Q' +
          (qi + 1) +
          "</span>" +
          item.q +
          "</p>" +
          '<div class="opts">' +
          item.o
            .map(function (o, oi) {
              return (
                '<button class="opt" data-o="' +
                oi +
                '"><span class="mk">' +
                MARKS[oi] +
                "</span><span>" +
                o +
                "</span></button>"
              );
            })
            .join("") +
          '</div><div class="explain"></div>';
        qsEl.appendChild(d);

        var optsWrap = d.querySelector(".opts");
        if (!optsWrap) return;
        optsWrap.addEventListener("click", function (e) {
          var b = e.target.closest(".opt");
          if (!b || b.disabled) return;
          var opts = d.querySelectorAll(".opt");
          opts.forEach(function (x) {
            x.disabled = true;
          });
          var picked = +b.dataset.o;
          opts[item.a].classList.add("correct");
          if (picked !== item.a) b.classList.add("wrong");
          else score++;
          answered++;
          scoreEl.textContent = score + " / " + QUIZ.length;
          var ex = d.querySelector(".explain");
          if (ex) {
            ex.textContent = (picked === item.a ? "Correct. " : "Not quite. ") + item.e;
            ex.classList.add("show");
          }
          if (answered === QUIZ.length) {
            doneEl.innerHTML =
              score >= passScore
                ? "<b>" +
                  score +
                  " out of " +
                  QUIZ.length +
                  ".</b> " +
                  ((cfg.resultText && cfg.resultText.pass) || "Well done!")
                : "<b>" +
                  score +
                  " out of " +
                  QUIZ.length +
                  ".</b> " +
                  ((cfg.resultText && cfg.resultText.fail) || "Give it another read and try again.");
            doneEl.classList.add("show");
          }
        });
      });
    });

    /* sync search (header search <-> mobile search) */
    safe("sync search", function () {
      var hdrq = document.getElementById("hdrq");
      var mobileSearchInput = document.getElementById("mobileSearchInput");
      if (hdrq && mobileSearchInput) {
        hdrq.addEventListener("input", function () {
          mobileSearchInput.value = hdrq.value;
        });
        mobileSearchInput.addEventListener("input", function () {
          hdrq.value = mobileSearchInput.value;
        });
      }
    });
  }

  return { init: init };
})();
