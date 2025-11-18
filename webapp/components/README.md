# Component Library

## Atomic Design Structure

This component library follows the **Atomic Design** methodology:

- **Atoms**: Basic building blocks (buttons, badges, labels)
- **Molecules**: Simple combinations of atoms (alert cards, icon labels)
- **Organisms**: Complex components built from molecules and atoms

---

## Atoms

### Container

Page-level container with responsive max-width and padding.

```tsx
import { Container } from "@/components/atoms/Container";

<Container
  size="lg" // "sm" | "md" | "lg" | "xl" | "full"
  paddingX="md" // "none" | "sm" | "md" | "lg"
  paddingY="xl" // "none" | "sm" | "md" | "lg" | "xl" | "2xl"
  center={true}
>
  Your page content
</Container>;
```

### Box

Flexible container for wrapping content with layout control.

```tsx
import { Box } from "@/components/atoms/Box";

<Box
  padding="lg" // "none" | "sm" | "md" | "lg" | "xl"
  width="container" // "full" | "container" | "narrow" | "wide"
  display="flex" // "block" | "flex" | "inline-flex"
  direction="col" // "row" | "col"
  align="center" // "start" | "center" | "end" | "stretch"
  justify="between" // "start" | "center" | "end" | "between" | "around"
  gap="md" // "none" | "xs" | "sm" | "md" | "lg" | "xl"
  as="section" // "div" | "section" | "article" | "main" | "aside"
>
  Your content
</Box>;
```

### Stack

Consistent spacing between children (vertical or horizontal).

```tsx
import { Stack } from "@/components/atoms/Stack";

<Stack
  spacing="md" // "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  direction="vertical" // "vertical" | "horizontal"
  align="start" // "start" | "center" | "end" | "stretch"
  justify="between" // "start" | "center" | "end" | "between" | "around"
  wrap={false}
  as="ul" // "div" | "section" | "ul" | "ol"
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>;
```

### Badge

Display metrics with icon, count, and label.

```tsx
import { Badge } from "@/components/atoms/Badge";
import { TrendingUp } from "lucide-react";

<Badge
  icon={TrendingUp}
  iconColor="text-teal-500"
  count={3}
  label="near 52-week highs"
  size="sm" // or "md"
/>;
```

### SectionHeader

Section header with icon and optional count.

```tsx
import { SectionHeader } from "@/components/atoms/SectionHeader";
import { TrendingUp } from "lucide-react";

<SectionHeader
  icon={TrendingUp}
  iconColor="text-amber-400"
  title="Big Movers"
  count={5}
  size="md" // "sm", "md", or "lg"
/>;
```

### StatusBadge

Small status badge with color-coded severity.

```tsx
import { StatusBadge } from "@/components/atoms/StatusBadge";

<StatusBadge
  severity="critical" // "info" | "warning" | "critical" | "success"
  label="critical"
/>;
```

### EmptyState

Empty state component for when there's no data.

```tsx
import { EmptyState } from "@/components/atoms/EmptyState";
import { Calendar } from "lucide-react";

<EmptyState
  icon={Calendar}
  title="No Data Available"
  description="Data will appear here once available."
>
  {/* Optional children for custom content */}
</EmptyState>;
```

---

## Molecules

### AlertCard

Card for displaying alert details with color-coded styling.

```tsx
import { AlertCard } from "@/components/molecules/AlertCard";
import { StatusBadge } from "@/components/atoms/StatusBadge";

<AlertCard
  symbol="AAPL"
  message="AAPL moved +5.2% today"
  type="critical" // "info" | "warning" | "critical" | "success"
  badge={<StatusBadge severity="critical" label="critical" />}
/>;
```

### IconLabel

Simple icon with label for displaying stats or info.

```tsx
import { IconLabel } from "@/components/molecules/IconLabel";
import { Calendar } from "lucide-react";

<IconLabel
  icon={Calendar}
  label="7-Day Timeline"
  iconColor="text-slate-400"
  iconSize={16}
/>;
```

### Accordion

Reusable accordion component with expand/collapse functionality.

```tsx
import { Accordion } from "@/components/molecules/Accordion";

<Accordion header={<div>Your header content here</div>} defaultExpanded={false}>
  <div>Your expandable content here</div>
</Accordion>;
```

---

## Usage Examples

### Example 1: Layout Containers

**Before (Repetitive Class Names)**

```tsx
<div className="space-y-6">
  <div>Content 1</div>
  <div>Content 2</div>
  <div className="flex flex-col xl:flex-row gap-6">
    <div className="flex-1 space-y-6">
      <div>Main content</div>
    </div>
    <div className="xl:w-96 space-y-6">
      <div>Sidebar</div>
    </div>
  </div>
</div>
```

**After (Using Container Components)**

```tsx
<Stack spacing="xl">
  <div>Content 1</div>
  <div>Content 2</div>
  <Box display="flex" direction="col" gap="xl" className="xl:flex-row">
    <Stack spacing="xl" className="flex-1">
      <div>Main content</div>
    </Stack>
    <Stack spacing="xl" className="xl:w-96">
      <div>Sidebar</div>
    </Stack>
  </Box>
</Stack>
```

### Example 2: Badges

**Before (Repetitive Code)**

```tsx
<div className="flex items-center gap-1.5 text-slate-300">
  <TrendingUp size={14} className="text-amber-400" />
  <span>
    <span className="font-semibold">{count}</span> hit ±3% moves
  </span>
</div>
```

**After (Using Badge Component)**

```tsx
<Badge
  icon={TrendingUp}
  iconColor="text-amber-400"
  count={count}
  label="hit ±3% moves"
/>
```

---

## Benefits

1. **Consistency**: Same styling and behavior across the app
2. **Maintainability**: Update once, changes reflect everywhere
3. **Developer Experience**: Less repetitive code, clearer intent
4. **Type Safety**: TypeScript props for better autocomplete
5. **Testability**: Test once at component level

---

## Best Practices

- **Use atoms for single-purpose elements** (buttons, badges, labels)
- **Use molecules for simple combinations** (card with icon+text)
- **Use organisms for complex features** (entire sections with state)
- **Keep components focused and reusable**
- **Document props and usage examples**
