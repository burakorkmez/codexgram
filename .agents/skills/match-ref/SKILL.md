---
name: match-ref
description: Match a screen to a reference image by looping — screenshot the simulator, compare to the ref, fix the biggest mismatch, repeat until identical. Use when asked to make a screen look like a reference screenshot, match a design or mockup, or make a UI identical to an image.
---

# Match a screen to a reference image

Take a screenshot from the simulator, compare it to the ref image, build it the
same. Stay in this loop until it looks identical.

1. `xcrun simctl io booted screenshot /tmp/shot.png`
2. Read both images top to bottom, region by region — header → body → tab bar.
   Don't eyeball the whole screen at once.
3. Fix the highest-priority difference, reload, back to 1.

## Compare everything, in this order

Structure before cosmetics — padding on an element that shouldn't exist is wasted work.

1. **Structure** — elements present/missing/extra, order, layout type, column count, items per screen
2. **Proportion** — sizes relative to screen width, image aspect ratios, section heights
3. **Spacing** — screen padding, item gaps, section separation, safe area, edge-to-edge vs inset
4. **Typography** — family, size, weight, line height, letter spacing, case, color, alignment, truncation
5. **Color** — backgrounds, primary/secondary text, borders, tints, gradient stops, opacity, scrims
6. **Shape & depth** — corner radii, border width/color, shadows, blur/glass, dividers
7. **Icons** — glyph, filled vs outlined, size, stroke weight, color, position vs label
8. **Chrome** — status bar style, large vs inline title, search bar, tab bar height/labels

## Rules

- **Ignore content.** Different photos, usernames, counts, timestamps are not mismatches.
  Only chase what code determines.
- **Stop after 6 rounds**, or on any item that survives two fix attempts — report it
  instead of trying a third time.
- Finish by listing what still differs and why.
