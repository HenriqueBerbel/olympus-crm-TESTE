import React, { memo } from 'react';

// Wrapper padrão para todos os ícones, garantindo consistência, performance e estilo "vazado" (outline).
const IconWrapper = memo((props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    />
));
IconWrapper.displayName = 'IconWrapper';

// --- ÍCONES EM ORDEM ALFABÉTICA ---

export const ActivityIcon = memo((props) => <IconWrapper {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></IconWrapper>);
export const AlertTriangleIcon = memo((props) => <IconWrapper {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></IconWrapper>);
export const ArchiveIcon = memo((props) => <IconWrapper {...props}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></IconWrapper>);
export const ArrowDownRightIcon = memo((props) => <IconWrapper {...props}><line x1="7" y1="7" x2="17" y2="17"></line><polyline points="17 7 17 17 7 17"></polyline></IconWrapper>);
export const ArrowRightIcon = memo((props) => <IconWrapper {...props}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></IconWrapper>);
export const ArrowUpRightIcon = memo((props) => <IconWrapper {...props}><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></IconWrapper>);
export const AwardIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></IconWrapper>);
export const BellIcon = memo((props) => <IconWrapper {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></IconWrapper>);
export const BriefcaseIcon = memo((props) => <IconWrapper {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></IconWrapper>);
export const BuildingIcon = memo((props) => <IconWrapper {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="9" y2="9.01"></line><line x1="15" y1="9" x2="15" y2="9.01"></line><line x1="9" y1="15" x2="9" y2="15.01"></line><line x1="15" y1="15" x2="15" y2="15.01"></line></IconWrapper>);
export const CalendarIcon = memo((props) => <IconWrapper {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></IconWrapper>);
export const CameraIcon = memo((props) => <IconWrapper {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></IconWrapper>);
export const CheckCheckIcon = memo((props) => <IconWrapper {...props}><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></IconWrapper>);
export const CheckIcon = memo((props) => <IconWrapper {...props}><polyline points="20 6 9 17 4 12" /></IconWrapper>);
export const CheckSquareIcon = memo((props) => <IconWrapper {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></IconWrapper>);
export const ChevronDownIcon = memo((props) => <IconWrapper {...props}><polyline points="6 9 12 15 18 9" /></IconWrapper>);
export const ChevronLeftIcon = memo((props) => <IconWrapper {...props}><polyline points="15 18 9 12 15 6" /></IconWrapper>);
export const ChevronRightIcon = memo((props) => <IconWrapper {...props}><polyline points="9 18 15 12 9 6" /></IconWrapper>);
export const ClockIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></IconWrapper>);
export const CommandIcon = memo((props) => <IconWrapper {...props}><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></IconWrapper>);
export const CopyIcon = memo((props) => <IconWrapper {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></IconWrapper>);
export const DollarSignIcon = memo((props) => <IconWrapper {...props}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></IconWrapper>);
export const DownloadIcon = memo((props) => <IconWrapper {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></IconWrapper>);
export const EyeIcon = memo((props) => <IconWrapper {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></IconWrapper>);
export const EyeOffIcon = memo((props) => <IconWrapper {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></IconWrapper>);
export const FileTextIcon = memo((props) => <IconWrapper {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></IconWrapper>);
export const FilterIcon = memo((props) => <IconWrapper {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></IconWrapper>);
export const GlobeIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></IconWrapper>);
export const GripVerticalIcon = memo((props) => <IconWrapper {...props}><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></IconWrapper>);
export const HistoryIcon = memo((props) => <IconWrapper {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></IconWrapper>);
export const HomeIcon = memo((props) => <IconWrapper {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></IconWrapper>);
export const ImageIcon = memo((props) => <IconWrapper {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></IconWrapper>);
export const InfoIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></IconWrapper>);
export const LogInIcon = memo((props) => <IconWrapper {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></IconWrapper>);
export const LogOutIcon = memo((props) => <IconWrapper {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></IconWrapper>);
export const MailIcon = memo((props) => <IconWrapper {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></IconWrapper>);
export const MoonIcon = memo((props) => <IconWrapper {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></IconWrapper>);
export const PaletteIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 1 0 10 10"></path><path d="M12 12a5 5 0 1 0 5 5"></path><path d="M12 12a5 5 0 1 1 5-5"></path></IconWrapper>);
export const PencilIcon = memo((props) => <IconWrapper {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></IconWrapper>);
export const PercentIcon = memo((props) => <IconWrapper {...props}><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></IconWrapper>);
export const PlusCircleIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></IconWrapper>);
export const RefreshCwIcon = memo((props) => <IconWrapper {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M3 12a9 9 0 0 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></IconWrapper>);
export const SearchIcon = memo((props) => <IconWrapper {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></IconWrapper>);
export const Share2Icon = memo((props) => <IconWrapper {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></IconWrapper>);
export const ShieldCheckIcon = memo((props) => <IconWrapper {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></IconWrapper>);
export const SmartphoneIcon = memo((props) => <IconWrapper {...props}><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></IconWrapper>);
export const SparklesIcon = memo((props) => <IconWrapper {...props}><path d="M9.96 5.04a2.5 2.5 0 1 0-3.52 3.52" /><path d="M2.5 2.5 5 5" /><path d="M12 3a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1Z" /><path d="M21 12h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z" /><path d="M3 12H1a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2Z" /><path d="M12 21a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1Z" /><path d="m18.54 5.46-1.41-1.41a1 1 0 0 0-1.41 1.41l1.41 1.41a1 1 0 0 0 1.41-1.41Z" /><path d="m6.87 17.13-1.41-1.41a1 1 0 0 0-1.41 1.41l1.41 1.41a1 1 0 0 0 1.41-1.41Z" /><path d="m18.54 18.54-1.41 1.41a1 1 0 0 0 1.41 1.41l1.41-1.41a1 1 0 0 0-1.41-1.41Z" /><path d="m6.87 6.87-1.41 1.41a1 1 0 0 0 1.41 1.41l1.41-1.41a1 1 0 0 0-1.41-1.41Z" /></IconWrapper>);
export const SunIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></IconWrapper>);
export const TargetIcon = memo((props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></IconWrapper>);
export const Trash2Icon = memo((props) => <IconWrapper {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></IconWrapper>);
export const TrendingUpIcon = memo((props) => <IconWrapper {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></IconWrapper>);
export const UploadCloudIcon = memo((props) => <IconWrapper {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></IconWrapper>);
export const UserCircleIcon = memo((props) => <IconWrapper {...props}><path d="M18 20a6 6 0 0 0-12 0" /><circle cx="12" cy="10" r="4" /><circle cx="12" cy="12" r="10" /></IconWrapper>);
export const UsersIcon = memo((props) => <IconWrapper {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconWrapper>);
export const WhatsAppIcon = memo((props) => <IconWrapper {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></IconWrapper>); // **NOVO ÍCONE MELHORADO**
export const XIcon = memo((props) => <IconWrapper {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper>);
export const ZapIcon = memo((props) => <IconWrapper {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></IconWrapper>);