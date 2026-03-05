# Browser Audit: Capture Domain -- Group View

**Route:** `/group`
**Test encounter:** "Capture Browser Audit Test" (served)
**Snapshot files:** `page-2026-03-05T19-51-01-138Z.yml`

---

## Capabilities Checked

No capture-domain capabilities are expected on the group view. The group view is a TV/projector display that shows combatant cards (GroupCombatantCard), initiative tracker, and grid. It does not include:

- CapturePanel (GM-only)
- BallSelector (GM-only)
- CaptureContextToggles (GM-only)
- CaptureRateDisplay (not included in GroupCombatantCard)
- PlayerCapturePanel (player-only)
- PlayerCombatActions (player-only)

### Verification

The group encounter view component (`app/pages/group/_components/EncounterView.vue`) was searched for capture-related references -- none found. The GroupCombatantCard used on the group view does not include CombatantCaptureSection.

The group view snapshot shows the Lobby tab with player roster (Hassan and Marilena) with their Pokemon. No capture elements present, which is expected behavior.

**Evidence:**
```
- heading "Hassan" [level=2]
  - generic: Igbunu
- generic: Lv 1
- img "Chomps"
  - generic: Chomps / Lv 10
  - generic "Dragon" / generic "Ground"
```

---

## Summary -- Group View

No capture capabilities are accessible from the group view. This is expected -- capture is an interactive mechanic requiring GM or player action, not a passive display element suitable for the group TV view.

**Total: 0 capabilities expected, 0 checked**
