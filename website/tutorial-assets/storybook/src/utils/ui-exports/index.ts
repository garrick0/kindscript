// UI Component Re-exports for Wireframes
// Maps @/utils/ui-exports/* imports to the appropriate design-system components

// Re-export from atoms
export { Button } from '../../components/atoms/Button';
export type { ButtonProps } from '../../components/atoms/Button';
export { Badge } from '../../components/atoms/Badge';
export { Input } from '../../components/atoms/Input';
export { Progress } from '../../components/atoms/Progress';

// Re-export from molecules - Card components
export { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../components/molecules/Card';

// Re-export from molecules - Alert components
export { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '../../components/molecules/Alert';

// Re-export from molecules - Tabs components
export { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/molecules/Tabs';

// Create stub exports for components that don't exist yet
// These will be replaced with proper components later
export const Label = 'label' as any;
export const Dialog = 'div' as any;
export const DialogContent = 'div' as any;
export const DialogHeader = 'div' as any;
export const DialogTitle = 'h2' as any;
export const DropdownMenu = 'div' as any;
export const DropdownMenuContent = 'div' as any;
export const DropdownMenuItem = 'div' as any;
export const DropdownMenuTrigger = 'button' as any;
export const ScrollArea = 'div' as any;
export const Select = 'select' as any;
export const SelectContent = 'div' as any;
export const SelectItem = 'option' as any;
export const SelectTrigger = 'button' as any;
export const SelectValue = 'span' as any;
export const Table = 'table' as any;
export const TableBody = 'tbody' as any;
export const TableCell = 'td' as any;
export const TableHead = 'thead' as any;
export const TableHeader = 'th' as any;
export const TableRow = 'tr' as any;
export const Textarea = 'textarea' as any;
