export function IconBase({ size = 16, className = "", children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`svg-icon ${className}`.trim()}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconDownload({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </IconBase>
  );
}

export function IconPublish({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M22 2L11 13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </IconBase>
  );
}

export function IconSliders({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </IconBase>
  );
}

export function IconHistory({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <polyline points="12 7 12 12 15 15" />
    </IconBase>
  );
}

export function IconRotateCcw({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </IconBase>
  );
}

export function IconRefresh({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </IconBase>
  );
}

export function IconTrendingUp({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </IconBase>
  );
}

export function IconChevronDown({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <polyline points="6 9 12 15 18 9" />
    </IconBase>
  );
}

export function IconChevronUp({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <polyline points="18 15 12 9 6 15" />
    </IconBase>
  );
}

export function IconChevronRight({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <polyline points="9 18 15 12 9 6" />
    </IconBase>
  );
}

export function IconChevronLeft({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <polyline points="15 18 9 12 15 6" />
    </IconBase>
  );
}

export function IconCheck({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </IconBase>
  );
}

export function IconCheckCircle({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </IconBase>
  );
}

export function IconAlertTriangle({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconBase>
  );
}

export function IconMapPin({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </IconBase>
  );
}

export function IconDroplet({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </IconBase>
  );
}

export function IconX({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </IconBase>
  );
}

export function IconLoader({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={`icon-spin ${className}`.trim()}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </IconBase>
  );
}

export function IconArrowUp({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </IconBase>
  );
}

export function IconGrid({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  );
}

export function IconSettings({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.9a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3.1a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9.2a1.7 1.7 0 0 0 1-1.55V3.1a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9.2a1.7 1.7 0 0 0 1.55 1H20.9a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
    </IconBase>
  );
}

export function IconDistribution({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="4" r="1.6" />
      <circle cx="5" cy="19" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
      <circle cx="19" cy="19" r="1.6" />
      <path d="M12 5.6V12M12 12L5 17.4M12 12v5.4M12 12l7 5.4" />
    </IconBase>
  );
}

export function IconSun({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </IconBase>
  );
}

export function IconMoon({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </IconBase>
  );
}

export function IconLogOut({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}

export function IconPanelLeftClose({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <polyline points="14 9 11 12 14 15" />
    </IconBase>
  );
}

export function IconPanelLeftOpen({ size = 16, className = "" }) {
  return (
    <IconBase size={size} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <polyline points="12 9 15 12 12 15" />
    </IconBase>
  );
}
