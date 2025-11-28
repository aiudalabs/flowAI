# 🎨 Horizontal Layout - Multi-Perspective Analysis

## ✅ Updated Workflow Layout

The Multi-Perspective Analysis workflow has been reorganized to use **horizontal (left-to-right) connections** using the new side handles!

---

## 📐 New Layout Visualization

### ASCII Diagram:
```
[Trigger] ─┬─➡️ [Technical] ───┐
           │                    │
           ├─➡️ [Business]  ───┤
           │                    │
           ├─➡️ [UX]        ───┤──➡️ [Synthesizer] ──➡️ [Output]
           │                    │
           ├─➡️ [Ethical]   ───┤
           │                    │
           └─➡️ [Competitive] ─┘
```

### Visual Layout:
```
Column 1        Column 2              Column 3          Column 4
(x: 100)        (x: 400)              (x: 750)          (x: 1050)

              [Technical]       ─┐
                 (y:50)          │
                                 │
              [Business]        ─┤
                (y:150)          │
                                 │
[Trigger]──➡️  [UX]             ─┤──➡️ [Synthesizer] ──➡️ [Output]
 (y:300)       (y:250)           │       (y:250)          (y:250)
                                 │
              [Ethical]         ─┤
                (y:350)          │
                                 │
              [Competitive]     ─┘
                (y:450)
```

---

## 🔗 Connection Details

### All Edges Use Side Handles:

**From Trigger to Analysis Nodes:**
- `sourceHandle: "right-source"` (trigger's right handle)
- `targetHandle: "left-target"` (analysis node's left handle)

**From Analysis to Synthesizer:**
- `sourceHandle: "right-source"` (analysis node's right handle)
- `targetHandle: "left-target"` (synthesizer's left handle)

**From Synthesizer to Output:**
- `sourceHandle: "right-source"` (synthesizer's right handle)
- `targetHandle: "left-target"` (output's left handle)

---

## 📊 Node Positions

### Column Layout:

| Node           | X Position | Y Position | Column    |
|----------------|------------|------------|-----------|
| Trigger        | 100        | 300        | Column 1  |
| Technical      | 400        | 50         | Column 2  |
| Business       | 400        | 150        | Column 2  |
| UX             | 400        | 250        | Column 2  |
| Ethical        | 400        | 350        | Column 2  |
| Competitive    | 400        | 450        | Column 2  |
| Synthesizer    | 750        | 250        | Column 3  |
| Output         | 1050       | 250        | Column 4  |

### Spacing:
- **Horizontal spacing:** 300px between columns
- **Vertical spacing:** 100px between parallel nodes
- **Total width:** ~1200px
- **Total height:** ~500px

---

## 🎯 Benefits of Horizontal Layout

### ✅ Better Visual Flow
- Left-to-right matches natural reading direction
- Clear progression: Input → Analysis → Synthesis → Output
- Easy to follow the data pipeline

### ✅ More Compact
- Uses width instead of height
- Better for wide screens
- All parallel nodes visible at once

### ✅ Cleaner Connections
- No crossing edges
- Straight horizontal lines
- Clear which nodes feed into synthesis

### ✅ Professional Appearance
- Looks like a production pipeline
- Similar to CI/CD diagrams
- Common in enterprise workflows

---

## 🚀 How to Load & Test

### Option 1: Load via Script
```bash
python scripts/load_workflow.py workflows/multi_perspective_analysis.json
```

### Option 2: Load in UI
1. Open http://localhost:3000
2. Click **"Load"**
3. Select **"Multi-Perspective AI Analysis"**
4. See the horizontal layout!

### Option 3: Execute Immediately
```bash
python scripts/load_workflow.py workflows/multi_perspective_analysis.json \
  --execute \
  --topic "AI-powered code review tools" \
  --wait
```

---

## 🎨 Visual Comparison

### Before (Vertical):
```
        [Trigger]
            │
    ┌───────┼───────┐
    ⬇️       ⬇️       ⬇️
  [Tech] [Business] [UX]
    ⬇️       ⬇️       ⬇️
    └───────┼───────┘
            ⬇️
      [Synthesizer]
            ⬇️
        [Output]
```
- Uses vertical space
- Harder to see all parallel nodes
- More scrolling needed

### After (Horizontal):
```
[Trigger] ─┬─➡️ [Tech]     ─┐
           │                │
           ├─➡️ [Business] ─┤
           │                ├─➡️ [Synthesizer] ─➡️ [Output]
           └─➡️ [UX]       ─┘
```
- Uses horizontal space
- All nodes visible at once
- Clear left-to-right flow

---

## 💡 Customization Tips

### Adjust Spacing
Edit the JSON positions:
```json
{
  "position": { "x": 400, "y": 150 }
}
```

### Change Flow Direction
You can create:
- **Right-to-left:** Switch source/target handles
- **Top-to-bottom:** Use top/bottom handles
- **Mixed:** Combine different directions

### Add More Nodes
Keep the same column structure:
```
Column 2: x = 400 (Analysis nodes)
Column 3: x = 750 (Synthesis)
Column 4: x = 1050 (Output)
```

Just add new nodes with different Y positions!

---

## 🔧 Edge Handle Format

Every edge now specifies exact handles:

```json
{
  "id": "e1",
  "source": "trigger-1",
  "target": "llm-technical",
  "sourceHandle": "right-source",  // ← Right side of trigger
  "targetHandle": "left-target"     // ← Left side of technical
}
```

This ensures connections use the **side handles** instead of top/bottom.

---

## 🎓 What You Learned

✅ How to organize workflows horizontally
✅ How to use `sourceHandle` and `targetHandle`
✅ How to create professional pipeline layouts
✅ How to space nodes for clean appearance
✅ How to avoid crossing edges

---

## 🎉 Result

A clean, professional, **left-to-right workflow** that's easy to understand and looks great!

**Load it now and see the difference!** 🚀
