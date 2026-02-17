// Mobile menu toggle
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const navLinks = document.getElementById("nav-links");

if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener("click", () => {
    mobileMenuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
    document.body.style.overflow = navLinks.classList.contains("active") ? "hidden" : "";
  });

  // Close menu when clicking on a link
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenuToggle.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  // Close menu when clicking outside
  navLinks.addEventListener("click", (e) => {
    if (e.target === navLinks) {
      mobileMenuToggle.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.style.overflow = "";
    }
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

const trainerCards = document.querySelectorAll(".trainer-card");
const directionCards = document.querySelectorAll(".direction");

const openModal = () => {
  infoModal.classList.add("open");
  infoModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  infoModal.classList.remove("open");
  infoModal.setAttribute("aria-hidden", "true");
  modalVideo.src = "";
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
    modalVideo.src = video;
    openModal();
  });
});

directionCards.forEach((card) => {
  card.addEventListener("click", () => {
    const name = card.dataset.name || card.textContent.trim();
    const desc = card.dataset.desc || "Описание направления скоро появится.";
    const video = card.dataset.video || "";
    
    modalName.textContent = name;
    modalStyle.textContent = "Танцевальное направление";
    modalDesc.textContent = desc;
    modalAvatar.textContent = initials(name);
    modalVideo.src = video;
    openModal();
  });
});

const closeButton = document.querySelector(".modal-close");
closeButton.addEventListener("click", closeModal);

infoModal.addEventListener("click", (event) => {
  if (event.target === infoModal) closeModal();
});

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
