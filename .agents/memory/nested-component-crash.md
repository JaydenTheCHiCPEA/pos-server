---
name: Nested component in render causes crash
description: Defining a React component function inside another component body causes "Invalid hook call" crashes.
---

## Rule
Never define a React component function inside another component's render body (even if it uses no hooks itself). Always extract it to module-level.

**Why:** React uses the function reference identity to track hook state per component instance. When defined inside a render function, a new function reference is created on every render, so React sees a new component type and resets its hook slots — triggering "Invalid hook call" in descendant navigators or the component itself.

**How to apply:** If a sub-component needs access to outer state/styles, pass them as props rather than closing over them. For the DL Wright POS dashboard, `ChartSection`, `PayRow`, and `SummaryRow` were extracted to module level and receive `colors` / `styles` as explicit props.
