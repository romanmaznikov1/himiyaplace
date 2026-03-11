// Mobile menu
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const navLinks = document.getElementById("nav-links");

if (mobileMenuToggle && navLinks) {
  const openMenu = () => {
    mobileMenuToggle.classList.add("active");
    navLinks.classList.add("active");
    mobileMenuToggle.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    mobileMenuToggle.classList.remove("active");
    navLinks.classList.remove("active");
    mobileMenuToggle.setAttribute("aria-expanded", "false");
  };

  mobileMenuToggle.addEventListener("click", () => {
    navLinks.classList.contains("active") ? closeMenu() : openMenu();
  });

  // Close on link click
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (navLinks.classList.contains("active") &&
        !navLinks.contains(e.target) &&
        !mobileMenuToggle.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("active")) closeMenu();
  });
}

const sliders = document.querySelectorAll(".slider");
const buttons = document.querySelectorAll(".slider-btn");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const dir = Number(btn.dataset.dir || 1);
    const target = document.getElementById(targetId);
    if (!target) return;
    const amount = target.clientWidth * 0.7 * dir;
    target.scrollBy({ left: amount, behavior: "smooth" });
  });
});

sliders.forEach((slider) => {
  slider.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      const scrollLeft = slider.scrollLeft;
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      const delta = event.deltaY * 0.6; // Уменьшаем скорость для плавности
      
      // Только перехватываем событие если слайдер может скроллиться в нужную сторону
      const canScrollLeft = delta < 0 && scrollLeft > 0;
      const canScrollRight = delta > 0 && scrollLeft < maxScroll;
      
      if (canScrollLeft || canScrollRight) {
        event.preventDefault();
        slider.scrollBy({ left: delta, behavior: "smooth" });
      }
    }
  });
});

const infoModal = document.getElementById("info-modal");
const modalName = document.getElementById("modal-name");
const modalStyle = document.getElementById("modal-style");
const modalDesc = document.getElementById("modal-desc");
const modalAvatar = document.getElementById("modal-avatar");
const modalVideo = document.getElementById("modal-video");
const modalVideoLocal = document.getElementById("modal-video-local");
const modalVideoWrap = document.querySelector(".modal-video-wrap");

const trainerCards = document.querySelectorAll(".trainer-card");

const openModal = () => {
  infoModal.classList.add("open");
  infoModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  infoModal.classList.remove("open");
  infoModal.setAttribute("aria-hidden", "true");
  modalVideo.src = "";
  if (modalVideoLocal) {
    modalVideoLocal.pause();
    modalVideoLocal.src = "";
  }
  if (modalVideoWrap) modalVideoWrap.classList.remove("modal-video-wrap--local");
};

const initials = (label) =>
  label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

trainerCards.forEach((card) => {
  card.addEventListener("click", () => {
    const name = card.dataset.name || "Тренер";
    const style = card.dataset.style || "";
    const desc = card.dataset.desc || "Информация скоро появится.";
    const video = card.dataset.video || "";

    modalName.textContent = name;
    modalStyle.textContent = style;
    modalDesc.textContent = desc;
    modalAvatar.textContent = initials(name);

    const isLocalVideo = video && (video.endsWith(".mp4") || video.startsWith("videos/"));
    if (isLocalVideo && modalVideoLocal && modalVideoWrap) {
      modalVideo.src = "";
      modalVideoWrap.classList.add("modal-video-wrap--local");
      modalVideoLocal.src = video;
      modalVideoLocal.play().catch(() => {});
    } else {
      modalVideoWrap.classList.remove("modal-video-wrap--local");
      modalVideoLocal.src = "";
      modalVideo.src = video;
    }
    openModal();
  });
});


const closeButton = document.querySelector(".modal-close");
if (closeButton) closeButton.addEventListener("click", closeModal);

if (infoModal) {
  infoModal.addEventListener("click", (event) => {
    if (event.target === infoModal) closeModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && infoModal.classList.contains("open")) closeModal();
});

const revealItems = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 28, 180)}ms`;
  revealObserver.observe(item);
});

// Image fallback: show initials when image fails to load
document.querySelectorAll('.trainer-photo img.trainer-image').forEach((img) => {
  img.addEventListener('error', () => {
    const photo = img.closest('.trainer-photo');
    if (!photo) return;
    // hide broken img
    img.style.display = 'none';
    // if fallback already exists, do nothing
    if (photo.querySelector('.trainer-fallback')) return;
    const card = img.closest('.trainer-card');
    const name = (card && card.dataset.name) ? card.dataset.name : '';
    const div = document.createElement('div');
    div.className = 'trainer-fallback';
    div.textContent = initials(name || '');
    div.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;background:linear-gradient(135deg, rgba(100,181,246,0.12), rgba(33,150,243,0.08));border-radius:8px;color:var(--text);';
    photo.insertBefore(div, photo.firstChild);
  });
});
