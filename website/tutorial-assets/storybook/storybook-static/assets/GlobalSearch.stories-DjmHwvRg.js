import{r as n,j as e}from"./iframe-D5evrB1t.js";import{c as N}from"./cn-BQ1woUC9.js";import{S as I}from"./search-DrQCx2FU.js";import{c as K}from"./createLucideIcon-CYL-vWIR.js";import{X as _}from"./x-CyT8dDxu.js";import{F as C}from"./file-text-BR3Iz2MY.js";import{W as G}from"./workflow-mt90hx-5.js";import{P as H,G as z}from"./package-voSg-YqC.js";import"./preload-helper-D9Z9MdNV.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=[["path",{d:"M12 2v4",key:"3427ic"}],["path",{d:"m16.2 7.8 2.9-2.9",key:"r700ao"}],["path",{d:"M18 12h4",key:"wj9ykh"}],["path",{d:"m16.2 16.2 2.9 2.9",key:"1bxg5t"}],["path",{d:"M12 18v4",key:"jadmvz"}],["path",{d:"m4.9 19.1 2.9-2.9",key:"bwix9q"}],["path",{d:"M2 12h4",key:"j09sii"}],["path",{d:"m4.9 4.9 2.9 2.9",key:"giyufr"}]],O=K("loader",B),q=({className:s,placeholder:i="Search documents, pages, releases, workflows...",onSearch:a,onResultSelect:w,shortcutKey:v="k"})=>{const[b,c]=n.useState(!1),[o,P]=n.useState(""),[l,u]=n.useState([]),[E,T]=n.useState(!1),[j,d]=n.useState(0),A=n.useRef(null),k=n.useRef(null);n.useEffect(()=>{const t=r=>{(r.metaKey||r.ctrlKey)&&r.key===v&&(r.preventDefault(),c(!0)),r.key==="Escape"&&c(!1)};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)},[v]),n.useEffect(()=>{b&&k.current&&k.current.focus()},[b]),n.useEffect(()=>{if(!o||!a){u([]);return}const t=setTimeout(async()=>{T(!0);try{const r=await a(o);u(r||[]),d(0)}catch(r){console.error("Search failed:",r),u([])}finally{T(!1)}},300);return()=>clearTimeout(t)},[o,a]);const M=t=>{t.key==="ArrowDown"?(t.preventDefault(),d(r=>Math.min(r+1,l.length-1))):t.key==="ArrowUp"?(t.preventDefault(),d(r=>Math.max(r-1,0))):t.key==="Enter"&&l[j]&&(t.preventDefault(),D(l[j]))},D=t=>{w&&w(t),c(!1),P(""),u([])},L=t=>{switch(t){case"document":return e.jsx(C,{className:"h-4 w-4"});case"page":return e.jsx(z,{className:"h-4 w-4"});case"release":return e.jsx(H,{className:"h-4 w-4"});case"workflow":return e.jsx(G,{className:"h-4 w-4"});default:return e.jsx(C,{className:"h-4 w-4"})}};return b?e.jsxs("div",{className:"fixed inset-0 z-50 overflow-y-auto",children:[e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 transition-opacity",onClick:()=>c(!1)}),e.jsx("div",{className:"flex items-start justify-center min-h-full pt-[10vh]",children:e.jsxs("div",{ref:A,className:"relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4",children:[e.jsxs("div",{className:"flex items-center px-4 py-3 border-b border-gray-200",children:[e.jsx(I,{className:"h-5 w-5 text-gray-400 mr-3"}),e.jsx("input",{ref:k,type:"text",value:o,onChange:t=>P(t.target.value),onKeyDown:M,placeholder:i,className:"flex-1 outline-none text-gray-900"}),E&&e.jsx(O,{className:"h-4 w-4 text-gray-400 animate-spin"}),e.jsx("button",{onClick:()=>c(!1),className:"ml-3 p-1 hover:bg-gray-100 rounded",children:e.jsx(_,{className:"h-4 w-4 text-gray-400"})})]}),l.length>0&&e.jsx("div",{className:"max-h-[60vh] overflow-y-auto py-2",children:l.map((t,r)=>e.jsxs("button",{onClick:()=>D(t),onMouseEnter:()=>d(r),className:N("w-full px-4 py-3 flex items-center hover:bg-gray-50 transition-colors",r===j&&"bg-gray-50"),children:[e.jsx("div",{className:N("mr-3 p-2 rounded",t.type==="document"&&"bg-blue-100 text-blue-600",t.type==="page"&&"bg-green-100 text-green-600",t.type==="release"&&"bg-purple-100 text-purple-600",t.type==="workflow"&&"bg-orange-100 text-orange-600"),children:L(t.type)}),e.jsxs("div",{className:"flex-1 text-left",children:[e.jsx("div",{className:"text-sm font-medium text-gray-900",children:t.title||t.name}),t.description&&e.jsx("div",{className:"text-xs text-gray-500 mt-1",children:t.description})]}),e.jsx("span",{className:"text-xs text-gray-400 capitalize",children:t.type})]},`${t.type}-${t.id}`))}),o&&!E&&l.length===0&&e.jsxs("div",{className:"px-4 py-8 text-center text-gray-500",children:['No results found for "',o,'"']}),!o&&e.jsxs("div",{className:"px-4 py-8 text-center text-gray-500",children:[e.jsx("p",{className:"text-sm",children:"Start typing to search across all content"}),e.jsxs("div",{className:"mt-4 flex justify-center space-x-4 text-xs",children:[e.jsxs("span",{children:[e.jsx("kbd",{className:"px-2 py-1 bg-gray-100 rounded",children:"↑↓"})," Navigate"]}),e.jsxs("span",{children:[e.jsx("kbd",{className:"px-2 py-1 bg-gray-100 rounded",children:"Enter"})," Select"]}),e.jsxs("span",{children:[e.jsx("kbd",{className:"px-2 py-1 bg-gray-100 rounded",children:"Esc"})," Close"]})]})]})]})})]}):e.jsxs("button",{onClick:()=>c(!0),className:N("flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors",s),children:[e.jsx(I,{className:"h-4 w-4 mr-2"}),e.jsx("span",{children:"Search..."}),e.jsxs("kbd",{className:"ml-auto px-2 py-1 text-xs bg-white rounded border border-gray-300",children:["⌘",v.toUpperCase()]})]})};q.__docgenInfo={description:"",methods:[],displayName:"GlobalSearch",props:{className:{required:!1,tsType:{name:"string"},description:""},placeholder:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'Search documents, pages, releases, workflows...'",computed:!1}},onSearch:{required:!1,tsType:{name:"signature",type:"function",raw:"(query: string) => Promise<SearchResult[]>",signature:{arguments:[{type:{name:"string"},name:"query"}],return:{name:"Promise",elements:[{name:"Array",elements:[{name:"SearchResult"}],raw:"SearchResult[]"}],raw:"Promise<SearchResult[]>"}}},description:""},onResultSelect:{required:!1,tsType:{name:"signature",type:"function",raw:"(result: SearchResult) => void",signature:{arguments:[{type:{name:"SearchResult"},name:"result"}],return:{name:"void"}}},description:""},shortcutKey:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'k'",computed:!1}}}};const R=()=>()=>{},Z={title:"Design System/Molecules/GlobalSearch/v1.0.0",component:q,parameters:{layout:"centered"},tags:["autodocs"]},S=async s=>(await new Promise(a=>setTimeout(a,500)),[{id:"1",type:"document",title:"Product Requirements Document",description:"Main PRD for the AI App Builder platform",url:"/documents/1"},{id:"2",type:"page",name:"Dashboard Page",description:"Main dashboard with analytics and metrics",url:"/pages/dashboard"},{id:"3",type:"release",name:"v1.2.0 Release",description:"Q4 2024 feature release",url:"/releases/v1.2.0"},{id:"4",type:"workflow",title:"Deploy to Production",description:"Automated deployment workflow",url:"/workflows/deploy-prod"},{id:"5",type:"document",title:"API Documentation",description:"Complete API reference guide",url:"/documents/api-docs"}].filter(a=>[a.title,a.name,a.description,a.type].filter(Boolean).join(" ").toLowerCase().includes(s.toLowerCase()))),m={args:{onSearch:S,onResultSelect:R()}},p={args:{placeholder:"Type to search...",onSearch:S,onResultSelect:s=>console.log("Selected:",s)}},h={args:{shortcutKey:"p",onSearch:S,onResultSelect:R()}},y={args:{onResultSelect:s=>console.log("Selected:",s)}},g={args:{onSearch:async s=>(await new Promise(i=>setTimeout(i,2e3)),S(s)),onResultSelect:s=>console.log("Selected:",s)}},f={args:{onSearch:async()=>(await new Promise(s=>setTimeout(s,300)),[]),onResultSelect:R()}},x={args:{onSearch:async()=>{throw await new Promise(s=>setTimeout(s,300)),new Error("Search API failed")},onResultSelect:s=>console.log("Selected:",s)}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    onSearch: mockSearch,
    onResultSelect: fn()
  }
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement, args }) => { ... }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Type to search...',
    onSearch: mockSearch,
    onResultSelect: result => console.log('Selected:', result)
  }
}`,...p.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    shortcutKey: 'p',
    onSearch: mockSearch,
    onResultSelect: fn()
  }
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement }) => { ... }
}`,...h.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    // No onSearch prop - will show empty state
    onResultSelect: result => console.log('Selected:', result)
  }
}`,...y.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    onSearch: async query => {
      // Simulate slow API
      await new Promise(resolve => setTimeout(resolve, 2000));
      return mockSearch(query);
    },
    onResultSelect: result => console.log('Selected:', result)
  }
}`,...g.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    onSearch: async () => {
      // Always return empty results
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];
    },
    onResultSelect: fn()
  }
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement }) => { ... }
}`,...f.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    onSearch: async () => {
      // Simulate an error
      await new Promise(resolve => setTimeout(resolve, 300));
      throw new Error('Search API failed');
    },
    onResultSelect: result => console.log('Selected:', result)
  }
}`,...x.parameters?.docs?.source}}};const ee=["Default","CustomPlaceholder","CustomShortcut","NoSearchHandler","SlowSearch","EmptyResults","ErrorHandling"];export{p as CustomPlaceholder,h as CustomShortcut,m as Default,f as EmptyResults,x as ErrorHandling,y as NoSearchHandler,g as SlowSearch,ee as __namedExportsOrder,Z as default};
