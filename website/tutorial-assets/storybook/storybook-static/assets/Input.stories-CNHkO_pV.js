import{j as e}from"./iframe-D5evrB1t.js";import{I as r}from"./Input-CY5-kxsz.js";import{S as u}from"./search-DrQCx2FU.js";import{M as h,f as g}from"./Icon-BVdV1tcm.js";import{U as S}from"./user-MOkHRdz7.js";import"./preload-helper-D9Z9MdNV.js";import"./index-SGlD7ZDG.js";import"./cn-BQ1woUC9.js";import"./createLucideIcon-CYL-vWIR.js";import"./play-CTq2X17R.js";import"./users-CaUii9q0.js";import"./message-square-DKF1MyHe.js";import"./star-C9rq_WCT.js";import"./plus-BIwiTHae.js";import"./eye-BeouNTFJ.js";import"./database-Bh5bi1zG.js";import"./file-text-BR3Iz2MY.js";import"./triangle-alert-Bin-rNB-.js";import"./trash-2-CKY6oqXC.js";import"./x-CyT8dDxu.js";import"./house-C64cIi8I.js";import"./settings-DU1kDWgt.js";const P={title:"Design System/Atoms/Input/v1.0.0",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","error","success"]},inputSize:{control:"select",options:["sm","md","lg"]},disabled:{control:"boolean"}}},a={args:{placeholder:"Enter text..."}},s={args:{value:"Hello World",onChange:()=>{}}},o={args:{variant:"error",placeholder:"Invalid input"}},t={args:{variant:"success",placeholder:"Valid input"}},n={args:{inputSize:"sm",placeholder:"Small input"}},c={args:{inputSize:"lg",placeholder:"Large input"}},l={args:{disabled:!0,placeholder:"Disabled input"}},i={args:{leftIcon:e.jsx(u,{size:16}),placeholder:"Search..."}},p={args:{rightIcon:e.jsx(h,{size:16}),placeholder:"Enter email...",type:"email"}},d={args:{leftIcon:e.jsx(g,{size:16}),type:"password",placeholder:"Enter password..."}},m={render:()=>e.jsxs("div",{className:"flex flex-col gap-4 w-80",children:[e.jsx(r,{placeholder:"Default input"}),e.jsx(r,{variant:"error",placeholder:"Error state"}),e.jsx(r,{variant:"success",placeholder:"Success state"}),e.jsx(r,{leftIcon:e.jsx(S,{size:16}),placeholder:"With left icon"}),e.jsx(r,{rightIcon:e.jsx(u,{size:16}),placeholder:"With right icon"}),e.jsx(r,{disabled:!0,placeholder:"Disabled input"})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text...'
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    value: 'Hello World',
    onChange: () => {}
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    placeholder: 'Invalid input'
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    placeholder: 'Valid input'
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    inputSize: 'sm',
    placeholder: 'Small input'
  }
}`,...n.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    inputSize: 'lg',
    placeholder: 'Large input'
  }
}`,...c.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    placeholder: 'Disabled input'
  }
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    leftIcon: <Search size={16} />,
    placeholder: 'Search...'
  }
}`,...i.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    rightIcon: <Mail size={16} />,
    placeholder: 'Enter email...',
    type: 'email'
  }
}`,...p.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    leftIcon: <Lock size={16} />,
    type: 'password',
    placeholder: 'Enter password...'
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 w-80">
      <Input placeholder="Default input" />
      <Input variant="error" placeholder="Error state" />
      <Input variant="success" placeholder="Success state" />
      <Input leftIcon={<User size={16} />} placeholder="With left icon" />
      <Input rightIcon={<Search size={16} />} placeholder="With right icon" />
      <Input disabled placeholder="Disabled input" />
    </div>
}`,...m.parameters?.docs?.source}}};const _=["Default","WithValue","Error","Success","Small","Large","Disabled","WithLeftIcon","WithRightIcon","Password","AllVariants"];export{m as AllVariants,a as Default,l as Disabled,o as Error,c as Large,d as Password,n as Small,t as Success,i as WithLeftIcon,p as WithRightIcon,s as WithValue,_ as __namedExportsOrder,P as default};
