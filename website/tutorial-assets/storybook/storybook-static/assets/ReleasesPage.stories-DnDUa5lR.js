import{r as d,j as e}from"./iframe-D5evrB1t.js";import{R as T}from"./ReleasesList-BkvzBm_B.js";import{R as W}from"./ReleaseFilters-Ycse-2-j.js";import{B as p}from"./Button-DTif8qqZ.js";import{E as P}from"./ErrorBoundary-DsfJsOaU.js";import{S as m,a as _}from"./Skeleton-BToTCHHV.js";import{u as B}from"./useReleases-CF5q_Kmq.js";import{u as O,d as M,b as U,r as A}from"./overrides-CIz7JqZY.js";import{n as Y}from"./navigation-B4QW0cIQ.js";import{S as $}from"./ServiceProvider-cR3iPtCj.js";import"./preload-helper-D9Z9MdNV.js";import"./_interop_require_wildcard-DNKDR2gK.js";import"./file-text-BR3Iz2MY.js";import"./createLucideIcon-CYL-vWIR.js";import"./eye-BeouNTFJ.js";import"./users-CaUii9q0.js";import"./trash-2-CKY6oqXC.js";import"./index-SGlD7ZDG.js";import"./cn-BQ1woUC9.js";import"./Icon-BVdV1tcm.js";import"./play-CTq2X17R.js";import"./user-MOkHRdz7.js";import"./message-square-DKF1MyHe.js";import"./star-C9rq_WCT.js";import"./plus-BIwiTHae.js";import"./database-Bh5bi1zG.js";import"./triangle-alert-Bin-rNB-.js";import"./x-CyT8dDxu.js";import"./search-DrQCx2FU.js";import"./house-C64cIi8I.js";import"./settings-DU1kDWgt.js";const E={status:"all",search:"",tags:[],author:void 0};function z(i){const[n,a]=d.useState({...E,...i}),u=d.useCallback(r=>{a(t=>({...t,...r}))},[]),N=d.useCallback(()=>{a(E)},[]),b=d.useCallback(r=>{a(t=>({...t,search:r}))},[]),s=d.useCallback(r=>{a(t=>({...t,status:r}))},[]),h=d.useCallback(r=>{a(t=>{const l=t.tags||[],C=l.includes(r);return{...t,tags:C?l.filter(F=>F!==r):[...l,r]}})},[]),I=!!(n.status&&n.status!=="all"||n.search&&n.search!==""||n.tags&&n.tags.length>0||n.author);return{filters:n,updateFilters:u,resetFilters:N,isFiltered:I,setSearch:b,setStatus:s,toggleTag:h}}function D({searchParams:i,userId:n}){const a=Y.useRouter(),{user:u,isAuthenticated:N,loading:b}=O(),{filters:s,updateFilters:h,resetFilters:I}=z({status:i?.status,search:i?.search}),{releases:r,loading:t,error:l,actions:C,refetch:F}=B(s),R=()=>{a.push("/releases/new")},H=(o,c)=>{o==="status"?h({status:c}):o==="search"&&h({search:c});const k=new URLSearchParams;c&&c!=="all"&&k.set(o,c),a.push(`/releases?${k.toString()}`)},L=()=>{I(),a.push("/releases")},q=async o=>{if(confirm("Are you sure you want to delete this release?"))try{await C.delete(o)}catch(c){console.error("Failed to delete release:",c)}};return b||t?e.jsx(P,{children:e.jsx("div",{className:"min-h-screen bg-gray-50",children:e.jsxs("div",{className:"container mx-auto px-4 py-8",children:[e.jsxs("div",{className:"flex justify-between items-center mb-8",children:[e.jsxs("div",{children:[e.jsx(m,{variant:"text",width:"150px",height:32,className:"mb-2"}),e.jsx(m,{variant:"text",width:"300px",height:20})]}),e.jsx(m,{variant:"rounded",width:"140px",height:40})]}),e.jsx("div",{className:"bg-white rounded-lg shadow mb-6 p-4",children:e.jsxs("div",{className:"flex gap-4",children:[e.jsx(m,{variant:"rounded",height:36,className:"flex-1"}),e.jsx(m,{variant:"rounded",width:100,height:36}),e.jsx(m,{variant:"rounded",width:100,height:36})]})}),e.jsx("div",{className:"grid gap-4 md:grid-cols-2 lg:grid-cols-3",children:[1,2,3,4,5,6].map(o=>e.jsx(_,{},o))})]})})}):N?l?e.jsxs("div",{className:"flex flex-col items-center justify-center min-h-screen",children:[e.jsxs("div",{className:"text-lg text-red-600 mb-4",children:["Error loading releases: ",l.message]}),e.jsx(p,{onClick:()=>F(),children:"Retry"})]}):e.jsx(P,{children:e.jsx("div",{className:"min-h-screen bg-gray-50",children:e.jsxs("div",{className:"container mx-auto px-4 py-8",children:[e.jsxs("div",{className:"flex justify-between items-center mb-8",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:"Releases"}),e.jsx("p",{className:"text-gray-600 mt-2",children:"Manage and deploy your application releases"})]}),e.jsx(p,{onClick:R,children:"Create New Release"})]}),e.jsx("div",{className:"bg-white rounded-lg shadow-sm p-4 mb-6",children:e.jsx(W,{currentStatus:s.status,currentSearch:s.search,onFilterChange:H,onClearFilters:L})}),e.jsx("div",{className:"bg-white rounded-lg shadow-sm",children:r.length===0?e.jsxs("div",{className:"p-8 text-center",children:[e.jsx("p",{className:"text-gray-500 mb-4",children:s.search||s.status&&s.status!=="all"?"No releases found matching your filters":"No releases yet"}),!s.search&&(!s.status||s.status==="all")&&e.jsx(p,{onClick:R,children:"Create Your First Release"})]}):e.jsx(T,{searchParams:{page:i?.page,status:s.status,search:s.search},onDelete:q})}),u&&e.jsxs("div",{className:"mt-8 text-sm text-gray-500",children:["Logged in as: ",u.name," (",u.email,")"]})]})})}):e.jsxs("div",{className:"flex flex-col items-center justify-center min-h-screen",children:[e.jsx("div",{className:"text-lg mb-4",children:"Please login to view releases"}),e.jsx(p,{onClick:()=>a.push("/auth/signin"),children:"Sign In"})]})}D.__docgenInfo={description:"",methods:[],displayName:"ReleasesPage",props:{searchParams:{required:!1,tsType:{name:"signature",type:"object",raw:`{ 
  status?: string
  search?: string
  page?: string
}`,signature:{properties:[{key:"status",value:{name:"string",required:!1}},{key:"search",value:{name:"string",required:!1}},{key:"page",value:{name:"string",required:!1}}]}},description:""},userId:{required:!1,tsType:{name:"string"},description:""}}};const be={title:"Design System/Pages/Releases/v1.0.0",component:D,parameters:{layout:"fullscreen"},decorators:[i=>e.jsx($,{useMocks:!0,children:e.jsx(i,{})})]},g={args:{userId:"user-123"}},x={args:{searchParams:{status:"published",search:"mvp"},userId:"user-123"}},f={args:{searchParams:{status:"draft"},userId:"user-123"}},j={args:{searchParams:{search:"feature"},userId:"user-123"}},y={parameters:{msw:{handlers:M(2e3)}},args:{userId:"user-123"}},v={parameters:{msw:{handlers:U.notAuthenticated}},args:{}},S={parameters:{msw:{handlers:A.empty}},args:{userId:"user-123"}},w={parameters:{msw:{handlers:A.error}},args:{userId:"user-123"}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    userId: 'user-123'
  }
}`,...g.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {
      status: 'published',
      search: 'mvp'
    },
    userId: 'user-123'
  }
}`,...x.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {
      status: 'draft'
    },
    userId: 'user-123'
  }
}`,...f.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    searchParams: {
      search: 'feature'
    },
    userId: 'user-123'
  }
}`,...j.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  parameters: {
    msw: {
      handlers: delayHandlers(2000)
    }
  },
  args: {
    userId: 'user-123'
  }
}`,...y.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  parameters: {
    msw: {
      handlers: authHandlers.notAuthenticated
    }
  },
  args: {}
}`,...v.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  parameters: {
    msw: {
      handlers: releaseHandlers.empty
    }
  },
  args: {
    userId: 'user-123'
  }
}`,...S.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  parameters: {
    msw: {
      handlers: releaseHandlers.error
    }
  },
  args: {
    userId: 'user-123'
  }
}`,...w.parameters?.docs?.source}}};const Ie=["Default","WithFilters","DraftOnly","WithSearch","LoadingState","NotAuthenticated","EmptyState","ErrorState"];export{g as Default,f as DraftOnly,S as EmptyState,w as ErrorState,y as LoadingState,v as NotAuthenticated,x as WithFilters,j as WithSearch,Ie as __namedExportsOrder,be as default};
