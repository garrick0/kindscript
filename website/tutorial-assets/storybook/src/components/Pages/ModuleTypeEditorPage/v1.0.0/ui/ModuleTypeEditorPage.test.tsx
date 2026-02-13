/**
 * ModuleTypeEditorPage Component Tests
 * 
 * Tests for the independent Module Type Editor page component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleTypeEditorPage } from './ModuleTypeEditorPage';
import { AllTheProviders } from '../../../../../test/utils';
import { MockModuleTypeEditorService } from '../data/module-type-editor.service.mock';

describe('ModuleTypeEditorPage', () => {
  it('should render the page with mock service', async () => {
    // Create a fresh instance for the test
    const mockService = new MockModuleTypeEditorService();
    
    render(
      <AllTheProviders>
        <ModuleTypeEditorPage service={mockService} />
      </AllTheProviders>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Module Type Editor')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should pass props correctly', async () => {
    const onCreateModuleType = vi.fn();
    const onUpdateModuleType = vi.fn();
    const onDeleteModuleType = vi.fn();
    const mockService = new MockModuleTypeEditorService();

    render(
      <AllTheProviders>
        <ModuleTypeEditorPage
          service={mockService}
          onCreateModuleType={onCreateModuleType}
          onUpdateModuleType={onUpdateModuleType}
          onDeleteModuleType={onDeleteModuleType}
        />
      </AllTheProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Module Type Editor')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});