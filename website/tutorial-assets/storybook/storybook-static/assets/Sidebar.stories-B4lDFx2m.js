import{j as e,R,r as i}from"./iframe-D5evrB1t.js";import{c as d}from"./cn-BQ1woUC9.js";import{a as _,C as k,D as W}from"./database-Bh5bi1zG.js";import{H as y}from"./house-C64cIi8I.js";import{F as I}from"./file-text-BR3Iz2MY.js";import{P as T,G as q}from"./package-voSg-YqC.js";import{F as P}from"./file-code-Dg1sg6wZ.js";import{W as H}from"./workflow-mt90hx-5.js";import{c as A}from"./createLucideIcon-CYL-vWIR.js";import{S as w}from"./settings-DU1kDWgt.js";import{U as C}from"./users-CaUii9q0.js";import{S as D}from"./shield-OUs8JC_K.js";import"./preload-helper-D9Z9MdNV.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]],L=A("brain",E);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],F=A("layers",U),c=({open:t,onToggle:n,navigation:a,activeHref:s,onNavigate:r,className:p,logo:m,title:j="Induction Studio"})=>e.jsxs("div",{className:d("bg-gray-900 text-white transition-all duration-300 flex flex-col",t?"w-64":"w-16",p),children:[e.jsxs("div",{className:"h-16 flex items-center justify-between px-4 border-b border-gray-800",children:[t&&(m||e.jsx("span",{className:"text-xl font-bold",children:j})),e.jsx("button",{onClick:n,className:"p-1 hover:bg-gray-800 rounded transition-colors",children:t?e.jsx(_,{size:20}):e.jsx(k,{size:20})})]}),e.jsx("nav",{className:"flex-1 px-2 py-4 space-y-1",children:a.map(l=>{const O=l.icon,M=s===l.href||s?.startsWith(l.href);return e.jsxs("button",{onClick:()=>r?.(l),className:d("w-full flex items-center px-2 py-2 rounded-lg transition-colors",M?"bg-gray-800 text-white":"text-gray-300 hover:bg-gray-800 hover:text-white"),children:[e.jsx(O,{className:"h-5 w-5 flex-shrink-0"}),t&&e.jsx("span",{className:"ml-3",children:l.name})]},l.name)})})]}),o=({icon:t,label:n,active:a=!1,onClick:s,open:r=!0,className:p})=>e.jsxs("button",{onClick:s,className:d("w-full flex items-center px-2 py-2 rounded-lg transition-colors",a?"bg-gray-800 text-white":"text-gray-300 hover:bg-gray-800 hover:text-white",p),children:[e.jsx(t,{className:"h-5 w-5 flex-shrink-0"}),r&&e.jsx("span",{className:"ml-3",children:n})]}),S=({title:t,children:n,open:a=!0,collapsible:s=!1,defaultExpanded:r=!0,className:p})=>{const[m,j]=R.useState(r);return e.jsxs("div",{className:d("px-2 py-2",p),children:[a&&e.jsxs("div",{className:d("text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1",s&&"cursor-pointer hover:text-gray-300"),onClick:s?()=>j(!m):void 0,children:[t,s&&e.jsx(k,{className:d("inline-block ml-1 h-3 w-3 transition-transform",m&&"rotate-90")})]}),(!s||m)&&e.jsx("div",{className:"space-y-1 mt-1",children:n})]})};c.__docgenInfo={description:"",methods:[],displayName:"Sidebar",props:{open:{required:!0,tsType:{name:"boolean"},description:""},onToggle:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},navigation:{required:!0,tsType:{name:"Array",elements:[{name:"NavigationItem"}],raw:"NavigationItem[]"},description:""},activeHref:{required:!1,tsType:{name:"string"},description:""},onNavigate:{required:!1,tsType:{name:"signature",type:"function",raw:"(item: NavigationItem) => void",signature:{arguments:[{type:{name:"NavigationItem"},name:"item"}],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""},logo:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},title:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"'Induction Studio'",computed:!1}}}};o.__docgenInfo={description:"",methods:[],displayName:"SidebarItem",props:{icon:{required:!0,tsType:{name:"LucideIcon"},description:""},label:{required:!0,tsType:{name:"string"},description:""},active:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},open:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},className:{required:!1,tsType:{name:"string"},description:""}}};S.__docgenInfo={description:"",methods:[],displayName:"SidebarSection",props:{title:{required:!0,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},open:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},collapsible:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},defaultExpanded:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},className:{required:!1,tsType:{name:"string"},description:""}}};const ae={title:"Design System/Molecules/Sidebar/v1.0.0",component:c,parameters:{layout:"fullscreen"},tags:["autodocs"],decorators:[t=>e.jsxs("div",{style:{height:"100vh",display:"flex"},children:[e.jsx(t,{}),e.jsxs("div",{style:{flex:1,padding:"20px",backgroundColor:"#f3f4f6"},children:[e.jsx("h2",{children:"Main Content Area"}),e.jsx("p",{children:"The sidebar controls navigation in this area."})]})]})]},N=[{name:"Dashboard",href:"/dashboard",icon:y},{name:"Documents",href:"/documents",icon:I},{name:"Releases",href:"/releases",icon:T},{name:"Pages",href:"/pages",icon:P},{name:"Workflows",href:"/workflows",icon:H},{name:"Knowledge Graph",href:"/knowledge",icon:L},{name:"Studio",href:"/studio",icon:q},{name:"Settings",href:"/settings",icon:w}],u={render:()=>{const[t,n]=i.useState(!0),[a,s]=i.useState("/dashboard");return e.jsx(c,{open:t,onToggle:()=>n(!t),navigation:N,activeHref:a,onNavigate:r=>{console.log("Navigate to:",r),s(r.href)}})}},g={render:()=>{const[t,n]=i.useState(!1),[a,s]=i.useState("/documents");return e.jsx(c,{open:t,onToggle:()=>n(!t),navigation:N,activeHref:a,onNavigate:r=>{console.log("Navigate to:",r),s(r.href)}})}},f={render:()=>{const[t,n]=i.useState(!0);return e.jsx(c,{open:t,onToggle:()=>n(!t),navigation:N,activeHref:"/pages",title:"My Platform",onNavigate:a=>console.log("Navigate to:",a)})}},v={render:()=>{const[t,n]=i.useState(!0);return e.jsx(c,{open:t,onToggle:()=>n(!t),navigation:N,activeHref:"/studio",logo:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(F,{className:"h-8 w-8 text-blue-400"}),e.jsx("span",{className:"text-xl font-bold",children:"Studio"})]}),onNavigate:a=>console.log("Navigate to:",a)})}},h={render:()=>{const[t,n]=i.useState(!0),a=[{name:"Home",href:"/",icon:y},{name:"Users",href:"/users",icon:C},{name:"Security",href:"/security",icon:D},{name:"Settings",href:"/settings",icon:w}];return e.jsx(c,{open:t,onToggle:()=>n(!t),navigation:a,activeHref:"/users",onNavigate:s=>console.log("Navigate to:",s)})}},b={render:()=>{const[t,n]=i.useState(!0),[a,s]=i.useState("dashboard");return e.jsxs("div",{className:"bg-gray-900 text-white w-64 h-screen p-4",children:[e.jsx("h3",{className:"text-lg font-bold mb-4",children:"Individual Items"}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(o,{icon:y,label:"Dashboard",active:a==="dashboard",onClick:()=>s("dashboard"),open:t}),e.jsx(o,{icon:I,label:"Documents",active:a==="documents",onClick:()=>s("documents"),open:t}),e.jsx(o,{icon:W,label:"Database",active:a==="database",onClick:()=>s("database"),open:t})]})]})}},x={render:()=>{const[t,n]=i.useState(!0);return e.jsxs("div",{className:"bg-gray-900 text-white w-64 h-screen",children:[e.jsx("div",{className:"h-16 flex items-center px-4 border-b border-gray-800",children:e.jsx("span",{className:"text-xl font-bold",children:"Platform"})}),e.jsxs(S,{title:"Main",open:t,children:[e.jsx(o,{icon:y,label:"Dashboard",open:t}),e.jsx(o,{icon:I,label:"Documents",open:t})]}),e.jsxs(S,{title:"Development",open:t,collapsible:!0,defaultExpanded:!0,children:[e.jsx(o,{icon:q,label:"Branches",open:t}),e.jsx(o,{icon:T,label:"Packages",open:t}),e.jsx(o,{icon:H,label:"Workflows",open:t})]}),e.jsxs(S,{title:"Admin",open:t,collapsible:!0,defaultExpanded:!1,children:[e.jsx(o,{icon:C,label:"Users",open:t}),e.jsx(o,{icon:D,label:"Security",open:t}),e.jsx(o,{icon:w,label:"Settings",open:t})]})]})}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    const [activeHref, setActiveHref] = useState('/dashboard');
    return <Sidebar open={open} onToggle={() => setOpen(!open)} navigation={defaultNavigation} activeHref={activeHref} onNavigate={item => {
      console.log('Navigate to:', item);
      setActiveHref(item.href);
    }} />;
  }
}`,...u.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(false);
    const [activeHref, setActiveHref] = useState('/documents');
    return <Sidebar open={open} onToggle={() => setOpen(!open)} navigation={defaultNavigation} activeHref={activeHref} onNavigate={item => {
      console.log('Navigate to:', item);
      setActiveHref(item.href);
    }} />;
  }
}`,...g.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    return <Sidebar open={open} onToggle={() => setOpen(!open)} navigation={defaultNavigation} activeHref="/pages" title="My Platform" onNavigate={item => console.log('Navigate to:', item)} />;
  }
}`,...f.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    return <Sidebar open={open} onToggle={() => setOpen(!open)} navigation={defaultNavigation} activeHref="/studio" logo={<div className="flex items-center gap-2">
            <Layers className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold">Studio</span>
          </div>} onNavigate={item => console.log('Navigate to:', item)} />;
  }
}`,...v.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    const simpleNav = [{
      name: 'Home',
      href: '/',
      icon: Home
    }, {
      name: 'Users',
      href: '/users',
      icon: Users
    }, {
      name: 'Security',
      href: '/security',
      icon: Shield
    }, {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    }];
    return <Sidebar open={open} onToggle={() => setOpen(!open)} navigation={simpleNav} activeHref="/users" onNavigate={item => console.log('Navigate to:', item)} />;
  }
}`,...h.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    const [activeItem, setActiveItem] = useState('dashboard');
    return <div className="bg-gray-900 text-white w-64 h-screen p-4">
        <h3 className="text-lg font-bold mb-4">Individual Items</h3>
        <div className="space-y-2">
          <SidebarItem icon={Home} label="Dashboard" active={activeItem === 'dashboard'} onClick={() => setActiveItem('dashboard')} open={open} />
          <SidebarItem icon={FileText} label="Documents" active={activeItem === 'documents'} onClick={() => setActiveItem('documents')} open={open} />
          <SidebarItem icon={Database} label="Database" active={activeItem === 'database'} onClick={() => setActiveItem('database')} open={open} />
        </div>
      </div>;
  }
}`,...b.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    return <div className="bg-gray-900 text-white w-64 h-screen">
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <span className="text-xl font-bold">Platform</span>
        </div>
        
        <SidebarSection title="Main" open={open}>
          <SidebarItem icon={Home} label="Dashboard" open={open} />
          <SidebarItem icon={FileText} label="Documents" open={open} />
        </SidebarSection>

        <SidebarSection title="Development" open={open} collapsible defaultExpanded={true}>
          <SidebarItem icon={GitBranch} label="Branches" open={open} />
          <SidebarItem icon={Package} label="Packages" open={open} />
          <SidebarItem icon={Workflow} label="Workflows" open={open} />
        </SidebarSection>

        <SidebarSection title="Admin" open={open} collapsible defaultExpanded={false}>
          <SidebarItem icon={Users} label="Users" open={open} />
          <SidebarItem icon={Shield} label="Security" open={open} />
          <SidebarItem icon={Settings} label="Settings" open={open} />
        </SidebarSection>
      </div>;
  }
}`,...x.parameters?.docs?.source}}};const se=["Default","Collapsed","CustomTitle","WithLogo","SimpleNavigation","IndividualItems","WithSections"];export{g as Collapsed,f as CustomTitle,u as Default,b as IndividualItems,h as SimpleNavigation,v as WithLogo,x as WithSections,se as __namedExportsOrder,ae as default};
