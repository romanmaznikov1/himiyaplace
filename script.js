/* Интерактив лендинга: мобильное меню, слайдер тренеров, модалка, reveal-анимации. */
(() => {
  "use strict";

  const initials = (label) =>
    label
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  /* ---------- Мобильное меню ---------- */
  const initMobileMenu = () => {
    const toggle = document.getElementById("mobile-menu-toggle");
    const links = document.getElementById("nav-links");
    if (!toggle || !links) return;

    const isOpen = () => links.classList.contains("active");

    const setOpen = (open) => {
      toggle.classList.toggle("active", open);
      links.classList.toggle("active", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(!isOpen()));

    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("click", (event) => {
      if (isOpen() && !links.contains(event.target) && !toggle.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) setOpen(false);
    });
  };

  /* ---------- Горизонтальные слайдеры: прокрутка колесом ---------- */
  const initSliders = () => {
    document.querySelectorAll(".slider").forEach((slider) => {
      slider.addEventListener("wheel", (event) => {
        // Вертикальную прокрутку страницы не перехватываем.
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

        const delta = event.deltaY * 0.6; // мягче, чтобы прокрутка не «прыгала»
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        const canScroll =
          (delta < 0 && slider.scrollLeft > 0) ||
          (delta > 0 && slider.scrollLeft < maxScroll);

        // У края отдаём событие странице, иначе прокрутка «залипает».
        if (!canScroll) return;
        event.preventDefault();
        slider.scrollBy({ left: delta, behavior: "smooth" });
      });
    });
  };

  /* ---------- Модалка тренера ---------- */
  const initTrainerModal = () => {
    const modal = document.getElementById("info-modal");
    const cards = document.querySelectorAll(".trainer-card");
    if (!modal || !cards.length) return;

    const nameEl = document.getElementById("modal-name");
    const styleEl = document.getElementById("modal-style");
    const descEl = document.getElementById("modal-desc");
    const avatarEl = document.getElementById("modal-avatar");
    const frame = document.getElementById("modal-video");
    const video = document.getElementById("modal-video-local");
    const videoWrap = modal.querySelector(".modal-video-wrap");
    const closeBtn = modal.querySelector(".modal-close");

    let lastFocused = null;

    const isOpen = () => modal.classList.contains("open");

    const open = (card) => {
      const name = card.dataset.name || "Тренер";

      if (nameEl) nameEl.textContent = name;
      if (styleEl) styleEl.textContent = card.dataset.style || "";
      if (descEl) descEl.textContent = card.dataset.desc || "Информация скоро появится.";
      if (avatarEl) avatarEl.textContent = initials(name);

      const src = card.dataset.video || "";
      const isLocal = src.endsWith(".mp4") || src.startsWith("videos/");
      if (videoWrap) videoWrap.classList.toggle("modal-video-wrap--local", isLocal);
      if (isLocal && video) {
        if (frame) frame.src = "";
        video.src = src;
        video.play().catch(() => {}); // автоплей может быть заблокирован — это нормально
      } else {
        if (video) video.src = "";
        if (frame) frame.src = src;
      }

      lastFocused = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      if (closeBtn) closeBtn.focus();
    };

    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");

      if (frame) frame.src = "";
      if (video) {
        video.pause();
        video.src = "";
      }
      if (videoWrap) videoWrap.classList.remove("modal-video-wrap--local");

      if (lastFocused instanceof HTMLElement) lastFocused.focus();
      lastFocused = null;
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => open(card));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(card);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) close();
    });
  };

  /* ---------- Появление блоков при прокрутке ---------- */
  const initReveal = () => {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );

    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 28, 180)}ms`;
      observer.observe(item);
    });
  };

  /* ---------- Запасные инициалы, если фото тренера не загрузилось ---------- */
  const initPhotoFallback = () => {
    document.querySelectorAll(".trainer-photo img.trainer-image").forEach((img) => {
      img.addEventListener("error", () => {
        const photo = img.closest(".trainer-photo");
        if (!photo || photo.querySelector(".trainer-fallback")) return;

        img.style.display = "none";
        const card = img.closest(".trainer-card");
        const fallback = document.createElement("div");
        fallback.className = "trainer-fallback";
        fallback.textContent = initials((card && card.dataset.name) || "");
        photo.prepend(fallback);
      });
    });
  };

  initMobileMenu();
  initSliders();
  initTrainerModal();
  initReveal();
  initPhotoFallback();
})();
