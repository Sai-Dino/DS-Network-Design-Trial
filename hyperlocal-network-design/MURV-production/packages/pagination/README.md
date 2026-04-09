# Pagination Component

This package contains the code for creating a pagination component as part of the MURV library. This document has the following sections:

- [Usage](#usage)
- [Props](#props)
- [Example](#example)
- [Links](#links)

## Usage

Pagination component allows users to navigate through large sets of data by providing options to change the current page and adjust the number of items displayed per page.

```tsx
import React from "react";
import { Pagination } from "@murv/pagination";

const MyComponent: React.FC = () => {
  return (
    <div>
      <h1>My Data</h1>
      <Pagination
        currentPage={1}
        totalItems={1000}
        onPageChange={(page, pageSize) => {
          console.log("Page changed:", page);
        }}
        pageSize={10}
        options={[
          { label: "10", value: 10 },
          { label: "20", value: 20 },
          { label: "50", value: 50 },
        ]}
        onChange={(newPageSize) => {
          console.log("Page size changed:", newPageSize);
        }}
        name="page-selector"
      />
    </div>
  );
};

export default MyComponent;
```

### Props

#### IPaginationProps

Represents the properties for the pagination component.

- `currentPage`: The current page number.
- `totalItems`: The total number of items to be paginated.
- `onPageChange` (optional): A function to be called when the page is changed. It receives the new page number and the number of items to display per page.
- `pageSize`: The number of items to display per page.
- `options` (optional): An array of objects representing the available page size options, each containing a label and a value.
- `onChange` (optional): A function to be called when the page size is changed. It receives the new page size value.
- `name` (optional): A name prop to ensure unique PageSize selection for multiple Pagination components on the same page.

#### PageSizeSelectorProps

Represents the properties for the page size selector component.

- `options`: An array of objects representing the available page size options, each containing a label and a value.
- `selectedPageSize`: The currently selected page size.
- `onChange`: A function to be called when the page size is changed. It receives the new page size value.
- `name` (optional): A name prop to ensure unique PageSize selection for multiple Pagination components on the same page.
