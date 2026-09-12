**PM-1230 (2026-09-13, 06:20): LIGHT MODE — SIDEBAR AND TOP BAR STAY BRAND-DARK. CC `a27d71d0` (coach-portal.html md5 `2649f571`, physio-portal.html `afff9c8c`).**

Dean, after adding Treadmill Walk to a warm-up from the drawer ("this looks way better"): in light mode the side and top bars should keep the dark VYVE treatment. `shared/head-styles.html`: `html[data-theme="light"] .cp-side, .cp-topbar` get scoped token overrides (`--text`, `--text-muted`, `--surface`, `--surface-2`, `--border`… to the brand-dark palette), backgrounds `#0D2B2B`, active item teal on dark, brand in teal-light. Dark theme byte-identical in effect. Physio portal shares the shell, so it follows. Build/smoke green, three files md5-perfect.

**State of the drawer work at this point (Dean's own pass, 20:29→20:55):** weekly workouts on the day builder (PM-1224), + Add exercises opens the library drawer from the right (PM-1225/1227), no blank row (PM-1226/1228), video on top, minutes, cardio videos wired (PM-1228), blocks as panels (PM-1229), light-mode chrome (PM-1230). **Programmes still not pinned.**

---

