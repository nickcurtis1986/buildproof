type P = { className?: string; size?: number };
const base = (size = 22) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const HomeIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-9h6v9" /></svg>);
export const SearchIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><circle cx="11" cy="11" r="7.5" /><path d="m21 21-4.3-4.3" /></svg>);
export const BookmarkIcon = ({ size, className, filled }: P & { filled?: boolean }) => (<svg {...base(size)} className={className} fill={filled ? "currentColor" : "none"}><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>);
export const UserIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
export const ChartIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>);
export const HeartIcon = ({ size, className, filled }: P & { filled?: boolean }) => (<svg {...base(size)} className={className} fill={filled ? "currentColor" : "none"}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>);
export const ShareIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>);
export const PinIcon = ({ size = 14, className }: P) => (<svg {...base(size)} className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
export const MutedIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" /></svg>);
export const SoundIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>);
export const PlayIcon = ({ size = 28, className }: P) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}><path d="M7 4.5v15l13-7.5z" /></svg>);
export const CheckIcon = ({ size = 12, className }: P) => (<svg {...base(size)} strokeWidth={3} className={className}><path d="M20 6 9 17l-5-5" /></svg>);
export const ArrowLeftIcon = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>);
export const EyeIcon = ({ size = 14, className }: P) => (<svg {...base(size)} className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
