import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "appointments"
  | "services"
  | "supplies"
  | "suppliers"
  | "clients"
  | "expenses"
  | "users"
  | "menu"
  | "close"
  | "chevronLeft"
  | "chevronRight"
  | "panelLeftClose"
  | "panelLeftOpen"
  | "plus"
  | "search"
  | "logout"
  | "alert"
  | "check"
  | "trash"
  | "edit"
  | "arrowRight"
  | "calendar"
  | "trendingUp"
  | "trendingDown"
  | "refresh"
  | "clock"
  | "box"
  | "sparkles"
  | "info"
  | "eye"
  | "eyeOff";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className, ...props }: IconProps) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="4" rx="1.5" />
        <rect x="14" y="10" width="7" height="11" rx="1.5" />
        <rect x="3" y="13" width="7" height="8" rx="1.5" />
      </>
    ),
    appointments: (
      <>
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    services: (
      <>
        <path d="M3.5 14.5 7 6.8a2 2 0 0 1 1.9-1.3h6.2A2 2 0 0 1 17 6.8l3.5 7.7" />
        <path d="M3.5 14.5c1.7 2.6 4.7 4 8.5 4s6.8-1.4 8.5-4" />
        <path d="M3.5 14.5h17M7.5 8.5l2 6M12 7v7.5M16.5 8.5l-2 6" />
      </>
    ),
    supplies: (
      <>
        <path d="M12 21V8" />
        <path d="M12 14c-2.5 0-4.5-2-4.5-4.5 2.5 0 4.5 2 4.5 4.5ZM12 14c2.5 0 4.5-2 4.5-4.5-2.5 0-4.5 2-4.5 4.5ZM12 9c-2.2 0-4-1.8-4-4 2.2 0 4 1.8 4 4ZM12 9c2.2 0 4-1.8 4-4-2.2 0-4 1.8-4 4Z" />
      </>
    ),
    suppliers: (
      <>
        <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    clients: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        <path d="M17 11a2.5 2.5 0 1 0 0-5M17 15c2.5.3 4 2 4 5" />
      </>
    ),
    expenses: (
      <>
        <path d="M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
        <path d="M3 9h16M16 14h2" />
        <path d="M7 6V5a2 2 0 0 1 2-2h7" />
      </>
    ),
    users: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
        <path d="M18.5 4.5 20 3M18.5 11.5 20 13M16 3v2" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    chevronLeft: <path d="M15 5 8 12l7 7" />,
    chevronRight: <path d="m9 5 7 7-7 7" />,
    panelLeftClose: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16M15.5 9 13 12l2.5 3" />
      </>
    ),
    panelLeftOpen: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16M13 9l2.5 3L13 15" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
        <path d="M15 8l4 4-4 4M19 12H9" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    check: <path d="m5 12 4.5 4.5L19 7" />,
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    trendingUp: (
      <>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </>
    ),
    trendingDown: (
      <>
        <path d="m3 7 6 6 4-4 8 8" />
        <path d="M15 17h6v-6" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 6.6" />
        <path d="M20 5v6h-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </>
    ),
    sparkles: (
      <>
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" />
        <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8Z" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M4 4l16 16" />
        <path d="M9.9 5.9A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-2.4 3.1M6.2 7.2A15.6 15.6 0 0 0 2.5 12S6 18.5 12 18.5c1 0 2-.2 2.8-.5" />
        <path d="M9.9 10.1a3 3 0 0 0 4 4" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
