import{j as e}from"./iframe-D5evrB1t.js";import{B as r}from"./Button-DTif8qqZ.js";import{L as h,A as v}from"./Icon-BVdV1tcm.js";import{S as B}from"./settings-DU1kDWgt.js";import{U as f}from"./user-MOkHRdz7.js";import"./preload-helper-D9Z9MdNV.js";import"./index-SGlD7ZDG.js";import"./cn-BQ1woUC9.js";import"./createLucideIcon-CYL-vWIR.js";import"./play-CTq2X17R.js";import"./users-CaUii9q0.js";import"./message-square-DKF1MyHe.js";import"./star-C9rq_WCT.js";import"./plus-BIwiTHae.js";import"./eye-BeouNTFJ.js";import"./database-Bh5bi1zG.js";import"./file-text-BR3Iz2MY.js";import"./triangle-alert-Bin-rNB-.js";import"./trash-2-CKY6oqXC.js";import"./x-CyT8dDxu.js";import"./search-DrQCx2FU.js";import"./house-C64cIi8I.js";const x=()=>()=>{},q={title:"Design System/Atoms/Button/v1-0-0",component:r,parameters:{layout:"centered"},argTypes:{variant:{control:"select",options:["default","destructive","outline","secondary","ghost","link"],description:"The visual style of the button"},size:{control:"select",options:["default","sm","lg","icon"],description:"The size of the button"},loading:{control:"boolean",description:"Show loading spinner"},disabled:{control:"boolean",description:"Disable the button"}}},t={args:{variant:"default",children:"Default Button",onClick:x()}},n={args:{variant:"secondary",children:"Secondary Button"}},s={args:{variant:"outline",children:"Outline Button"}},a={args:{variant:"ghost",children:"Ghost Button"}},o={args:{variant:"destructive",children:"Destructive Button"}},i={args:{size:"sm",children:"Small Button"}},c={args:{size:"lg",children:"Large Button"}},l={args:{loading:!0,children:"Loading..."}},d={args:{disabled:!0,children:"Disabled Button"}},u={args:{leftIcon:e.jsx(h,{size:16}),children:"Sign In"}},m={args:{rightIcon:e.jsx(v,{size:16}),children:"Continue"}},p={args:{size:"icon",children:e.jsx(B,{size:20}),"aria-label":"Settings"}},g={render:()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{className:"flex gap-2 items-center",children:[e.jsx(r,{variant:"default",children:"Default"}),e.jsx(r,{variant:"secondary",children:"Secondary"}),e.jsx(r,{variant:"outline",children:"Outline"}),e.jsx(r,{variant:"ghost",children:"Ghost"}),e.jsx(r,{variant:"destructive",children:"Destructive"})]}),e.jsxs("div",{className:"flex gap-2 items-center",children:[e.jsx(r,{size:"sm",children:"Small"}),e.jsx(r,{size:"default",children:"Default"}),e.jsx(r,{size:"lg",children:"Large"}),e.jsx(r,{size:"icon",children:e.jsx(f,{size:20})})]}),e.jsxs("div",{className:"flex gap-2 items-center",children:[e.jsx(r,{loading:!0,children:"Loading"}),e.jsx(r,{disabled:!0,children:"Disabled"}),e.jsx(r,{leftIcon:e.jsx(h,{size:16}),children:"With Icon"})]})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'default',
    children: 'Default Button',
    onClick: fn()
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Outline Button'
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'destructive',
    children: 'Destructive Button'
  }
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    children: 'Small Button'
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    children: 'Large Button'
  }
}`,...c.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    children: 'Loading...'
  }
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}`,...d.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    leftIcon: <LogIn size={16} />,
    children: 'Sign In'
  }
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    rightIcon: <ArrowRight size={16} />,
    children: 'Continue'
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'icon',
    children: <Settings size={20} />,
    'aria-label': 'Settings'
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex gap-2 items-center">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon"><User size={20} /></Button>
      </div>
      <div className="flex gap-2 items-center">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button leftIcon={<LogIn size={16} />}>With Icon</Button>
      </div>
    </div>
}`,...g.parameters?.docs?.source}}};const F=["Default","Secondary","Outline","Ghost","Destructive","Small","Large","Loading","Disabled","WithLeftIcon","WithRightIcon","IconOnly","AllVariants"];export{g as AllVariants,t as Default,o as Destructive,d as Disabled,a as Ghost,p as IconOnly,c as Large,l as Loading,s as Outline,n as Secondary,i as Small,u as WithLeftIcon,m as WithRightIcon,F as __namedExportsOrder,q as default};
