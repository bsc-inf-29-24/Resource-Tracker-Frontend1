/**
 * Icon set for Resource Tracker.
 * Hand-drawn outline SVGs matching the icons in the design (2px rounded stroke, currentColor).
 * To use the exact Figma icons: export each as SVG and paste the <path> data over the ones below,
 * keeping the same export name so no other file has to change.
 */
const Svg = ({ children, size = 24, title, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    {...rest}
  >
    {children}
  </svg>
);

export const HomeIcon = (p) => (
  <Svg {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /></Svg>
);
export const DashboardIcon = (p) => (
  <Svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.2" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.2" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.2" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.2" /></Svg>
);
export const RequestIcon = (p) => (
  <Svg {...p}><path d="M14 3.5H6.5a1.5 1.5 0 0 0-1.5 1.5v14a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V10" /><path d="M8 9h4M8 13h3M8 17h5" /><path d="m13.5 13.5 6-6 2 2-6 6-2.6.6z" /></Svg>
);
export const TeamIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="7" r="3" /><circle cx="5" cy="10" r="2.2" /><circle cx="19" cy="10" r="2.2" /><path d="M6.5 20v-2.5A3.5 3.5 0 0 1 10 14h4a3.5 3.5 0 0 1 3.5 3.5V20z" /><path d="M2.5 18.5v-1.2A2.3 2.3 0 0 1 4.8 15M21.5 18.5v-1.2a2.3 2.3 0 0 0-2.3-2.3" /></Svg>
);
export const ReportIcon = (p) => (
  <Svg {...p}><rect x="4.5" y="3.5" width="15" height="17" rx="1.5" /><circle cx="9.5" cy="9" r="1.6" /><path d="M7 14h10M7 17.5h7M13 8h4M13 10.5h3" /></Svg>
);
export const ProfileIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.6-4 3.6-6.2 7.5-6.2s6.9 2.2 7.5 6.2" /></Svg>
);
export const SettingsIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /><circle cx="12" cy="12" r="6.8" /></Svg>
);
export const LogoutIcon = (p) => (
  <Svg {...p}><path d="M10 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H10" /><path d="M10 12h10M16.5 8 20.5 12l-4 4" /></Svg>
);
export const BellIcon = (p) => (
  <Svg {...p}><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" /></Svg>
);
export const SearchIcon = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Svg>
);
export const ResetIcon = (p) => (
  <Svg {...p}><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v4.5h-4.5" /></Svg>
);
export const ChevronRightIcon = (p) => (<Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>);
export const ChevronLeftIcon = (p) => (<Svg {...p}><path d="m15 5-7 7 7 7" /></Svg>);
export const ChevronDownIcon = (p) => (<Svg {...p}><path d="m5 9 7 7 7-7" /></Svg>);
export const PlusIcon = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const CheckIcon = (p) => (<Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>);
export const AlertIcon = (p) => (
  <Svg {...p}><path d="M12 3.5 21.5 20h-19z" /><path d="M12 10v4.5M12 17.5v.01" /></Svg>
);
export const EmptyBoxIcon = (p) => (
  <Svg {...p}><path d="M3.5 13 6 5.5h12L20.5 13" /><path d="M3.5 13v6h17v-6h-5l-1.5 2.5h-4L8.5 13z" /></Svg>
);
