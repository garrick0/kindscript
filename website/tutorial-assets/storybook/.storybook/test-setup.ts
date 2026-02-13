import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import * as projectAnnotations from './preview';

// Apply project annotations (like decorators, parameters)
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);