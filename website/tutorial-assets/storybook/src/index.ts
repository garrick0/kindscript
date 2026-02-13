
// Core Providers
export { ServiceProvider } from './core/providers/ServiceProvider';
export type { Services, ServiceProviderProps } from './core/providers/ServiceProvider';
export { QueryProvider } from './core/providers/QueryProvider';
export type { QueryProviderProps } from './core/providers/QueryProvider';

// Atoms
export { Button } from './components/atoms/Button/v1.0.0/Button';
export type { ButtonProps } from './components/atoms/Button/v1.0.0/Button';

export { Input } from './components/atoms/Input/v1.0.0/Input';
export type { InputProps } from './components/atoms/Input/v1.0.0/Input';

// Molecules
export { LoginButton, QuickLoginButton } from './components/molecules/LoginButton/v1.0.0/LoginButton';
export type { LoginButtonProps } from './components/molecules/LoginButton/v1.0.0/LoginButton';

export { GlobalSearch } from './components/molecules/GlobalSearch/v1.0.0/GlobalSearch';
export type { GlobalSearchProps, SearchResult } from './components/molecules/GlobalSearch/v1.0.0/GlobalSearch';

export { Sidebar, SidebarItem, SidebarSection } from './components/molecules/Sidebar/v1.0.0/Sidebar';
export type { SidebarProps, NavigationItem, SidebarItemProps, SidebarSectionProps } from './components/molecules/Sidebar/v1.0.0/Sidebar';

// Organisms - Document Manager (Re-export from actual components)
export * from './components/organisms/DocumentManager';

// Organisms - AI Assistant  
export * from './components/organisms/AIAssistant';

// Organisms - Studio (Re-export from actual components)
export * from './components/organisms/Studio';

// Organisms - Release Management
export * from './components/organisms/ReleasesList';
export * from './components/organisms/ReleaseFilters';
export * from './components/organisms/CreateReleaseForm';
export * from './components/organisms/ReleaseViewer';
export { ReleaseViewerById } from './components/organisms/ReleaseViewer/v1.0.0/ReleaseViewerById';
export * from './components/organisms/ReleasesManager';
export * from './components/organisms/CreateReleaseManager';

// Type exports (removed DocumentFilters - now comes from types/documents)

// Templates
// Templates directory doesn't exist yet
// export { PlatformLayout } from './components/templates/PlatformLayout/v1.0.0';
// export type { PlatformLayoutProps } from './components/templates/PlatformLayout/v1.0.0';

// Platform Components
import { PlatformLayout } from './components/organisms/PlatformLayout/v1.0.0/PlatformLayout';
export const PlatformShell = PlatformLayout; // Alias for compatibility
export { PlatformLayout } from './components/organisms/PlatformLayout/v1.0.0/PlatformLayout';
export type { PlatformLayoutProps } from './components/organisms/PlatformLayout/v1.0.0/PlatformLayout';

// Pages
export { ReleasesPage } from './components/Pages/ReleasesPage';
export type { ReleasesPageProps } from './components/Pages/ReleasesPage';

// Auth Pages
export { SignInPage } from './components/Pages/SignInPage';
export type { SignInPageProps } from './components/Pages/SignInPage';

export { SignOutPage } from './components/Pages/SignOutPage';
export type { SignOutPageProps } from './components/Pages/SignOutPage';

export { AuthErrorPage } from './components/Pages/AuthErrorPage';
export type { AuthErrorPageProps } from './components/Pages/AuthErrorPage';
export { DashboardPage } from './components/Pages/DashboardPage';
export type { DashboardPageProps } from './components/Pages/DashboardPage';
export { DocumentsPage } from './components/Pages/DocumentsPage';
export type { DocumentsPageProps } from './components/Pages/DocumentsPage';
export { SettingsPage } from './components/Pages/SettingsPage';
export type { SettingsPageProps } from './components/Pages/SettingsPage';
export { WorkflowsPage } from './components/Pages/WorkflowsPage';
export type { WorkflowsPageProps } from './components/Pages/WorkflowsPage';
export { PagesManagerPage } from './components/Pages/PagesManagerPage';
export type { PagesManagerPageProps } from './components/Pages/PagesManagerPage';
export { KnowledgePage } from './components/Pages/KnowledgePage';
export type { KnowledgePageProps } from './components/Pages/KnowledgePage';
export { StudioPage } from './components/Pages/StudioPage';
export type { StudioPageProps } from './components/Pages/StudioPage';

// Restored Pages (Module Management)
export { MigrationsPage } from './components/Pages/MigrationsPage';
export type { MigrationsPageProps } from './components/Pages/MigrationsPage';
export { DevInterfacePage } from './components/Pages/DevInterfacePage';
export type { DevInterfacePageProps } from './components/Pages/DevInterfacePage';
export { ModuleTypeEditorPage } from './components/Pages/ModuleTypeEditorPage';
export type { ModuleTypeEditorPageProps } from './components/Pages/ModuleTypeEditorPage';

// Additional Page Exports
export { HomePage } from './components/Pages/HomePage';

// Additional Provider exports (ServiceProvider already exported above)
export { useServices, useReleaseService, useDocumentService, useSettingsService } from './providers/ServiceProvider';

// Hooks
export { useReleases } from './components/organisms/ReleasesManager';
export { useFilters } from './components/organisms/ReleaseFilters';
export { useAuth } from './utils/hooks/useAuth';
export { useRouter } from './utils/hooks/useRouter';
export { useDashboard } from './components/Pages/DashboardPage';
export { useDocuments } from './components/organisms/DocumentManager';
export { useSettings } from './components/Pages/SettingsPage';

// Services (from colocated components)
export { ReleaseService } from './components/organisms/ReleasesManager';
// MockReleaseService not available
export { DashboardService } from './components/Pages/DashboardPage';
export { DocumentService } from './components/organisms/DocumentManager';
export { SettingsService } from './components/Pages/SettingsPage';

// Types (from colocated components)
export type { Release } from './components/organisms/ReleasesManager';
export type { DashboardData, DashboardStat, Activity, QuickAction, Notification } from './components/Pages/DashboardPage';
export type { Document } from './components/organisms/DocumentManager';

// Utils
export { cn } from './utils/cn';
