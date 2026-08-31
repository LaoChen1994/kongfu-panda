---
name: game-development-loop
description: Run the required design, implementation, test, browser playtest, screenshot review, repair, and regression loop for game features in this project. Use whenever implementing, changing, optimizing, or fixing playable game behavior or game UI; do not use for design-only discussion with no implementation.
---

# Game Development Loop

Before changing a playable feature, read `../../../docs/GAME_DESIGN_DOCUMENT.md`, `../../../docs/AGENT_LOOP.md`, and the relevant specialist skill.

## Required loop

1. Define the feature scope, GDD source, observable expectation, acceptance checks, and explicit non-goals.
2. Implement the smallest vertical slice that can prove the expectation.
3. Run the repository's type, build, and focused automated checks. Fix failures before visual QA.
4. Start the game and use the Browser workflow to exercise the real player path.
5. Capture representative screenshots for initial, active, and result/error states when those states exist.
6. Compare observed behavior with the acceptance checks, including playfield readability and HUD obstruction.
7. If any check fails, identify the owning subsystem, make the smallest root-cause fix, and repeat from step 3.
8. After the feature passes, run nearby regression checks. Continue to the next accepted feature only when evidence is complete.

## Evidence gate

Do not call a visual game feature complete without:

- successful type/build checks;
- a real browser playtest of its main action;
- screenshot evidence from the current implementation;
- a concise expected-versus-observed assessment;
- regression verification after the last fix.

Use `artifacts/agent-loop/<task>/iteration-<nn>/` for local screenshots and notes. These artifacts are verification evidence, not product source.

## Boundaries

- Stay inside the user-approved feature and GDD scope. Passing a check does not authorize the next unrequested milestone.
- Do not change the GDD silently to make an implementation pass.
- Ask before a design change, new dependency with material impact, destructive action, external mutation, or scope expansion.
- Stop and report the blocker after the same unresolved condition survives three evidence-based repair passes.
- When browser verification is unavailable, report the missing evidence; do not substitute code inspection for a visual pass.
