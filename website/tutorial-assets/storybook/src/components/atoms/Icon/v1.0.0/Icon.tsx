import React from 'react';
import { 
  // Basic UI icons
  User, Settings, Home, Bell, Search, Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Plus, Minus, Edit, Trash2, Save, Download, Upload, RefreshCw, ExternalLink, Eye, EyeOff,
  // Navigation
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, MoreHorizontal, MoreVertical,
  // Status & feedback
  Check, AlertCircle, AlertTriangle, Info, XCircle, CheckCircle, HelpCircle,
  // Data & content
  File, FileText, Folder, FolderOpen, Image, Database, Calendar, Clock, Mail,
  // Business/analytics
  BarChart3, PieChart, TrendingUp, TrendingDown, Target, Zap, Star, Heart,
  // Tools & actions
  Copy, Share2, Filter, Grid3X3, List, Map, LayoutGrid, Maximize, Minimize,
  // Communication
  MessageSquare, Phone, Users, UserPlus, LogOut, LogIn,
  // Media
  Play, Pause, Square, Volume2, VolumeX, Camera, Video,
  // Technical
  Code, Terminal, Server, Cpu, HardDrive, Wifi, WifiOff, Lock, Unlock,
  type LucideIcon,
  type LucideProps
} from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../common/utils/cn';

// Icon registry for easy access
export const iconRegistry = {
  // Basic UI
  user: User,
  settings: Settings,
  home: Home,
  bell: Bell,
  search: Search,
  menu: Menu,
  close: X,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  plus: Plus,
  minus: Minus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  'external-link': ExternalLink,
  eye: Eye,
  'eye-off': EyeOff,

  // Navigation
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,

  // Status & feedback
  check: Check,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  info: Info,
  error: XCircle,
  success: CheckCircle,
  help: HelpCircle,

  // Data & content
  file: File,
  'file-text': FileText,
  folder: Folder,
  'folder-open': FolderOpen,
  image: Image,
  database: Database,
  calendar: Calendar,
  clock: Clock,
  mail: Mail,

  // Business/analytics
  'bar-chart': BarChart3,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  target: Target,
  zap: Zap,
  star: Star,
  heart: Heart,

  // Tools & actions
  copy: Copy,
  share: Share2,
  filter: Filter,
  sort: Filter,
  grid: Grid3X3,
  list: List,
  map: Map,
  layout: LayoutGrid,
  maximize: Maximize,
  minimize: Minimize,

  // Communication
  message: MessageSquare,
  phone: Phone,
  users: Users,
  'user-plus': UserPlus,
  logout: LogOut,
  login: LogIn,

  // Media
  play: Play,
  pause: Pause,
  stop: Square,
  volume: Volume2,
  'volume-off': VolumeX,
  camera: Camera,
  video: Video,

  // Technical
  code: Code,
  terminal: Terminal,
  server: Server,
  cpu: Cpu,
  'hard-drive': HardDrive,
  wifi: Wifi,
  'wifi-off': WifiOff,
  lock: Lock,
  unlock: Unlock,
} as const;

export type IconName = keyof typeof iconRegistry;

const iconVariants = cva(
  'shrink-0', // Base styles
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
        '2xl': 'h-10 w-10',
      },
      color: {
        default: 'text-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
        success: 'text-green-600',
        warning: 'text-amber-600',
        info: 'text-blue-600',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'default',
    },
  }
);

export interface IconProps extends Omit<LucideProps, 'ref' | 'color' | 'size'>, VariantProps<typeof iconVariants> {
  /**
   * Icon name from the registry
   */
  name: IconName;
  /**
   * Alternative to name - pass a Lucide icon component directly
   */
  icon?: LucideIcon;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Icon component using Lucide React icons with consistent sizing and theming
 * 
 * @example
 * ```tsx
 * <Icon name="user" size="lg" color="primary" />
 * <Icon name="check" size="sm" color="success" />
 * <Icon icon={CustomIcon} size="md" />
 * ```
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, icon, size, color, className, ...props }, ref) => {
    // Use provided icon or look up from registry
    const IconComponent = icon || iconRegistry[name];
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in registry`);
      return <span className={cn(iconVariants({ size }), className)}>?</span>;
    }

    return (
      <IconComponent
        ref={ref}
        className={cn(iconVariants({ size, color }), className)}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

// Export icon registry for external use
export { iconRegistry as icons };

// Helper function to check if an icon exists
export const hasIcon = (name: string): name is IconName => {
  return name in iconRegistry;
};

// Helper function to get all available icon names
export const getIconNames = (): IconName[] => {
  return Object.keys(iconRegistry) as IconName[];
};