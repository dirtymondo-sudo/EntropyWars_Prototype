---
name: hud-rules
description: mondo's battle HUD rules (turn order, action menu, combat log, UI Maker, spell buttons, party builder techniques) moved from MEMORY.md
metadata:
  type: feedback
---
HUD: minimal, bare icons. Turn order portraits left, AP right. No hover/range highlights while the game takes over (incl. end of round). ACTION MENU only shows when usable, hidden once for an action's whole animation (PR #358). Combat log right side, collapsible, hides in animations, stays ON at end of round, opens "A fight breaks out!". DEFAULT THEME = his "Entropy Wars Theme" (p_entropy). UI Maker: colour edge, Trapezoid + Parallelogram shapes (theme still Shard), Pops floating text, 61 Google Fonts, themed combat pop-ups (still old look, asked 10-20 no answer: ROUND banner, Your Turn sweep, match intro, Entropy Strike/finisher cards, spell name + TOTAL DMG, achievement toasts). SPELL BUTTONS (PR #366): red crossed swords = physical, three diamonds = magic; description bar uses same chips; UI Maker > Layout "Spell buttons: top + bottom row" drives Abilities + every quick menu. PARTY BUILDER TECHNIQUES (PR #382): the red circle IN FRONT of each spell carries swords/diamonds (cards, equipped slots, info panel); NO physical/magic chip after the name (mondo 10-20). [[ui-maker]]
