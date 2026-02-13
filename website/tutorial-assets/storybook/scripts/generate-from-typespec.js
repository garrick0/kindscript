#!/usr/bin/env node

/**
 * TypeSpec to MSW Code Generator
 * 
 * This script generates TypeScript types, MSW handlers, and mock data factories
 * from the compiled TypeSpec OpenAPI specification.
 */

const fs = require('fs');
const path = require('path');

class TypeSpecToMSWGenerator {
  constructor(openApiPath) {
    const content = fs.readFileSync(openApiPath, 'utf-8');
    this.openApiSpec = JSON.parse(content);
    this.generatedDir = './src/mocks/generated';
  }

  generate() {
    console.log('🚀 Generating MSW handlers from TypeSpec...\n');

    // Ensure output directory exists
    this.ensureDirectory(this.generatedDir);

    // Generate all artifacts
    const types = this.generateTypes();
    const handlers = this.generateHandlers();
    const factories = this.generateFactories();

    // Write files
    this.writeFile(`${this.generatedDir}/types.ts`, types);
    this.writeFile(`${this.generatedDir}/handlers.ts`, handlers);
    this.writeFile(`${this.generatedDir}/factories.ts`, factories);

    console.log('✅ Generated MSW artifacts:');
    console.log(`   - Types: ${this.generatedDir}/types.ts`);
    console.log(`   - Handlers: ${this.generatedDir}/handlers.ts`);
    console.log(`   - Factories: ${this.generatedDir}/factories.ts\n`);

    return { types, handlers, factories };
  }

  generateTypes() {
    const schemas = this.openApiSpec.components?.schemas || {};
    let output = `// Generated TypeScript types from TypeSpec
// Do not edit manually - regenerate using npm run typespec:generate

`;

    // Generate model interfaces
    for (const [name, schema] of Object.entries(schemas)) {
      if (this.isObjectSchema(schema)) {
        output += this.generateInterface(name, schema);
        output += '\n';
      }
    }

    return output;
  }

  generateInterface(name, schema) {
    let output = `export interface ${name} {\n`;
    
    const properties = schema.properties || {};
    const required = schema.required || [];

    for (const [propName, propSchema] of Object.entries(properties)) {
      const isRequired = required.includes(propName);
      const propType = this.getTypeScriptType(propSchema);
      output += `  ${propName}${isRequired ? '' : '?'}: ${propType};\n`;
    }

    output += '}\n';
    return output;
  }

  generateHandlers() {
    const paths = this.openApiSpec.paths || {};
    
    let output = `// Generated MSW handlers from TypeSpec
// Do not edit manually - regenerate using npm run typespec:generate

import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import * as factories from './factories';
import type * as Types from './types';

export const handlers = [
`;

    // Generate handlers for each path/method combination
    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;

      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      
      for (const method of methods) {
        const operation = pathItem[method];
        if (!operation) continue;

        const handler = this.generateHandler(path, method, operation);
        output += handler;
      }
    }

    output += `];
`;

    return output;
  }

  generateHandler(path, method, operation) {
    const pathPattern = this.convertPathToMSW(path);
    const operationId = operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const responseSchema = this.getResponseSchema(operation);
    
    let handler = `  // ${operation.summary || operationId}\n`;
    handler += `  http.${method}('${pathPattern}', (`;
    
    // Add parameters if needed
    const hasPathParams = path.includes('{');
    const hasBody = method !== 'get' && method !== 'delete';
    
    const params = [];
    if (hasPathParams) params.push('params');
    if (hasBody) params.push('request');
    
    if (params.length > 0) {
      handler += `{ ${params.join(', ')} }`;
    }
    
    handler += `) => {\n`;
    
    // Generate response logic
    if (responseSchema) {
      const mockDataGeneration = this.generateMockDataForSchema(responseSchema);
      handler += `    const responseData = ${mockDataGeneration};\n`;
      handler += `    return HttpResponse.json(responseData);\n`;
    } else {
      if (method === 'delete') {
        handler += `    return new HttpResponse(null, { status: 204 });\n`;
      } else {
        handler += `    return HttpResponse.json({ message: 'Success' });\n`;
      }
    }
    
    handler += `  }),\n\n`;
    
    return handler;
  }

  generateFactories() {
    const schemas = this.openApiSpec.components?.schemas || {};
    
    let output = `// Generated mock data factories from TypeSpec
// Do not edit manually - regenerate using npm run typespec:generate

import { faker } from '@faker-js/faker';
import type * as Types from './types';

`;

    // Generate factory for each model
    for (const [name, schema] of Object.entries(schemas)) {
      if (this.isObjectSchema(schema)) {
        output += this.generateFactory(name, schema);
        output += '\n';
      }
    }

    return output;
  }

  generateFactory(name, schema) {
    const properties = schema.properties || {};
    
    let output = `export function create${name}(overrides = {}) {\n`;
    output += `  return {\n`;
    
    for (const [propName, propSchema] of Object.entries(properties)) {
      const mockValue = this.generateMockValueForProperty(propName, propSchema);
      output += `    ${propName}: ${mockValue},\n`;
    }
    
    output += `    ...overrides,\n`;
    output += `  };\n`;
    output += `}\n`;
    
    return output;
  }

  // Utility methods
  isObjectSchema(schema) {
    return schema && typeof schema === 'object' && schema.type === 'object';
  }

  getTypeScriptType(schema) {
    if (!schema || typeof schema !== 'object') return 'unknown';
    
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return schema.enum.map(v => `"${v}"`).join(' | ');
        }
        if (schema.format === 'date-time') return 'string'; // ISO date string
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        const itemType = this.getTypeScriptType(schema.items);
        return `${itemType}[]`;
      case 'object':
        if (schema.additionalProperties) {
          return 'Record<string, unknown>';
        }
        return 'object';
      default:
        if (schema.$ref) {
          const refName = schema.$ref.split('/').pop();
          return refName || 'unknown';
        }
        return 'unknown';
    }
  }

  convertPathToMSW(path) {
    // Convert OpenAPI path parameters to MSW format
    // OpenAPI: /api/documents/{id} -> MSW: /api/documents/:id
    return path.replace(/\{([^}]+)\}/g, ':$1');
  }

  getResponseSchema(operation) {
    const responses = operation.responses;
    const successResponse = responses['200'] || responses['201'];
    
    if (!successResponse || typeof successResponse === 'string') return null;
    
    const content = successResponse.content && successResponse.content['application/json'];
    return content?.schema;
  }

  generateMockDataForSchema(schema) {
    if (!schema) return 'null';
    
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      return `factories.create${refName}()`;
    }
    
    if (schema.type === 'array') {
      const itemGeneration = this.generateMockDataForSchema(schema.items);
      return `Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ${itemGeneration})`;
    }
    
    // For primitive types or complex objects without $ref
    return 'null';
  }

  generateMockValueForProperty(propName, schema) {
    if (!schema || typeof schema !== 'object') {
      return 'faker.lorem.word()';
    }
    
    // Handle specific property names
    if (propName === 'id') return 'faker.string.uuid()';
    if (propName === 'name') return 'faker.company.name()';
    if (propName === 'title') return 'faker.lorem.sentence()';
    if (propName === 'description') return 'faker.lorem.paragraph()';
    if (propName === 'content') return 'faker.lorem.paragraphs(3)';
    if (propName === 'createdAt' || propName === 'updatedAt') return 'faker.date.recent().toISOString()';
    if (propName === 'email') return 'faker.internet.email()';
    if (propName === 'version') return 'faker.system.semver()';
    if (propName === 'userId' || propName === 'author') return 'faker.string.uuid()';
    if (propName === 'versionNumber') return 'faker.number.int({ min: 1, max: 10 })';
    if (propName === 'isActive') return 'faker.datatype.boolean()';
    if (propName === 'token') return 'faker.string.alphanumeric(64)';
    if (propName === 'expiresIn') return '3600';
    
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return `faker.helpers.arrayElement(${JSON.stringify(schema.enum)})`;
        }
        if (schema.format === 'date-time') {
          return 'faker.date.recent().toISOString()';
        }
        return 'faker.lorem.word()';
      case 'number':
      case 'integer':
        return 'faker.number.int({ min: 1, max: 100 })';
      case 'boolean':
        return 'faker.datatype.boolean()';
      case 'array':
        return '[]';
      case 'object':
        return '{}';
      default:
        return 'null';
    }
  }

  ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    this.ensureDirectory(dir);
    fs.writeFileSync(filePath, content);
  }
}

// Main execution
async function main() {
  const openApiPath = './typespec/generated/openapi.json';
  
  if (!fs.existsSync(openApiPath)) {
    console.error('❌ OpenAPI specification not found. Please run TypeSpec compilation first.');
    console.error('   Run: npm run typespec:compile');
    process.exit(1);
  }
  
  const generator = new TypeSpecToMSWGenerator(openApiPath);
  generator.generate();
  
  console.log('🎉 MSW generation complete!');
  console.log('\nNext steps:');
  console.log('1. Review generated files in src/mocks/generated/');
  console.log('2. Update MSW setup to use generated handlers');
  console.log('3. Test with Storybook');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TypeSpecToMSWGenerator };