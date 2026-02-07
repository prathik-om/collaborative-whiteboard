# Phase 2: Templates System

**Status:** Planning
**Priority:** P2 (Nice-to-have for Phase 2)
**Estimated Effort:** 3-4 days
**Target Completion:** Week 2 of Phase 2

---

## Overview

Add pre-built templates to help users start collaborating faster. Instead of staring at a blank canvas, users can choose a template that fits their use case.

### Goals
- Reduce "blank canvas syndrome" (30% of users abandon after creating session)
- Showcase different use cases (brainstorm, mind map, project planning)
- Provide structure for common workflows
- Increase session creation → collaboration conversion

### Non-Goals (For Now)
- User-created custom templates (Phase 4)
- Template marketplace (Phase 5)
- AI-generated templates (Phase 4)

---

## User Experience

### Landing Page Flow

**Current:**
```
User clicks "Create Whiteboard" → Blank canvas opens
```

**Proposed:**
```
User clicks "Create Whiteboard" → Template gallery modal → Select template → Canvas with pre-filled content
                                 ↓
                           [Skip - Start Blank]
```

### Template Gallery Modal

**Layout:**
```
┌─────────────────────────────────────────┐
│   Choose a Template                   × │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ Blank  │  │Brainstm│  │Mind Map│   │
│  │        │  │        │  │        │   │
│  │  📝    │  │  💡    │  │  🗺️    │   │
│  │        │  │        │  │        │   │
│  └────────┘  └────────┘  └────────┘   │
│   Default     Sticky       Central     │
│               notes        concept      │
│                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │Project │  │Wirefrme│  │ More   │   │
│  │Plan    │  │        │  │Coming  │   │
│  │  📅    │  │  🎨    │  │  ...   │   │
│  │        │  │        │  │        │   │
│  └────────┘  └────────┘  └────────┘   │
│   Timeline    UI mockup   Phase 3      │
│                                         │
│              [Start Drawing]            │
└─────────────────────────────────────────┘
```

**Features:**
- Click template card to select
- Preview expands on hover
- "Start Drawing" button creates session with selected template
- ESC key or × closes modal (starts blank)

---

## Template Designs

### Template 1: Blank Canvas (Default)
**Use Case:** Freeform drawing, no constraints
**Pre-filled Content:** None
**Color Scheme:** Default tldraw

**Implementation:**
```typescript
const blankTemplate = {
  name: 'Blank Canvas',
  description: 'Start from scratch',
  icon: '📝',
  snapshot: {} // Empty tldraw snapshot
}
```

---

### Template 2: Brainstorm (Sticky Notes)
**Use Case:** Idea generation, group brainstorming, categorizing thoughts
**Pre-filled Content:**
- 6 colored sticky note shapes (3 columns × 2 rows)
- Header text: "Brainstorm Session"
- Instructions: "Add ideas here →"
- Category labels: "Ideas", "Action Items", "Questions"

**Layout:**
```
┌────────────────────────────────────┐
│     Brainstorm Session             │
├────────────────────────────────────┤
│                                    │
│  Ideas         Action Items  ?'s  │
│  ┌─────┐      ┌─────┐      ┌───┐ │
│  │     │      │     │      │   │ │
│  │     │      │     │      │   │ │
│  └─────┘      └─────┘      └───┘ │
│  ┌─────┐      ┌─────┐      ┌───┐ │
│  │     │      │     │      │   │ │
│  │     │      │     │      │   │ │
│  └─────┘      └─────┘      └───┘ │
│                                    │
│  Add more sticky notes as needed! │
└────────────────────────────────────┘
```

**Color Palette:**
- Ideas: Yellow (#FFF176)
- Action Items: Green (#AED581)
- Questions: Blue (#64B5F6)

**Implementation:**
```typescript
const brainstormTemplate = {
  name: 'Brainstorm',
  description: 'Organize ideas with sticky notes',
  icon: '💡',
  snapshot: {
    shapes: [
      { type: 'text', x: 100, y: 50, text: 'Brainstorm Session', fontSize: 32 },
      { type: 'text', x: 100, y: 120, text: 'Ideas', fontSize: 20 },
      { type: 'text', x: 400, y: 120, text: 'Action Items', fontSize: 20 },
      { type: 'text', x: 700, y: 120, text: 'Questions', fontSize: 20 },
      { type: 'geo', x: 100, y: 160, w: 200, h: 150, fill: '#FFF176' },
      { type: 'geo', x: 100, y: 330, w: 200, h: 150, fill: '#FFF176' },
      { type: 'geo', x: 400, y: 160, w: 200, h: 150, fill: '#AED581' },
      { type: 'geo', x: 400, y: 330, w: 200, h: 150, fill: '#AED581' },
      { type: 'geo', x: 700, y: 160, w: 200, h: 150, fill: '#64B5F6' },
      { type: 'geo', x: 700, y: 330, w: 200, h: 150, fill: '#64B5F6' },
    ]
  }
}
```

---

### Template 3: Mind Map
**Use Case:** Visualize relationships, study notes, concept mapping
**Pre-filled Content:**
- Central circle: "Main Topic"
- 4 branch nodes connected to center
- Placeholder text: "Subtopic 1", "Subtopic 2", etc.
- Arrows connecting nodes

**Layout:**
```
           ┌──────────┐
           │Subtopic 1│
           └──────────┘
                ↓
    ┌──────────────────────┐
    │    Main Topic        │
    └──────────────────────┘
         ↓          ↓
┌──────────┐  ┌──────────┐
│Subtopic 2│  │Subtopic 3│
└──────────┘  └──────────┘
         ↓
    ┌──────────┐
    │Subtopic 4│
    └──────────┘
```

**Color Scheme:**
- Center: Blue (#2196F3)
- Branches: Orange (#FF9800)
- Arrows: Gray (#757575)

**Implementation:**
```typescript
const mindMapTemplate = {
  name: 'Mind Map',
  description: 'Visualize ideas and connections',
  icon: '🗺️',
  snapshot: {
    shapes: [
      { type: 'geo', shape: 'ellipse', x: 400, y: 300, w: 200, h: 100, fill: '#2196F3', text: 'Main Topic' },
      { type: 'geo', shape: 'rectangle', x: 400, y: 100, w: 150, h: 80, fill: '#FF9800', text: 'Subtopic 1' },
      { type: 'geo', shape: 'rectangle', x: 200, y: 350, w: 150, h: 80, fill: '#FF9800', text: 'Subtopic 2' },
      { type: 'geo', shape: 'rectangle', x: 650, y: 350, w: 150, h: 80, fill: '#FF9800', text: 'Subtopic 3' },
      { type: 'geo', shape: 'rectangle', x: 400, y: 500, w: 150, h: 80, fill: '#FF9800', text: 'Subtopic 4' },
      { type: 'arrow', start: { x: 500, y: 300 }, end: { x: 475, y: 180 } },
      { type: 'arrow', start: { x: 450, y: 350 }, end: { x: 350, y: 380 } },
      { type: 'arrow', start: { x: 550, y: 350 }, end: { x: 700, y: 380 } },
      { type: 'arrow', start: { x: 500, y: 400 }, end: { x: 475, y: 500 } },
    ]
  }
}
```

---

### Template 4: Project Plan (Timeline)
**Use Case:** Planning projects, homework schedules, sprints
**Pre-filled Content:**
- Horizontal timeline with weeks
- Swim lanes for different workstreams
- Milestone markers
- Color-coded phases

**Layout:**
```
Project Timeline
─────────────────────────────────────────
Week 1    Week 2    Week 3    Week 4
─────────────────────────────────────────
Research  │  Design  │  Build   │ Test
─────────────────────────────────────────
[ Phase 1: Planning ][ Phase 2: Execute ]
─────────────────────────────────────────
         ★                    ★
    Kickoff               Launch
```

**Color Scheme:**
- Phase 1 (Planning): Purple (#9C27B0)
- Phase 2 (Execute): Green (#4CAF50)
- Milestones: Gold (#FFC107)

---

### Template 5: Wireframe (UI Mockup)
**Use Case:** Designing UIs, sketching app layouts, web design
**Pre-filled Content:**
- Grid layout guides
- Common UI elements (header, sidebar, content area)
- Placeholder boxes
- Device frame (mobile or desktop)

**Layout:**
```
┌──────────────────────────────────┐
│  Header / Navigation             │
├────────┬─────────────────────────┤
│        │                         │
│Sidebar │   Content Area          │
│        │                         │
│        │   [Component]           │
│        │                         │
│        │   [Component]           │
│        │                         │
├────────┴─────────────────────────┤
│  Footer                          │
└──────────────────────────────────┘
```

---

## Technical Implementation

### Data Model

```typescript
// types/templates.ts
interface Template {
  id: string
  name: string
  description: string
  icon: string // Emoji or icon name
  category: 'productivity' | 'design' | 'education' | 'other'
  snapshot: TLDrawSnapshot // tldraw snapshot format
  thumbnailUrl?: string // Optional preview image
  popularity?: number // For sorting/recommendations
}

// Built-in templates
const TEMPLATES: Template[] = [
  blankTemplate,
  brainstormTemplate,
  mindMapTemplate,
  projectPlanTemplate,
  wireframeTemplate
]
```

### File Structure

```
app/
├── templates/
│   ├── TemplateGallery.tsx      # Modal component
│   ├── TemplateCard.tsx         # Individual template card
│   └── templates.ts             # Template definitions
utils/
└── templates.ts                 # Template helpers
```

### Implementation Steps

**Step 1: Create Template Definitions**
```typescript
// utils/templates.ts
export const templates: Template[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch',
    icon: '📝',
    category: 'productivity',
    snapshot: {}
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Organize ideas with sticky notes',
    icon: '💡',
    category: 'productivity',
    snapshot: brainstormSnapshot // Defined elsewhere
  },
  // ... more templates
]

export function getTemplateById(id: string): Template | null {
  return templates.find(t => t.id === id) || null
}
```

**Step 2: Template Gallery Component**
```typescript
// components/TemplateGallery.tsx
'use client'

import { useState } from 'react'
import { templates } from '@/utils/templates'
import { useCreateSession } from '@/hooks/useCreateSession'

export function TemplateGallery({ onClose }: { onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const { createSession } = useCreateSession()

  const handleStart = async () => {
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return

    const session = await createSession()
    // Load template snapshot into session
    if (template.snapshot) {
      await supabase
        .from('sessions')
        .update({ canvas_snapshot: template.snapshot })
        .eq('id', session.id)
    }

    // Navigate to board
    window.location.href = `/board?code=${session.code}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Choose a Template</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplate === template.id}
              onSelect={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-blue-500 text-white py-3 rounded-lg"
        >
          Start Drawing
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Update Landing Page**
```typescript
// app/page.tsx
'use client'

import { useState } from 'react'
import { TemplateGallery } from '@/components/TemplateGallery'

export default function HomePage() {
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div>
      <h1>Collaborative Whiteboard</h1>
      <button onClick={() => setShowTemplates(true)}>
        Create Whiteboard
      </button>

      {showTemplates && (
        <TemplateGallery onClose={() => setShowTemplates(false)} />
      )}
    </div>
  )
}
```

---

## Testing Plan

### Unit Tests
- [ ] Template loading (getTemplateById)
- [ ] Template validation (all required fields present)
- [ ] Default template selection

### Integration Tests
- [ ] Session created with template snapshot
- [ ] Canvas loads with template content
- [ ] Late joiners see template content

### E2E Tests
- [ ] User selects template and creates session
- [ ] Canvas displays template shapes
- [ ] Multiple users collaborate on template-based session

---

## Analytics & Success Metrics

### Track These Events
- `template_gallery_opened` - User opened gallery
- `template_selected` - User selected a template (which one)
- `template_session_created` - Session created from template
- `template_abandoned` - User closed gallery without selecting

### Success Criteria
- **Adoption:** 30%+ of sessions use templates (vs blank)
- **Completion:** 80%+ of users who select template complete session creation
- **Favorites:** Brainstorm and Mind Map most popular (hypothesis)
- **Retention:** Template users have 20% higher 7-day retention

---

## Future Enhancements (Phase 3+)

### Phase 3
- [ ] More templates (Kanban, Venn Diagram, Flowchart)
- [ ] Template preview (show full canvas before selecting)
- [ ] Template search/filter
- [ ] "Recently used" templates

### Phase 4
- [ ] User-created custom templates
- [ ] "Save as template" feature
- [ ] Template sharing (public templates)
- [ ] Template versioning

### Phase 5
- [ ] Template marketplace
- [ ] Paid premium templates
- [ ] AI-generated templates ("Create a template for...")
- [ ] Template analytics (which templates perform best)

---

## Open Questions

1. **Should templates be editable before session starts?** (Or fixed until canvas loads)
2. **Should we show template preview on hover?** (Or require click)
3. **Should blank canvas be default or force selection?** (Current: blank default)
4. **Should we track which templates are most popular?** (Yes, for product insights)
5. **Should templates have categories/tags?** (Not for MVP, add later)

---

## Related Documents

- [Product Roadmap](product-roadmap.md) - Overall product vision
- [Testing Strategy](testing-strategy.md) - How to test templates
- [Architecture Decisions](architecture-decisions.md) - Why tldraw snapshots

---

**Next Steps:**
1. Design template snapshots in Figma or tldraw directly
2. Implement Template Gallery UI
3. Write tests for template loading
4. User test with 5 students (observe which templates they choose)
5. Iterate based on feedback
