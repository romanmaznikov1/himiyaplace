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
      event.preventDefault();
      slider.scrollBy({ left: event.deltaY, behavior: "smooth" });
    }
  });
});

const infoModal = document.getElementById("info-modal");
const modalName = document.getElementById("modal-name");
const modalStyle = document.getElementById("modal-style");
const modalDesc = document.getElementById("modal-desc");
const modalAvatar = document.getElementById("modal-avatar");
const modalVideo = document.getElementById("modal-video");
const modalTabs = document.querySelectorAll(".modal-tab");

const trainerCards = document.querySelectorAll(".trainer-card");
const directionCards = document.querySelectorAll(".direction");

const firstTrainerCard = trainerCards[0];
const firstDirectionCard = directionCards[0];

const defaults = {
  trainer: {
    name: firstTrainerCard?.dataset.name || "Тренер",
    style: firstTrainerCard?.dataset.style || "Тренер",
    desc: firstTrainerCard?.dataset.desc || "Информация скоро появится.",
    video: firstTrainerCard?.dataset.video || "",
  },
  direction: {
    name: firstDirectionCard?.dataset.name || firstDirectionCard?.textContent?.trim() || "Направление",
    style: "Направление",
    desc: firstDirectionCard?.dataset.desc || "Описание направления скоро появится.",
    video: firstDirectionCard?.dataset.video || "",
  },
};

const state = {
  activeTab: "trainer",
  trainer: { ...defaults.trainer },
  direction: { ...defaults.direction },
};

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

const setActiveTab = (tab) => {
  state.activeTab = tab;
  modalTabs.forEach((item) => {
    const isActive = item.dataset.tab === tab;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });
};

const renderModal = () => {
  const active = state.activeTab;
  const data = state[active];
  modalName.textContent = data.name;
  modalStyle.textContent = active === "trainer" ? data.style : "Направление";
  modalDesc.textContent = data.desc;
  modalAvatar.textContent = initials(data.name);
  modalVideo.src = data.video;
};

trainerCards.forEach((card) => {
  card.addEventListener("click", () => {
    state.trainer = {
      name: card.dataset.name || "Тренер",
      style: card.dataset.style || "Тренер",
      desc: card.dataset.desc || "Информация скоро появится.",
      video: card.dataset.video || "",
    };
    setActiveTab("trainer");
    renderModal();
    openModal();
  });
});

directionCards.forEach((card) => {
  card.addEventListener("click", () => {
    state.direction = {
      name: card.dataset.name || card.textContent.trim(),
      style: "Направление",
      desc: card.dataset.desc || "Описание направления скоро появится.",
      video: card.dataset.video || "",
    };
    setActiveTab("direction");
    renderModal();
    openModal();
  });
});

modalTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.tab);
    renderModal();
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
