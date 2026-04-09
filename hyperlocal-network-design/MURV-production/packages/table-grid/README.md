# @murv/grid-table

A powerful and flexible table/grid component library with built-in virtualization support for React applications.

## Overview

This package provides three main components for rendering tabular data:

- **`TableGrid`** - Basic table without virtualization, best for small datasets
- **`ContainerGrid`** - Container-based virtualization with a scrollable wrapper
- **`WindowScrollGrid`** - Window/page-level virtualization that uses the page scroll

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Component Guide](#component-guide)
- [1. TableGrid](#1-tablegrid)
- [2. ContainerGrid](#2-containergrid)
- [3. WindowScrollGrid](#3-windowscrollgrid)
- [Advanced Examples](#advanced-examples)
- [Props Reference](#props-reference)
- [Performance Tips](#performance-tips)
- [TypeScript Support](#typescript-support)
- [Styling](#styling)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Support](#support)

---

## Installation

```bash
npm install @murv/grid-table
```

## Quick Start

```tsx
import { TableGrid, ContainerGrid, WindowScrollGrid } from "@murv/grid-table";

// Define your data type
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Define columns
const columns = [
  { id: "name", header: "Name", key: "name", isSortable: true },
  { id: "email", header: "Email", key: "email", isSortable: true },
  { id: "role", header: "Role", key: "role" },
];

// Your data
const data: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
  // ... more data
];
```

---

## Component Guide

### When to Use Each Component

| Component          | Best For                                   | Virtualization  | Scroll Container                                                                            |
| ------------------ | ------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------- |
| `TableGrid`        | Small datasets (< 30 rows)                 | None            | Container with maxHeight                                                                    |
| `ContainerGrid`    | Medium/large datasets in a fixed container | Container-based | Fixed height container                                                                      |
| `WindowScrollGrid` | Large datasets with page-level scroll      | Window-based    | Page or custom scroll element (Seller Dashboard: use `scrollElementId="content-container"`) |

---

## 1. TableGrid

Basic table component without virtualization. Best for small datasets where rendering all rows at once is performant.

### Basic Example

```tsx
import { TableGrid } from "@murv/grid-table";

function BasicTable() {
  const columns = [
    { id: "id", header: "ID", key: "id" },
    { id: "name", header: "Name", key: "name", isSortable: true },
    { id: "email", header: "Email", key: "email", isSortable: true },
  ];

  const data = [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
    { id: 3, name: "Charlie", email: "charlie@example.com" },
  ];

  return (
    <TableGrid
      data={data}
      columns={columns}
      onRowSelect={(selectedRows) => console.log(selectedRows)}
    />
  );
}
```

### With Fixed Header and Max Height

```tsx
function ScrollableTable() {
  return (
    <TableGrid
      data={data}
      columns={columns}
      fixedHeader={true}
      maxHeight="400px"
      onRowSelect={(selectedRows) => console.log(selectedRows)}
    />
  );
}
```

### With Row Selection

```tsx
function SelectableTable() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  return (
    <TableGrid
      data={data}
      columns={columns}
      enableRowSelection={true}
      onRowSelect={setSelectedRows}
    />
  );
}
```

---

## 2. ContainerGrid

Container-based virtualization for large datasets. Only renders visible rows within a fixed-height scrollable container.

### Basic Example

```tsx
import { ContainerGrid } from "@murv/grid-table";

function VirtualizedTable() {
  const columns = [
    { id: "id", header: "ID", key: "id" },
    { id: "name", header: "Name", key: "name", isSortable: true },
    { id: "department", header: "Department", key: "department" },
  ];

  // Large dataset (e.g., 1000+ rows)
  const data = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    department: `Dept ${(i % 10) + 1}`,
  }));

  return (
    <ContainerGrid
      data={data}
      columns={columns}
      maxHeight="600px" // Required for virtualization
      onRowSelect={(rows) => console.log(rows)}
    />
  );
}
```

### With Custom Virtualization Settings

```tsx
function CustomVirtualizedTable() {
  return (
    <ContainerGrid
      data={largeDataset}
      columns={columns}
      maxHeight="calc(100vh - 200px)"
      virtualizeThreshold={50} // Start virtualizing after 50 rows
      rowHeight={48} // Custom row height
      overscan={10} // Render 10 extra rows above/below viewport
      onRowSelect={(rows) => console.log(rows)}
    />
  );
}
```

### With Loading and Error States

```tsx
function TableWithStates() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState([]);

  return (
    <ContainerGrid
      data={data}
      columns={columns}
      maxHeight="600px"
      loading={loading}
      error={error}
      infoMessage={{
        emptyState: "No users found",
        errorState: "Failed to load users",
        userMessage: "Please try again later",
      }}
      onRowSelect={(rows) => console.log(rows)}
    />
  );
}
```

---

## 3. WindowScrollGrid

Window-level virtualization that uses the browser's scroll or a custom scroll container. Best for full-page tables.

### Basic Example (Window Scroll)

```tsx
import { WindowScrollGrid } from "@murv/grid-table";

function FullPageTable() {
  const columns = [
    { id: "id", header: "ID", key: "id" },
    { id: "product", header: "Product", key: "product", isSortable: true },
    { id: "price", header: "Price", key: "price", textAlignment: "right" },
  ];

  const data = Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    product: `Product ${i + 1}`,
    price: `$${(Math.random() * 100).toFixed(2)}`,
  }));

  return (
    <div>
      <h1>Product Catalog</h1>
      <WindowScrollGrid data={data} columns={columns} onRowSelect={(rows) => console.log(rows)} />
    </div>
  );
}
```

### With Custom Scroll Container

```tsx
function CustomScrollContainer() {
  return (
    <div>
      <div id="app-content" style={{ height: "100vh", overflow: "auto" }}>
        <WindowScrollGrid
          data={data}
          columns={columns}
          scrollElementId="app-content"
          onRowSelect={(rows) => console.log(rows)}
        />
      </div>
    </div>
  );
}
```

### With Fixed Header

```tsx
function StickyHeaderTable() {
  return (
    <WindowScrollGrid
      data={data}
      columns={columns}
      fixedHeader={true}
      rowHeight={56}
      onRowSelect={(rows) => console.log(rows)}
    />
  );
}
```

### ⚠️ Important: Seller Dashboard Usage

If you're implementing `WindowScrollGrid` in the **Seller Dashboard**, you **must** pass `scrollElementId="content-container"`:

```tsx
// In Seller Dashboard
<WindowScrollGrid
  data={ordersData}
  columns={ordersColumns}
  scrollElementId="content-container" // Required!
  virtualizeThreshold={50}
  rowHeight={40}
  onRowSelect={(rows) => console.log(rows)}
/>
```

**Why is this required?**

The Seller Dashboard has a custom architecture where:

- The entire app is rendered inside a `<div id="content-container">` element
- This `content-container` div is the scrollable element (has `overflow: auto`)
- The actual browser window itself does **not** scroll
- If you don't pass `scrollElementId="content-container"`, the virtualization won't detect scroll events correctly, and the table won't render rows as you scroll

**Key Principle:**  
`WindowScrollGrid` needs to know **which element is actually scrolling**:

- If the browser window scrolls → Don't pass `scrollElementId` (default behavior)
- If a custom container scrolls → Pass `scrollElementId="your-container-id"`

---

## Advanced Examples

### Sorting

```tsx
import { SortingState } from "@tanstack/react-table";

function SortableTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSortChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    // Optionally fetch sorted data from server
    console.log("Sort by:", newSorting);
  };

  return (
    <ContainerGrid
      data={data}
      columns={columns}
      maxHeight="600px"
      sortQuery={sorting}
      onSortChange={handleSortChange}
      onRowSelect={(rows) => console.log(rows)}
    />
  );
}
```

### Custom Cell Rendering

```tsx
import { CellContext } from "@tanstack/react-table";

function CustomCellTable() {
  const renderCell = (info: CellContext<User, unknown>) => {
    const columnId = info.column.id;
    const value = info.getValue();

    // Custom rendering based on column
    if (columnId === "status") {
      return (
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: value === "active" ? "#4caf50" : "#f44336",
            color: "white",
          }}
        >
          {String(value).toUpperCase()}
        </span>
      );
    }

    if (columnId === "email") {
      return <a href={`mailto:${value}`}>{String(value)}</a>;
    }

    return <>{value}</>;
  };

  return (
    <TableGrid
      data={data}
      columns={columns}
      renderCell={renderCell}
      onRowSelect={(rows) => console.log(rows)}
    />
  );
}
```

### Fixed Columns

```tsx
function TableWithFixedColumns() {
  return (
    <ContainerGrid
      data={data}
      columns={columns}
      maxHeight="600px"
      numberOfFixedColumns={2} // First 2 columns stay fixed during horizontal scroll
      onRowSelect={(rows) => console.log(rows)}
    />
  );
}
```

### Grouped Columns

```tsx
function GroupedColumnsTable() {
  const columns = [
    { id: "id", header: "ID", key: "id" },
    {
      id: "personal",
      header: "Personal Info",
      type: "group",
      columnsList: [
        { id: "firstName", header: "First Name", key: "firstName" },
        { id: "lastName", header: "Last Name", key: "lastName" },
      ],
    },
    {
      id: "contact",
      header: "Contact",
      type: "group",
      columnsList: [
        { id: "email", header: "Email", key: "email" },
        { id: "phone", header: "Phone", key: "phone" },
      ],
    },
  ];

  return <TableGrid data={data} columns={columns} onRowSelect={(rows) => console.log(rows)} />;
}
```

### Text Alignment

```tsx
function AlignedColumnsTable() {
  const columns = [
    {
      id: "name",
      header: "Name",
      key: "name",
      textAlignment: "left",
    },
    {
      id: "price",
      header: "Price",
      key: "price",
      textAlignment: "right",
    },
    {
      id: "quantity",
      header: "Quantity",
      key: "quantity",
      textAlignment: "center",
    },
  ];

  return <TableGrid data={data} columns={columns} onRowSelect={(rows) => console.log(rows)} />;
}
```

---

## Props Reference

### Common Props (All Components)

| Prop                   | Type                                             | Default            | Description                                            |
| ---------------------- | ------------------------------------------------ | ------------------ | ------------------------------------------------------ |
| `data`                 | `T[]`                                            | **Required**       | Array of data objects to display                       |
| `columns`              | `ColumnType<T>[]`                                | **Required**       | Column definitions                                     |
| `onRowSelect`          | `(rows: number[]) => void`                       | **Required**       | Callback when row selection changes                    |
| `fixedHeader`          | `boolean`                                        | `false`            | Enable sticky header                                   |
| `enableRowSelection`   | `boolean`                                        | `false`            | Show row selection checkboxes                          |
| `numberOfFixedColumns` | `number`                                         | `0`                | Number of left columns to fix during horizontal scroll |
| `sortQuery`            | `SortingState`                                   | `[]`               | Initial sort state                                     |
| `onSortChange`         | `(state: SortingState) => void`                  | `undefined`        | Callback for sort changes                              |
| `renderCell`           | `(info: CellContext<T, unknown>) => JSX.Element` | `undefined`        | Custom cell renderer                                   |
| `loading`              | `boolean`                                        | `false`            | Show loading state                                     |
| `error`                | `boolean`                                        | `false`            | Show error state                                       |
| `infoMessage`          | `IInfoMessage`                                   | -                  | Custom empty/error messages                            |
| `dataTestId`           | `string`                                         | `'grid-component'` | Test ID for automation                                 |

### TableGrid Specific Props

| Prop        | Type     | Default     | Description                                         |
| ----------- | -------- | ----------- | --------------------------------------------------- |
| `maxHeight` | `string` | `undefined` | Maximum height of table container (e.g., `'600px'`) |

### ContainerGrid Specific Props

| Prop                  | Type     | Default         | Description                                                     |
| --------------------- | -------- | --------------- | --------------------------------------------------------------- |
| `maxHeight`           | `string` | **Recommended** | Maximum height of table container - required for virtualization |
| `virtualizeThreshold` | `number` | `30`            | Minimum rows before virtualization activates                    |
| `rowHeight`           | `number` | `40`            | Estimated row height in pixels                                  |
| `overscan`            | `number` | `5`             | Extra rows to render above/below viewport                       |

### WindowScrollGrid Specific Props

| Prop                  | Type     | Default     | Description                                                                                                              |
| --------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `virtualizeThreshold` | `number` | `30`        | Minimum rows before virtualization activates                                                                             |
| `rowHeight`           | `number` | `40`        | Estimated row height in pixels                                                                                           |
| `overscan`            | `number` | `5`         | Extra rows to render above/below viewport                                                                                |
| `scrollElementId`     | `string` | `undefined` | ID of custom scroll container (uses window if not provided). **Required in Seller Dashboard: use `"content-container"`** |

### Column Definition

```typescript
interface ColumnType<T> {
  id: string; // Unique column identifier
  header: string | (() => Element); // Column header text or custom renderer
  key?: keyof T; // Data property key (for accessor columns)
  type?: "accessor" | "group"; // Column type
  isSortable?: boolean; // Enable sorting for this column
  textAlignment?: "left" | "center" | "right"; // Text alignment
  columnsList?: ColumnType<T>[]; // Sub-columns (for grouped columns)
  width?: number; // Column width
  shouldTruncate?: boolean; // Truncate overflow text
}
```

### Info Message

```typescript
interface IInfoMessage {
  emptyState?: string; // Message when no data
  errorState?: string; // Message on error
  userMessage?: string; // Additional context message
  buttonGroupProps?: ButtonGroupProps; // Action buttons
}
```

---

## Performance Tips

1. **Choose the Right Component**

   - Use `TableGrid` for < 30 rows
   - Use `ContainerGrid` for fixed-height containers
   - Use `WindowScrollGrid` for full-page tables

2. **Optimize Row Height**

   - Set `rowHeight` to match your actual row height
   - Accurate `rowHeight` prevents layout shifts

3. **Adjust Overscan**

   - Lower `overscan` for better performance
   - Higher `overscan` for smoother scrolling

4. **Memoize Data and Columns**

   ```tsx
   const columns = useMemo(() => [...], []);
   const data = useMemo(() => [...], [dependencies]);
   ```

5. **Custom Cell Rendering**
   - Use `renderCell` prop for complex cells
   - Memoize expensive render operations

---

## TypeScript Support

All components are fully typed with generics:

```tsx
interface Product {
  id: number;
  name: string;
  price: number;
}

// Type inference works automatically
<TableGrid<Product> data={products} columns={columns} onRowSelect={(rows) => console.log(rows)} />;
```

---

## Styling

Components use styled-components and integrate with the MURV theme system:

```tsx
import { MURVProvider } from "@murv/provider";

function App() {
  return (
    <MURVProvider theme={customTheme}>
      <TableGrid {...props} />
    </MURVProvider>
  );
}
```

---

## Migration Guide

### From TableGrid to ContainerGrid

```tsx
// Before
<TableGrid
  data={data}
  columns={columns}
  maxHeight="600px"
  onRowSelect={handleSelect}
/>

// After (with virtualization)
<ContainerGrid
  data={data}
  columns={columns}
  maxHeight="600px"
  virtualizeThreshold={30}
  rowHeight={40}
  onRowSelect={handleSelect}
/>
```

### From ContainerGrid to WindowScrollGrid

```tsx
// Before (container scroll)
<ContainerGrid
  data={data}
  columns={columns}
  maxHeight="600px"
  onRowSelect={handleSelect}
/>

// After (window scroll)
<WindowScrollGrid
  data={data}
  columns={columns}
  rowHeight={40}
  onRowSelect={handleSelect}
/>
```

---

## Troubleshooting

### Virtualization Not Working

**ContainerGrid:**

- Ensure `maxHeight` is set
- Check that data length exceeds `virtualizeThreshold`

**WindowScrollGrid:**

- Verify `scrollElementId` element exists in DOM
- Check browser console for warnings

### Layout Shifts During Scroll

- Set accurate `rowHeight` matching your actual row height
- Increase `overscan` value
- Ensure rows have consistent heights

### Performance Issues

- Reduce `overscan` value
- Memoize `data` and `columns`
- Simplify custom cell renderers
- Use `virtualizeThreshold` to delay virtualization

---

## License

MIT

---

## Support

For issues and questions, please contact the MURV team.
