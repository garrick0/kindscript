import{j as C}from"./iframe-D5evrB1t.js";import{n as A}from"./navigation-B4QW0cIQ.js";import{C as h}from"./CreateReleaseForm-CP1v7XvE.js";import"./preload-helper-D9Z9MdNV.js";import"./_interop_require_wildcard-DNKDR2gK.js";import"./search-DrQCx2FU.js";import"./createLucideIcon-CYL-vWIR.js";import"./file-text-BR3Iz2MY.js";function m({apiEndpoint:i="/api/releases",baseUrl:l="/releases",loadAvailablePages:p,onSubmit:u,onCancel:g}){const d=A.useRouter(),v=u||(async e=>{const a=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!a.ok){const y=await a.json();throw new Error(y.error||"Failed to create release")}const s=await a.json();d.push(`${l}/${s.id}`)}),b=g||(()=>{d.back()}),P=p||(async()=>["login","signup","password-reset","dashboard","upload","processing-status","projects-list","code-preview","prd-preview","conflict-resolution","consolidation-review","wireframe-explorer","error","deployment-config","deployment-success"].map(a=>({id:a,title:a.split("-").map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(" "),description:`${a} wireframe component`,priority:a.includes("login")||a.includes("dashboard")?"P0":"P1",section:f(a),latest_version:"v1",available_versions:["v1"]}))),f=e=>e.includes("login")||e.includes("signup")||e.includes("password")?"AUTH":e.includes("dashboard")?"HOME":e.includes("upload")||e.includes("processing")?"DATA":e.includes("project")||e.includes("code")||e.includes("prd")?"PROJECTS":e.includes("error")||e.includes("deploy")?"SYSTEM":"OTHER";return C.jsx(h,{onSubmit:v,onCancel:b,loadAvailablePages:P})}m.__docgenInfo={description:"",methods:[],displayName:"CreateReleaseManager",props:{apiEndpoint:{required:!1,tsType:{name:"string"},description:"API endpoint for creating releases",defaultValue:{value:"'/api/releases'",computed:!1}},baseUrl:{required:!1,tsType:{name:"string"},description:"Base URL to redirect to after creation",defaultValue:{value:"'/releases'",computed:!1}},loadAvailablePages:{required:!1,tsType:{name:"signature",type:"function",raw:"() => Promise<AvailablePage[]>",signature:{arguments:[],return:{name:"Promise",elements:[{name:"Array",elements:[{name:"AvailablePage"}],raw:"AvailablePage[]"}],raw:"Promise<AvailablePage[]>"}}},description:"Custom function to load available pages"},onSubmit:{required:!1,tsType:{name:"signature",type:"function",raw:"(data: CreateReleaseRequest) => Promise<void>",signature:{arguments:[{type:{name:"CreateReleaseRequest"},name:"data"}],return:{name:"Promise",elements:[{name:"void"}],raw:"Promise<void>"}}},description:"Custom submit handler"},onCancel:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Custom cancel handler"}}};const x={title:"Design System/Organisms/CreateReleaseManager",component:m,parameters:{layout:"centered",docs:{description:{component:"Complete release creation interface with form handling and navigation"}}},argTypes:{apiEndpoint:{control:"text",description:"API endpoint for creating releases"},baseUrl:{control:"text",description:"Base URL to redirect to after creation"}}},c=[{id:"login",title:"Login",description:"User authentication page",priority:"P0",section:"AUTH",latest_version:"v1",available_versions:["v1"]},{id:"dashboard",title:"Dashboard",description:"Main application dashboard",priority:"P0",section:"HOME",latest_version:"v1",available_versions:["v1"]},{id:"projects-list",title:"Projects List",description:"List of user projects",priority:"P1",section:"PROJECTS",latest_version:"v1",available_versions:["v1"]}],r={args:{apiEndpoint:"/api/releases",baseUrl:"/releases"}},n={args:{apiEndpoint:"/api/releases",baseUrl:"/releases",loadAvailablePages:async()=>c}},o={args:{apiEndpoint:"/api/admin/releases",baseUrl:"/admin/releases",loadAvailablePages:async()=>c}},t={args:{onSubmit:async i=>{console.log("Custom submit:",i),await new Promise(l=>setTimeout(l,1e3))},onCancel:()=>{console.log("Custom cancel")},loadAvailablePages:async()=>c}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    apiEndpoint: '/api/releases',
    baseUrl: '/releases'
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    apiEndpoint: '/api/releases',
    baseUrl: '/releases',
    loadAvailablePages: async () => mockAvailablePages
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    apiEndpoint: '/api/admin/releases',
    baseUrl: '/admin/releases',
    loadAvailablePages: async () => mockAvailablePages
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    onSubmit: async (data: CreateReleaseRequest) => {
      console.log('Custom submit:', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => {
      console.log('Custom cancel');
    },
    loadAvailablePages: async () => mockAvailablePages
  }
}`,...t.parameters?.docs?.source}}};const O=["Default","WithCustomPages","CustomEndpoints","WithCustomHandlers"];export{o as CustomEndpoints,r as Default,t as WithCustomHandlers,n as WithCustomPages,O as __namedExportsOrder,x as default};
