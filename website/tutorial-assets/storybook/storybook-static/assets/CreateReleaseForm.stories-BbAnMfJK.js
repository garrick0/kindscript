import{C as d}from"./CreateReleaseForm-CP1v7XvE.js";import"./iframe-D5evrB1t.js";import"./preload-helper-D9Z9MdNV.js";import"./search-DrQCx2FU.js";import"./createLucideIcon-CYL-vWIR.js";import"./file-text-BR3Iz2MY.js";const e=c=>()=>console.log("Action:",c),P={title:"Design System/Organisms/Release Management/CreateReleaseForm",component:d,parameters:{layout:"padded",docs:{description:{component:"A comprehensive form for creating new releases with page selection, validation, and submission."}}},tags:["autodocs"],argTypes:{onSubmit:{action:"submitted",description:"Called when the form is submitted with valid data"},onCancel:{action:"cancelled",description:"Called when the user cancels the form"},loadAvailablePages:{description:"Function to load available pages for selection"},isLoading:{control:"boolean",description:"Whether the form is in a loading state"}}},l=[{id:"login",title:"Login Page",description:"User authentication login form",priority:"P0",section:"AUTH",latest_version:"v1",available_versions:["v1"]},{id:"signup",title:"Sign Up Page",description:"User registration form",priority:"P0",section:"AUTH",latest_version:"v1",available_versions:["v1"]},{id:"dashboard",title:"Dashboard",description:"Main application dashboard",priority:"P0",section:"HOME",latest_version:"v2",available_versions:["v1","v2"]},{id:"upload",title:"File Upload",description:"Document upload interface",priority:"P1",section:"DATA",latest_version:"v1",available_versions:["v1"]},{id:"processing-status",title:"Processing Status",description:"Shows processing progress",priority:"P1",section:"DATA",latest_version:"v1",available_versions:["v1"]},{id:"projects-list",title:"Projects List",description:"Display all user projects",priority:"P1",section:"PROJECTS",latest_version:"v1",available_versions:["v1"]},{id:"code-preview",title:"Code Preview",description:"Preview generated code",priority:"P2",section:"PROJECTS",latest_version:"v1",available_versions:["v1"]},{id:"error",title:"Error Page",description:"Error handling and display",priority:"P2",section:"SYSTEM",latest_version:"v1",available_versions:["v1"]}],t=()=>Promise.resolve(l),a={args:{onSubmit:e("form-submitted"),onCancel:e("form-cancelled"),loadAvailablePages:t,isLoading:!1}},o={args:{onSubmit:e("form-submitted"),onCancel:e("form-cancelled"),loadAvailablePages:t,isLoading:!0}},i={args:{onSubmit:e("form-submitted"),onCancel:e("form-cancelled"),loadAvailablePages:()=>Promise.resolve(l.slice(0,3)),isLoading:!1}},s={args:{onSubmit:e("form-submitted"),onCancel:e("form-cancelled"),loadAvailablePages:()=>Promise.resolve([]),isLoading:!1}},r={args:{onSubmit:e("form-submitted"),onCancel:e("form-cancelled"),loadAvailablePages:()=>Promise.reject(new Error("Failed to load pages")),isLoading:!1}},n={args:{onSubmit:()=>Promise.reject(new Error("Submission failed")),onCancel:e("form-cancelled"),loadAvailablePages:t,isLoading:!1}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: mockLoadAvailablePages,
    isLoading: false
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: mockLoadAvailablePages,
    isLoading: true
  }
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: () => Promise.resolve(mockAvailablePages.slice(0, 3)),
    isLoading: false
  }
}`,...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: () => Promise.resolve([]),
    isLoading: false
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: () => Promise.reject(new Error('Failed to load pages')),
    isLoading: false
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    onSubmit: () => Promise.reject(new Error('Submission failed')),
    onCancel: action('form-cancelled'),
    loadAvailablePages: mockLoadAvailablePages,
    isLoading: false
  }
}`,...n.parameters?.docs?.source}}};const f=["Default","Loading","WithLimitedPages","EmptyPages","LoadingError","SubmissionError"];export{a as Default,s as EmptyPages,o as Loading,r as LoadingError,n as SubmissionError,i as WithLimitedPages,f as __namedExportsOrder,P as default};
