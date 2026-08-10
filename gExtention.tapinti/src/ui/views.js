import { $ } from "./dom.js";

export function show(view) {
  for (const v of ["login", "settings", "main"]) {
    $(`#view-${v}`).classList.toggle("hidden", v !== view);
  }
}

export function setError(id, msg) {
  const el = $(id);
  el.textContent = msg || "";
  el.classList.toggle("hidden", !msg);
}
