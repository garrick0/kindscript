import{r as c,j as s}from"./iframe-D5evrB1t.js";import{R as y}from"./ReleasesList-BkvzBm_B.js";import{R as f}from"./ReleaseFilters-Ycse-2-j.js";import{u as x}from"./useReleases-CF5q_Kmq.js";import"./preload-helper-D9Z9MdNV.js";import"./_interop_require_wildcard-DNKDR2gK.js";import"./file-text-BR3Iz2MY.js";import"./createLucideIcon-CYL-vWIR.js";import"./eye-BeouNTFJ.js";import"./users-CaUii9q0.js";import"./trash-2-CKY6oqXC.js";import"./ServiceProvider-cR3iPtCj.js";function m({userId:b,onNavigate:v}){const[e,o]=c.useState({status:"all",search:""}),{actions:d}=x(e),[D,p]=c.useState(null),u=(a,i)=>{o(l=>({...l,[a]:i,page:a!=="page"?1:l.page||1}))},g=()=>{o({status:"all",search:""})},h=async a=>{p(a);try{await d.delete(a)}catch(i){console.error("Error deleting release:",i)}finally{p(null)}};return s.jsxs("div",{className:"space-y-6",children:[s.jsx("div",{className:"bg-white rounded-lg shadow p-6",children:s.jsx(f,{currentStatus:e.status,currentSearch:e.search,onFilterChange:u,onClearFilters:g})}),s.jsx("div",{className:"bg-white rounded-lg shadow",children:s.jsx(y,{searchParams:{...e,page:e.page?.toString()},onDelete:h,baseUrl:"/releases"})})]})}m.__docgenInfo={description:`ReleasesManager - Full releases management component with business logic
This is a container component that combines filters and list with data fetching`,methods:[],displayName:"ReleasesManager",props:{userId:{required:!1,tsType:{name:"string"},description:""},onNavigate:{required:!1,tsType:{name:"signature",type:"function",raw:"(path: string) => void",signature:{arguments:[{type:{name:"string"},name:"path"}],return:{name:"void"}}},description:""}}};const T={title:"Design System/Organisms/ReleasesManager",component:m,parameters:{layout:"fullscreen",docs:{description:{component:"Complete release management interface with filtering and CRUD operations"}}},argTypes:{baseUrl:{control:"text",description:"Base URL for release routes"},apiEndpoint:{control:"text",description:"API endpoint for release operations"}}},r={args:{baseUrl:"/releases",apiEndpoint:"/api/releases"},parameters:{nextjs:{appDirectory:!0,navigation:{pathname:"/releases",query:{}}}}},t={args:{baseUrl:"/releases",apiEndpoint:"/api/releases"},parameters:{nextjs:{appDirectory:!0,navigation:{pathname:"/releases",query:{status:"approved",search:"mobile"}}}}},n={args:{baseUrl:"/admin/releases",apiEndpoint:"/api/admin/releases"},parameters:{nextjs:{appDirectory:!0,navigation:{pathname:"/admin/releases",query:{}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    baseUrl: '/releases',
    apiEndpoint: '/api/releases'
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/releases',
        query: {}
      }
    }
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    baseUrl: '/releases',
    apiEndpoint: '/api/releases'
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/releases',
        query: {
          status: 'approved',
          search: 'mobile'
        }
      }
    }
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    baseUrl: '/admin/releases',
    apiEndpoint: '/api/admin/releases'
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/admin/releases',
        query: {}
      }
    }
  }
}`,...n.parameters?.docs?.source}}};const _=["Default","WithFiltersApplied","CustomEndpoints"];export{n as CustomEndpoints,r as Default,t as WithFiltersApplied,_ as __namedExportsOrder,T as default};
