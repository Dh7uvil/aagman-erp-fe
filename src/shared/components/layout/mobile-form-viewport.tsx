"use client";

import { useEffect } from "react";

const MOBILE_MQ = "(max-width: 767px)";
const FIELD_SELECTOR = "input:not([type='hidden']), textarea, select";
const SCROLL_PARENT_SELECTOR = [
  "#main-content",
  "[data-slot='dialog-content']",
  "[data-slot='sheet-content']",
  "[data-slot='alert-dialog-content']",
  "[data-vv-scroll]",
].join(",");
const VIEWPORT_GAP_PX = 12;

const APP_VV_TOP = "--app-vv-top";
const APP_VV_HEIGHT = "--app-vv-height";
const APP_VV_BOTTOM = "--app-vv-bottom";

function clearViewportVars() {
  const root = document.documentElement;
  root.style.removeProperty(APP_VV_TOP);
  root.style.removeProperty(APP_VV_HEIGHT);
  root.style.removeProperty(APP_VV_BOTTOM);
}

function isEditableField(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement && target.matches(FIELD_SELECTOR);
}

function canScroll(node: HTMLElement): boolean {
  const overflowY = getComputedStyle(node).overflowY;
  const scrollable = overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
  return scrollable && node.scrollHeight > node.clientHeight + 1;
}

/** Nearest scroller that can actually move, otherwise the marked app scroller. */
function scrollParent(field: HTMLElement): HTMLElement | null {
  let node = field.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    if (canScroll(node)) {
      return node;
    }
    node = node.parentElement;
  }

  const marked = field.closest(SCROLL_PARENT_SELECTOR);
  return marked instanceof HTMLElement ? marked : null;
}

/** Scroll only by the amount still covered by the keyboard or the sticky header. */
function revealFocusedField(field: HTMLElement) {
  const scroller = scrollParent(field);
  if (!scroller) {
    return;
  }

  const viewport = window.visualViewport;
  const visibleHeight = viewport?.height ?? window.innerHeight;
  const scrollerRect = scroller.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();
  const visibleTop = Math.max(scrollerRect.top, 0) + VIEWPORT_GAP_PX;
  const visibleBottom = Math.min(scrollerRect.bottom, visibleHeight) - VIEWPORT_GAP_PX;

  const overflowBelow = fieldRect.bottom - visibleBottom;
  if (overflowBelow > 1) {
    scroller.scrollBy({ top: overflowBelow, behavior: "auto" });
    return;
  }

  const overflowAbove = visibleTop - fieldRect.top;
  if (overflowAbove > 1) {
    scroller.scrollBy({ top: -overflowAbove, behavior: "auto" });
  }
}

/**
 * Keeps the app inside the visible viewport while the software keyboard is open.
 * iOS pans the layout viewport on focus inside a nested scroller, which hides the
 * header and leaves the page background in a grey band above the keyboard.
 */
export function MobileFormViewportManager() {
  useEffect(() => {
    const media = window.matchMedia(MOBILE_MQ);
    const viewport = window.visualViewport;
    let frame = 0;
    /** Some browsers already pin `position: fixed` to the visual viewport. */
    let fixedPinsToVisualViewport = false;

    function apply() {
      if (!media.matches || !viewport) {
        clearViewportVars();
        return;
      }

      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }

      const offset = Math.max(0, Math.round(viewport.offsetTop));
      const height = Math.round(viewport.height);
      const bottomGap = Math.max(
        0,
        Math.round(window.innerHeight - viewport.offsetTop - viewport.height),
      );
      const root = document.documentElement;
      root.style.setProperty(APP_VV_HEIGHT, `${height}px`);
      root.style.setProperty(APP_VV_BOTTOM, `${bottomGap}px`);

      const shell = document.querySelector("[data-app-shell]");
      root.style.setProperty(APP_VV_TOP, `${fixedPinsToVisualViewport ? 0 : offset}px`);

      if (shell instanceof HTMLElement && offset > 0) {
        const shellTop = shell.getBoundingClientRect().top;
        if (!fixedPinsToVisualViewport && shellTop > 1) {
          fixedPinsToVisualViewport = true;
          root.style.setProperty(APP_VV_TOP, "0px");
        } else if (fixedPinsToVisualViewport && shellTop < -1) {
          fixedPinsToVisualViewport = false;
          root.style.setProperty(APP_VV_TOP, `${offset}px`);
        }
      }

      const active = document.activeElement;
      if (isEditableField(active)) {
        revealFocusedField(active);
      }
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    }

    function onFocusIn(event: FocusEvent) {
      if (!media.matches || !isEditableField(event.target)) {
        return;
      }
      schedule();
    }

    media.addEventListener("change", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", onFocusIn);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", onFocusIn);
      clearViewportVars();
    };
  }, []);

  return null;
}
