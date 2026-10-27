# Resource Tracker – shared components

Copy this folder into `src/assets/components/` (or wherever your repo keeps shared UI) and import from the index:

```jsx
import { DataTable, StatusTag, StatusCard, ConfirmModal, PageHeader } from '../assets/components';
```

- `styles/theme.css` – Montserrat + all colour/spacing tokens (change a colour here and every component follows).
- `icons/Icons.jsx` – outline icons. To use the exact icons from Figma, export them as SVG and paste the path data over the matching icon (same export name).
- `ExampleUsage.jsx` – Dashboard and Create Resource Request screens built only from these components.

| Component | File |
|---|---|
| Button, PageHeader, Breadcrumb | layout/ |
| StatusTag | status/ |
| StatusCard | cards/ |
| DataTable, Pagination | tables/ |
| ConfirmModal | dialogs/ |
| FormSection, TextInput, SelectInput, TextArea, DateSelect, FormActions | forms/ |
| FilterToolbar | filters/ |
| LoadingState, Skeleton, Spinner, EmptyState, ErrorMessage, InlineError | feedback/ |
