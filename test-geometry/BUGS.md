# Bug Tracker — test-geometry

## BUG-001: SVG Angle Arc Concavity (Status: FIXING)

**Reported:** 2026-02-27  **File:** `congruence-svg.html`

### Description
Angle arc markers at right-side vertices (∠B in SAS, ∠B/∠D in ASA) curve **toward** the vertex
instead of **away** from it. The arc should be convex viewed from the vertex (bulging into the
angle interior).

### Root Cause
SVG `sweep-flag=0` picks the circle center on the **opposite** side from the vertex when the
arc spans the upper-left quadrant (9 o'clock → upper-left). For right-side vertices:
- Correct arc center = vertex itself → requires `sweep=1` (CW short arc)
- `sweep=0` (CCW short arc) picks a circle centered upper-left → arc bows toward vertex ✗

**Rule:**
| Vertex position | Correct sweep |
|-----------------|--------------|
| LEFT vertex (angle opens upper-right) | `sweep=0` |
| RIGHT vertex (angle opens upper-left) | `sweep=1` |

### Fix Status: APPLIED 2026-02-27

---

## BUG-003: Vertex Label Overlap Between Adjacent Triangles (Status: FIXED 2026-02-28)

**Reported:** 2026-02-28  **File:** `congruence-svg.html`  **Exercise:** 14

### Description
When two triangles are placed side-by-side with a narrow gap, the rightmost vertex label of
the first triangle and the leftmost vertex label of the second triangle overlap visually.

**Example:** B label at x=158, D label at x=162 — only 4px separation. At font-size 13 bold,
each letter is ~8-10px wide, so "D" starts inside the bounding box of "B" → rendered as "BD" blob.

### Root Cause
- Triangle 1 vertex B at x=155, Triangle 2 vertex D at x=175 → 20px gap between vertices
- Labels placed just outside each vertex but both pushed toward the center gap
- No minimum-separation check when placing labels

### Rule (Verification Checklist)
```
FOR EACH PAIR OF VERTEX LABELS at the same y-coordinate:
  IF abs(x2 - x1) < 15px AND abs(y2 - y1) < 5px → LABEL OVERLAP BUG
```
**Minimum safe horizontal distance between label x-origins: ≥15px** (for font-size 13)
**Preferred: ≥20px** to allow comfortable reading

### Fix Applied
- B: x=158 → x=142 (moved left, outside left edge of gap)
- D: x=162 → x=178 (moved right, outside right edge of gap)
- Result: 36px gap between labels ✅

### Verification Test
After placing any vertex label, check all same-y-level labels:
```
B(142,147), D(178,147) → gap = 36px ≥ 15px ✓
```

---

## BUG-002: GeoGebra Single Triangle (Status: FIXING)

**Reported:** 2026-02-27  **File:** `congruence-geogebra.html`

### Description
Each GeoGebra section (SSS, SAS, ASA) shows only ONE triangle. Two congruent triangles should
be displayed side-by-side to visually demonstrate congruence.

### Fix Status: APPLIED 2026-02-27
