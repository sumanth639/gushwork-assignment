// sticky header
function initStickyHeader() {
  const stickyHeader = document.querySelector(".scroll-sticky-header");
  const heroSection = document.querySelector(".product-hero");
  const mainHeader = document.querySelector(".main-header");

  if (!stickyHeader) {
    return;
  }

  let lastScrollY = window.scrollY;
  const directionGap = 4;

  function getTriggerPoint() {
    if (!heroSection) {
      return window.innerHeight;
    }

    let headerHeight = 0;
    if (mainHeader) {
      headerHeight = mainHeader.offsetHeight;
    }

    return heroSection.offsetTop + heroSection.offsetHeight - headerHeight;
  }

  function updateStickyHeader() {
    const currentScrollY = window.scrollY;
    const isPastTrigger = currentScrollY > getTriggerPoint();
    const isMovingDown = currentScrollY > lastScrollY + directionGap;
    const isMovingUp = currentScrollY < lastScrollY - directionGap;

    let shouldShow = stickyHeader.classList.contains("is-visible");

    if (!isPastTrigger || isMovingUp) {
      shouldShow = false;
    } else if (isPastTrigger && isMovingDown) {
      shouldShow = true;
    }

    stickyHeader.classList.toggle("is-visible", shouldShow);
    stickyHeader.setAttribute("aria-hidden", shouldShow ? "false" : "true");

    lastScrollY = currentScrollY;
  }

  window.addEventListener("scroll", updateStickyHeader, { passive: true });
  window.addEventListener("resize", updateStickyHeader);
  updateStickyHeader();
}

// product gallery + zoom
function initHeroCarouselAndZoom() {
  const gallery = document.querySelector(".product-gallery");
  if (!gallery) {
    return;
  }

  const mainWrapper = gallery.querySelector(".main-image-wrapper");
  const mainImage = gallery.querySelector(".main-img");
  const previewImage = gallery.querySelector(".zoom-preview-img");
  const lens = gallery.querySelector(".zoom-lens");
  const prevButton = gallery.querySelector(".gallery-arrow.left");
  const nextButton = gallery.querySelector(".gallery-arrow.right");
  const thumbnails = gallery.querySelectorAll(".thumbnail");

  if (!mainWrapper || !mainImage || thumbnails.length === 0) {
    return;
  }

  const imageSources = [];
  for (let i = 0; i < thumbnails.length; i += 1) {
    const thumb = thumbnails[i];
    const thumbImage = thumb.querySelector("img");
    const source =
      thumb.getAttribute("data-src") ||
      (thumbImage ? thumbImage.getAttribute("src") : "") ||
      "";
    imageSources.push(source);
  }

  let activeIndex = 0;
  for (let i = 0; i < thumbnails.length; i += 1) {
    if (thumbnails[i].classList.contains("active")) {
      activeIndex = i;
      break;
    }
  }

  let zoomPausedByNav = false;
  // used to check if the zoom is enalbed and user is hovering the image
  function isZoomEnabled() {
    return (
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      window.innerWidth > 1080
    );
  }

  function setActiveImage(index) {
    if (imageSources.length === 0) {
      return;
    }

    activeIndex = (index + imageSources.length) % imageSources.length;

    const activeSource = imageSources[activeIndex];
    const activeThumbImg = thumbnails[activeIndex].querySelector("img");

    if (activeSource) {
      mainImage.src = activeSource;
      if (previewImage) {
        previewImage.src = activeSource;
      }
    }

    if (activeThumbImg && activeThumbImg.alt) {
      mainImage.alt = activeThumbImg.alt;
    }

    for (let i = 0; i < thumbnails.length; i += 1) {
      const isActive = i === activeIndex;
      thumbnails[i].classList.toggle("active", isActive);
      thumbnails[i].setAttribute("aria-current", isActive ? "true" : "false");
    }
  }
//  used to show preveiw of the zoomed part
  function showZoom() {
    if (!isZoomEnabled() || zoomPausedByNav) {
      return;
    }

    gallery.classList.add("is-zooming");

    if (previewImage) {
      previewImage.src = mainImage.currentSrc || mainImage.src;
    }
  }

  function hideZoom() {
    gallery.classList.remove("is-zooming");
  }
  // used to updated the curson zoom postion
  function updateLensPosition(event) {
    if (!isZoomEnabled() || !lens || !previewImage || zoomPausedByNav) {
      return;
    }

    if (!gallery.classList.contains("is-zooming")) {
      showZoom();
    }

    const rect = mainWrapper.getBoundingClientRect();
    const lensSize = Math.round(Math.max(88, Math.min(rect.width * 0.22, 130)));
    const halfLens = lensSize / 2;

    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;

    const x = Math.min(Math.max(rawX, halfLens), rect.width - halfLens);
    const y = Math.min(Math.max(rawY, halfLens), rect.height - halfLens);

    lens.style.width = `${lensSize}px`;
    lens.style.height = `${lensSize}px`;
    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    previewImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
  }
  // navigate between images
  function bindNavButton(button, step) {
    if (!button) {
      return;
    }

    button.addEventListener("mouseenter", function () {
      zoomPausedByNav = true;
      hideZoom();
    });

    button.addEventListener("mouseleave", function () {
      zoomPausedByNav = false;
    });

    button.addEventListener("click", function () {
      hideZoom();
      setActiveImage(activeIndex + step);
    });
  }

  for (let i = 0; i < thumbnails.length; i += 1) {
    const thumb = thumbnails[i];

    thumb.addEventListener("click", function () {
      setActiveImage(i);
    });

    thumb.addEventListener("mouseenter", function () {
      if (isZoomEnabled()) {
        setActiveImage(i);
      }
    });
  }

  bindNavButton(prevButton, -1);
  bindNavButton(nextButton, 1);

  mainWrapper.addEventListener("mouseenter", showZoom);
  mainWrapper.addEventListener("mouseleave", hideZoom);
  mainWrapper.addEventListener("mousemove", updateLensPosition);

  window.addEventListener("resize", function () {
    if (!isZoomEnabled()) {
      hideZoom();
    }
  });

  setActiveImage(activeIndex);
}

// modal open / close
function initModal(modalId, openSelector, closeSelector, formSelector, focusSelector) {
  const modal = document.getElementById(modalId);
  const openButtons = document.querySelectorAll(openSelector);

  if (!modal || openButtons.length === 0) {
    return;
  }

  const closeButtons = modal.querySelectorAll(closeSelector);
  const modalForm = formSelector ? modal.querySelector(formSelector) : null;
  const focusField = focusSelector ? modal.querySelector(focusSelector) : null;
  let lastFocusedElement = null;

  function openModal(event) {
    if (event) {
      event.preventDefault();
    }

    lastFocusedElement = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");

    if (focusField) {
      focusField.focus();
    }
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  for (let i = 0; i < openButtons.length; i += 1) {
    openButtons[i].addEventListener("click", openModal);
  }

  for (let i = 0; i < closeButtons.length; i += 1) {
    closeButtons[i].addEventListener("click", closeModal);
  }

  modal.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  if (modalForm) {
    modalForm.addEventListener("submit", function (event) {
      event.preventDefault();
      closeModal();
    });
  }
}
// used to intialize the compoents
function boot() {
  initStickyHeader();
  initHeroCarouselAndZoom();

  initModal(
    "datasheet-modal",
    ".js-open-datasheet-modal",
    "[data-modal-close]",
    ".datasheet-modal-form",
    "#datasheet-email",
  );

  initModal(
    "quote-modal",
    ".js-open-quote-modal",
    "[data-quote-modal-close]",
    ".quote-modal-form",
    "input",
  );
}
// loads the script after the dom is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
