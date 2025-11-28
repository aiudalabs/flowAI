# 🔗 Node Connections Guide

## ✅ 4-Way Connection Handles

All nodes now support **4 connection points** for maximum flexibility in workflow design!

### Connection Points

Each node has handles on all 4 sides:

```
        ⬆️ TOP
         ▪
         │
    ◀️ ▪─┼─▪ ▶️  LEFT/RIGHT
         │
         ▪
       ⬇️ BOTTOM
```

---

## 🎨 Handle Types & Colors

### Top Handle (Blue when hovering)
- **Type:** Input (target)
- **Purpose:** Receive data from nodes above
- **Color:** Gray (default) → Blue (hover)

### Bottom Handle (Green when hovering)
- **Type:** Output (source)
- **Purpose:** Send data to nodes below
- **Color:** Gray (default) → Green (hover)

### Left Handles (Dual-purpose)
- **Type:** Both input AND output
- **Purpose:** Connect horizontally to the left
- **Colors:**
  - Input: Gray → Blue (hover)
  - Output: Gray → Green (hover)

### Right Handles (Dual-purpose)
- **Type:** Both input AND output
- **Purpose:** Connect horizontally to the right
- **Colors:**
  - Input: Gray → Blue (hover)
  - Output: Gray → Green (hover)

---

## 📐 Layout Examples

### Vertical Flow (Traditional)
```
   [Trigger]
       ⬇️
     [LLM]
       ⬇️
   [Output]
```

**Connections:**
- Trigger (bottom) → LLM (top)
- LLM (bottom) → Output (top)

---

### Horizontal Flow (New!)
```
[Trigger] ➡️ [API] ➡️ [LLM] ➡️ [Output]
```

**Connections:**
- Trigger (right) → API (left)
- API (right) → LLM (left)
- LLM (right) → Output (left)

---

### Fan-Out Pattern
```
           [Trigger]
          ⬇️    ⬇️    ⬇️
       [LLM1][LLM2][LLM3]
```

**Connections:**
- Trigger (bottom) → LLM1 (top)
- Trigger (bottom) → LLM2 (top)
- Trigger (bottom) → LLM3 (top)

---

### Parallel with Side Connections
```
[Trigger] ─┬─➡️ [LLM1]
           │
           ├─➡️ [LLM2]
           │
           └─➡️ [LLM3]
```

**Connections:**
- Trigger (right) → LLM1 (left)
- Trigger (right) → LLM2 (left)
- Trigger (right) → LLM3 (left)

---

### Grid Layout
```
[Node1] ➡️ [Node2]
   ⬇️          ⬇️
[Node3] ➡️ [Node4]
```

**Connections:**
- Node1 (right) → Node2 (left)
- Node1 (bottom) → Node3 (top)
- Node2 (bottom) → Node4 (top)
- Node3 (right) → Node4 (left)

---

### Complex Multi-Path
```
        [Input]
       ⬇️      ⬇️
    [Path1] [Path2]
       ⬇️      ⬇️
       └─➡️[Merge]⬅️┘
            ⬇️
         [Output]
```

**Connections:**
- Input (bottom) → Path1 (top)
- Input (bottom) → Path2 (top)
- Path1 (right) → Merge (left)
- Path2 (left) → Merge (right)
- Merge (bottom) → Output (top)

---

## 🎯 Best Practices

### 1. **Consistent Flow Direction**
Choose a primary flow direction for clarity:
- **Top to Bottom** - Traditional, intuitive for sequences
- **Left to Right** - Good for pipelines, processes
- **Mixed** - Use for complex branching logic

### 2. **Minimize Crossing Lines**
Use side handles to avoid edge crossings:

**❌ Bad (crosses):**
```
[A] ─┐
     ├─X─➡️ [C]
[B] ─┘
```

**✅ Good (no crossing):**
```
[A] ➡️ [C]
     ⬆️
[B] ─┘
```

### 3. **Logical Grouping**
Use layout to show related nodes:

```
┌─────────────────────┐
│  Data Processing    │
│  [API] ➡️ [Transform]│
└─────────────────────┘
          ⬇️
┌─────────────────────┐
│  AI Analysis        │
│  [LLM] ➡️ [Output]  │
└─────────────────────┘
```

### 4. **Parallel Operations**
Use horizontal or vertical alignment for parallel tasks:

**Horizontal Parallel:**
```
           [Start]
              ⬇️
    ┌─────────┼─────────┐
    ⬇️         ⬇️         ⬇️
  [Task1]  [Task2]  [Task3]
    ⬇️         ⬇️         ⬇️
    └─────────┼─────────┘
              ⬇️
            [End]
```

**Vertical Parallel:**
```
[Start] ─┬─➡️ [Task1] ─┐
         │              │
         ├─➡️ [Task2] ─┤
         │              ├─➡️ [End]
         └─➡️ [Task3] ─┘
```

---

## 🎨 Visual Patterns

### Pipeline Pattern (Left to Right)
```
[Input] ➡️ [Process1] ➡️ [Process2] ➡️ [Process3] ➡️ [Output]
```
**Use for:** Sequential data transformations

---

### Waterfall Pattern (Top to Bottom)
```
[Stage1]
   ⬇️
[Stage2]
   ⬇️
[Stage3]
   ⬇️
[Stage4]
```
**Use for:** Phase-based workflows

---

### Diamond Pattern (Decision Flow)
```
      [Input]
         ⬇️
    [Condition]
     ⬇️      ⬇️
  [Yes]    [No]
     ⬇️      ⬇️
      [Merge]
         ⬇️
     [Output]
```
**Use for:** Conditional branching

---

### Star Pattern (Broadcast)
```
      [LLM2]
         ⬆️
  [LLM1] ⬅️ [Trigger] ➡️ [LLM3]
         ⬇️
      [LLM4]
```
**Use for:** Multiple independent analyses

---

## 🔧 Advanced Techniques

### 1. **Circular References** (Future)
Currently not supported, but you can simulate with:
```
[Start] ➡️ [Process] ➡️ [Check]
              ⬆️           ⬇️
              └─────────┘
         (Manual loop)
```

### 2. **Merge Points**
Multiple inputs to one node:
```
[Path1] ─┐
         ├─➡️ [Merge]
[Path2] ─┘
```

### 3. **Broadcast Points**
One output to multiple nodes:
```
[Source] ─┬─➡️ [Dest1]
          │
          ├─➡️ [Dest2]
          │
          └─➡️ [Dest3]
```

---

## 💡 Pro Tips

### Tip 1: Use Space Wisely
Spread nodes out to avoid clutter:
- **Minimum spacing:** 150px horizontally, 100px vertically
- **Recommended:** 200px horizontally, 120px vertically

### Tip 2: Align Nodes
Use ReactFlow's grid to align nodes:
- Hold `Shift` while dragging for grid snapping (if enabled)
- Use consistent spacing for visual harmony

### Tip 3: Color-Code by Function
Nodes have different colors by type:
- 🟦 **Blue** - Trigger nodes
- 🟩 **Green** - LLM nodes
- 🟨 **Yellow** - API nodes
- 🟧 **Orange** - Conditional nodes
- 🟪 **Purple** - Output nodes

### Tip 4: Document Complex Flows
For complex workflows, add notes about:
- Expected data flow
- Parallel vs sequential execution
- Error handling paths

---

## 🎮 Interactive Features

### Hover Effects
- **Gray handles** - Available for connection
- **Blue highlight** - Input handle (hover)
- **Green highlight** - Output handle (hover)

### Connection Rules
- ✅ **Can connect:** Output → Input
- ✅ **Can connect:** Same side (left → left, right → right)
- ❌ **Cannot connect:** Input → Input
- ❌ **Cannot connect:** Output → Output
- ❌ **Cannot connect:** Node to itself

### Visual Feedback
- **During drag:** Connection preview line
- **On drop:** Edge appears with animation
- **Invalid target:** Red highlight (future)

---

## 📊 Example: Multi-Perspective Analysis

Using the new handles for better organization:

```
                    [Trigger]
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ⬇️               ⬇️               ⬇️
    [Technical]     [Business]        [UX]
        │               │               │
        └───────────────┼───────────────┘
                        ⬇️
                  [Synthesizer]
                        ⬇️
                    [Output]
```

**Alternative Horizontal Layout:**
```
[Trigger] ─┬─➡️ [Technical] ─┐
           │                 │
           ├─➡️ [Business]  ─┤
           │                 ├─➡️ [Synthesizer] ➡️ [Output]
           ├─➡️ [UX]       ─┤
           │                 │
           └─➡️ [Ethical]   ─┘
```

---

## 🚀 Getting Started

1. **Open FlowAI:** http://localhost:3000
2. **Drag a node** from the palette
3. **Hover over handles** to see connection points
4. **Click and drag** from any handle to connect
5. **Experiment** with different layouts!

---

## 🎯 Summary

✅ **4 connection points** per node (top, bottom, left, right)
✅ **Flexible layouts** - vertical, horizontal, grid, star
✅ **Visual feedback** - color-coded handles
✅ **Better organization** - avoid crossing edges
✅ **Professional workflows** - clean, readable graphs

**Start building better-organized workflows today!** 🎉
