import{j as e}from"./iframe-D5evrB1t.js";import{S as s,b as c,a as x,c as h,d as v}from"./Skeleton-BToTCHHV.js";import"./preload-helper-D9Z9MdNV.js";import"./cn-BQ1woUC9.js";const w={title:"Design System/Atoms/Skeleton/v1.0.0",component:s,parameters:{layout:"padded"},argTypes:{variant:{control:"select",options:["text","circular","rectangular","rounded"]},animation:{control:"select",options:["pulse","wave","none"]},width:{control:"text"},height:{control:"text"}}},t={args:{variant:"text",animation:"pulse"}},n={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Text"}),e.jsx(s,{variant:"text"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Circular"}),e.jsx(s,{variant:"circular",width:60,height:60})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Rectangular"}),e.jsx(s,{variant:"rectangular",height:100})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Rounded"}),e.jsx(s,{variant:"rounded",height:100})]})]})},a={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Pulse Animation"}),e.jsx(s,{animation:"pulse",height:40})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Wave Animation"}),e.jsx(s,{animation:"wave",height:40})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"No Animation"}),e.jsx(s,{animation:"none",height:40})]})]})},i={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Single Line"}),e.jsx(c,{lines:1})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Three Lines"}),e.jsx(c,{lines:3})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium mb-2",children:"Five Lines"}),e.jsx(c,{lines:5})]})]})},r={render:()=>e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsx(x,{}),e.jsx(x,{})]})},d={render:()=>e.jsx("div",{className:"bg-white p-4 rounded-lg shadow",children:e.jsx(h,{rows:5,columns:4})})},m={render:()=>e.jsx(v,{items:4})},o={render:()=>e.jsxs("div",{className:"max-w-4xl mx-auto p-6",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx(s,{variant:"text",width:"200px",height:32,className:"mb-2"}),e.jsx(s,{variant:"text",width:"400px",height:20})]}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-8",children:[1,2,3].map(p=>e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow",children:[e.jsx(s,{variant:"text",width:"100px",height:14,className:"mb-2"}),e.jsx(s,{variant:"text",width:"60px",height:24})]},p))}),e.jsxs("div",{className:"bg-white rounded-lg shadow p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx(s,{variant:"text",width:"150px",height:24}),e.jsx(s,{variant:"rounded",width:"100px",height:36})]}),e.jsx(h,{rows:4,columns:3})]})]})},l={render:()=>e.jsxs("div",{className:"bg-white p-6 rounded-lg shadow max-w-sm",children:[e.jsxs("div",{className:"flex items-center space-x-4 mb-4",children:[e.jsx(s,{variant:"circular",width:80,height:80}),e.jsxs("div",{className:"flex-1 space-y-2",children:[e.jsx(s,{variant:"text",width:"120px",height:20}),e.jsx(s,{variant:"text",width:"180px",height:16}),e.jsx(s,{variant:"text",width:"100px",height:14})]})]}),e.jsx(c,{lines:3}),e.jsxs("div",{className:"mt-4 flex space-x-2",children:[e.jsx(s,{variant:"rounded",width:"100%",height:36}),e.jsx(s,{variant:"rounded",width:"100%",height:36})]})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'text',
    animation: 'pulse'
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Text</p>
        <Skeleton variant="text" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Circular</p>
        <Skeleton variant="circular" width={60} height={60} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Rectangular</p>
        <Skeleton variant="rectangular" height={100} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Rounded</p>
        <Skeleton variant="rounded" height={100} />
      </div>
    </div>
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Pulse Animation</p>
        <Skeleton animation="pulse" height={40} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Wave Animation</p>
        <Skeleton animation="wave" height={40} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">No Animation</p>
        <Skeleton animation="none" height={40} />
      </div>
    </div>
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Single Line</p>
        <SkeletonText lines={1} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Three Lines</p>
        <SkeletonText lines={3} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Five Lines</p>
        <SkeletonText lines={5} />
      </div>
    </div>
}`,...i.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
}`,...r.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-white p-4 rounded-lg shadow">
      <SkeletonTable rows={5} columns={4} />
    </div>
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <SkeletonList items={4} />
}`,...m.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Skeleton variant="text" width="200px" height={32} className="mb-2" />
        <Skeleton variant="text" width="400px" height={20} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => <div key={i} className="bg-white p-4 rounded-lg shadow">
            <Skeleton variant="text" width="100px" height={14} className="mb-2" />
            <Skeleton variant="text" width="60px" height={24} />
          </div>)}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width="150px" height={24} />
          <Skeleton variant="rounded" width="100px" height={36} />
        </div>
        <SkeletonTable rows={4} columns={3} />
      </div>
    </div>
}`,...o.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="bg-white p-6 rounded-lg shadow max-w-sm">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="120px" height={20} />
          <Skeleton variant="text" width="180px" height={16} />
          <Skeleton variant="text" width="100px" height={14} />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="mt-4 flex space-x-2">
        <Skeleton variant="rounded" width="100%" height={36} />
        <Skeleton variant="rounded" width="100%" height={36} />
      </div>
    </div>
}`,...l.parameters?.docs?.source}}};const N=["Default","Variants","Animations","TextSkeleton","CardSkeleton","TableSkeleton","ListSkeleton","CompletePageSkeleton","ProfileSkeleton"];export{a as Animations,r as CardSkeleton,o as CompletePageSkeleton,t as Default,m as ListSkeleton,l as ProfileSkeleton,d as TableSkeleton,i as TextSkeleton,n as Variants,N as __namedExportsOrder,w as default};
