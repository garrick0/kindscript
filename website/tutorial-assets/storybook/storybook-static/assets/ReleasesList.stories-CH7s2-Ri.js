import{R as n}from"./ReleasesList-BkvzBm_B.js";import"./iframe-D5evrB1t.js";import"./preload-helper-D9Z9MdNV.js";import"./_interop_require_wildcard-DNKDR2gK.js";import"./file-text-BR3Iz2MY.js";import"./createLucideIcon-CYL-vWIR.js";import"./eye-BeouNTFJ.js";import"./users-CaUii9q0.js";import"./trash-2-CKY6oqXC.js";const f={title:"Design System/Organisms/ReleasesList",component:n,parameters:{layout:"padded",docs:{description:{component:"A component for displaying and managing a list of releases with filtering, pagination, and actions."}}},tags:["autodocs"],argTypes:{searchParams:{control:"object",description:"Search and filter parameters"},baseUrl:{control:"text",description:"Base URL for release links"}}},o={releases:[{id:"1",name:"MVP Wireframes",version:"1.0.0",status:"approved",page_count:24,created_at:"2024-01-15T10:00:00Z",created_by:"john.doe"},{id:"2",name:"Authentication Flow",version:"1.2.0",status:"review",page_count:8,created_at:"2024-01-20T14:30:00Z",created_by:"jane.smith"},{id:"3",name:"Dashboard Updates",version:"2.0.0",status:"draft",page_count:12,created_at:"2024-01-25T09:15:00Z",created_by:"mike.johnson"}],total:3,page:1,limit:10};typeof global<"u"&&(global.fetch=jest.fn(()=>Promise.resolve({ok:!0,json:()=>Promise.resolve(o)})));const e={args:{searchParams:{},baseUrl:"/releases"}},a={args:{searchParams:{status:"approved",page:"1"},baseUrl:"/releases"}},r={args:{searchParams:{}},parameters:{mockData:[{url:"/api/releases",method:"GET",status:200,delay:2e3,response:o}]}},s={args:{searchParams:{}},parameters:{mockData:[{url:"/api/releases",method:"GET",status:200,response:{releases:[],total:0,page:1,limit:10}}]}},t={args:{searchParams:{}},parameters:{mockData:[{url:"/api/releases",method:"GET",status:500,response:{error:"Internal server error"}}]}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {},
    baseUrl: '/releases'
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {
      status: 'approved',
      page: '1'
    },
    baseUrl: '/releases'
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {}
  },
  parameters: {
    mockData: [{
      url: '/api/releases',
      method: 'GET',
      status: 200,
      delay: 2000,
      response: mockApiResponse
    }]
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {}
  },
  parameters: {
    mockData: [{
      url: '/api/releases',
      method: 'GET',
      status: 200,
      response: {
        releases: [],
        total: 0,
        page: 1,
        limit: 10
      }
    }]
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {}
  },
  parameters: {
    mockData: [{
      url: '/api/releases',
      method: 'GET',
      status: 500,
      response: {
        error: 'Internal server error'
      }
    }]
  }
}`,...t.parameters?.docs?.source}}};const P=["Default","WithFilters","Loading","Empty","Error"];export{e as Default,s as Empty,t as Error,r as Loading,a as WithFilters,P as __namedExportsOrder,f as default};
