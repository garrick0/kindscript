import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { 
  FileText, 
  Package, 
  GitBranch, 
  FileCode,
  Workflow,
  Brain,
  Settings,
  Layers,
  Home,
  Users,
  Shield,
  Database
} from 'lucide-react';
import { Sidebar, SidebarItem, SidebarSection } from './Sidebar';

const meta = {
  title: 'Design System/Molecules/Sidebar/v1.0.0',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <Story />
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f3f4f6' }}>
          <h2>Main Content Area</h2>
          <p>The sidebar controls navigation in this area.</p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Releases', href: '/releases', icon: Package },
  { name: 'Pages', href: '/pages', icon: FileCode },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Knowledge Graph', href: '/knowledge', icon: Brain },
  { name: 'Studio', href: '/studio', icon: GitBranch },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [activeHref, setActiveHref] = useState('/dashboard');

    return (
      <Sidebar
        open={open}
        onToggle={() => setOpen(!open)}
        navigation={defaultNavigation}
        activeHref={activeHref}
        onNavigate={(item) => {
          console.log('Navigate to:', item);
          setActiveHref(item.href);
        }}
      />
    );
  },
};

export const Collapsed: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [activeHref, setActiveHref] = useState('/documents');

    return (
      <Sidebar
        open={open}
        onToggle={() => setOpen(!open)}
        navigation={defaultNavigation}
        activeHref={activeHref}
        onNavigate={(item) => {
          console.log('Navigate to:', item);
          setActiveHref(item.href);
        }}
      />
    );
  },
};

export const CustomTitle: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <Sidebar
        open={open}
        onToggle={() => setOpen(!open)}
        navigation={defaultNavigation}
        activeHref="/pages"
        title="My Platform"
        onNavigate={(item) => console.log('Navigate to:', item)}
      />
    );
  },
};

export const WithLogo: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <Sidebar
        open={open}
        onToggle={() => setOpen(!open)}
        navigation={defaultNavigation}
        activeHref="/studio"
        logo={
          <div className="flex items-center gap-2">
            <Layers className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold">Studio</span>
          </div>
        }
        onNavigate={(item) => console.log('Navigate to:', item)}
      />
    );
  },
};

export const SimpleNavigation: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const simpleNav = [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Security', href: '/security', icon: Shield },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
      <Sidebar
        open={open}
        onToggle={() => setOpen(!open)}
        navigation={simpleNav}
        activeHref="/users"
        onNavigate={(item) => console.log('Navigate to:', item)}
      />
    );
  },
};

// Story showing individual sidebar items
export const IndividualItems: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [activeItem, setActiveItem] = useState('dashboard');

    return (
      <div className="bg-gray-900 text-white w-64 h-screen p-4">
        <h3 className="text-lg font-bold mb-4">Individual Items</h3>
        <div className="space-y-2">
          <SidebarItem
            icon={Home}
            label="Dashboard"
            active={activeItem === 'dashboard'}
            onClick={() => setActiveItem('dashboard')}
            open={open}
          />
          <SidebarItem
            icon={FileText}
            label="Documents"
            active={activeItem === 'documents'}
            onClick={() => setActiveItem('documents')}
            open={open}
          />
          <SidebarItem
            icon={Database}
            label="Database"
            active={activeItem === 'database'}
            onClick={() => setActiveItem('database')}
            open={open}
          />
        </div>
      </div>
    );
  },
};

// Story showing sidebar sections
export const WithSections: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="bg-gray-900 text-white w-64 h-screen">
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <span className="text-xl font-bold">Platform</span>
        </div>
        
        <SidebarSection title="Main" open={open}>
          <SidebarItem icon={Home} label="Dashboard" open={open} />
          <SidebarItem icon={FileText} label="Documents" open={open} />
        </SidebarSection>

        <SidebarSection title="Development" open={open} collapsible defaultExpanded={true}>
          <SidebarItem icon={GitBranch} label="Branches" open={open} />
          <SidebarItem icon={Package} label="Packages" open={open} />
          <SidebarItem icon={Workflow} label="Workflows" open={open} />
        </SidebarSection>

        <SidebarSection title="Admin" open={open} collapsible defaultExpanded={false}>
          <SidebarItem icon={Users} label="Users" open={open} />
          <SidebarItem icon={Shield} label="Security" open={open} />
          <SidebarItem icon={Settings} label="Settings" open={open} />
        </SidebarSection>
      </div>
    );
  },
};