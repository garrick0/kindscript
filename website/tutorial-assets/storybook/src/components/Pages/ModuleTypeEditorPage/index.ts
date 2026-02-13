/**
 * ModuleTypeEditorPage exports
 * 
 * Main exports for the independent Module Type Editor page component.
 */

export { ModuleTypeEditorPage } from './v1.0.0/ui/ModuleTypeEditorPage';
export type { ModuleTypeEditorPageProps } from './v1.0.0/types/module-type-editor.types';

// Domain exports
export { useModuleTypeEditor } from './v1.0.0/domain/useModuleTypeEditor';
export type { 
  ModuleTypeFormData,
  EditorMode,
  EditorTab,
  ModuleTypeEditorState,
  ModuleTypeEditorActions,
  ValidationResult,
  DiscoveryTestResult,
  AssertionTestResult
} from './v1.0.0/types/module-type-editor.types';

// Service exports
export { moduleTypeEditorService } from './v1.0.0/data/module-type-editor.service';