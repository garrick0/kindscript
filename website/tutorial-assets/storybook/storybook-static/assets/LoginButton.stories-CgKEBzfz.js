import{j as e}from"./iframe-D5evrB1t.js";import{B as b}from"./Button-DTif8qqZ.js";import{c as s}from"./cn-BQ1woUC9.js";import{U as i,L as w}from"./user-MOkHRdz7.js";import{S as Q}from"./shield-OUs8JC_K.js";import{S as C}from"./settings-DU1kDWgt.js";import{L as B}from"./Icon-BVdV1tcm.js";import"./preload-helper-D9Z9MdNV.js";import"./index-SGlD7ZDG.js";import"./createLucideIcon-CYL-vWIR.js";import"./play-CTq2X17R.js";import"./users-CaUii9q0.js";import"./message-square-DKF1MyHe.js";import"./star-C9rq_WCT.js";import"./plus-BIwiTHae.js";import"./eye-BeouNTFJ.js";import"./database-Bh5bi1zG.js";import"./file-text-BR3Iz2MY.js";import"./triangle-alert-Bin-rNB-.js";import"./trash-2-CKY6oqXC.js";import"./x-CyT8dDxu.js";import"./search-DrQCx2FU.js";import"./house-C64cIi8I.js";const U=({className:r="",showUserInfo:a=!1,variant:L="button",user:n,enhancedUser:o,isLoading:N=!1,hasRole:I=()=>!1,onLogin:S,onLogout:k,onProfileClick:q,onSettingsClick:T})=>N?e.jsx("div",{className:s("animate-pulse",r),children:e.jsx("div",{className:"h-8 w-20 bg-gray-200 rounded"})}):n?L==="menu"?e.jsxs("div",{className:s("relative group",r),children:[e.jsxs("button",{className:"flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors",children:[n.picture?e.jsx("img",{src:n.picture,alt:n.name||"User",className:"w-8 h-8 rounded-full"}):e.jsx("div",{className:"w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center",children:e.jsx(i,{size:16})}),a&&e.jsxs("div",{className:"text-left",children:[e.jsx("div",{className:"text-sm font-medium",children:n.name}),e.jsx("div",{className:"text-xs text-gray-500",children:o?.role})]})]}),e.jsxs("div",{className:"absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50",children:[e.jsx("div",{className:"p-3 border-b border-gray-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[n.picture?e.jsx("img",{src:n.picture,alt:n.name||"User",className:"w-10 h-10 rounded-full"}):e.jsx("div",{className:"w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center",children:e.jsx(i,{size:20})}),e.jsxs("div",{children:[e.jsx("div",{className:"font-medium",children:n.name}),e.jsx("div",{className:"text-sm text-gray-500",children:n.email}),e.jsxs("div",{className:"flex items-center gap-1 mt-1",children:[I("admin")&&e.jsxs("span",{className:"inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded",children:[e.jsx(Q,{size:10}),"Admin"]}),e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded capitalize",children:o?.role||"User"})]})]})]})}),e.jsxs("div",{className:"p-1",children:[e.jsxs("button",{onClick:q,className:"flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded",children:[e.jsx(i,{size:16}),"Profile"]}),e.jsxs("button",{onClick:T,className:"flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded",children:[e.jsx(C,{size:16}),"Settings"]})]}),e.jsx("div",{className:"p-1 border-t border-gray-100",children:e.jsxs("button",{onClick:k,className:"flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded",children:[e.jsx(w,{size:16}),"Sign Out"]})})]})]}):e.jsxs("div",{className:s("flex items-center gap-3",r),children:[a&&e.jsxs("div",{className:"flex items-center gap-2",children:[n.picture?e.jsx("img",{src:n.picture,alt:n.name||"User",className:"w-8 h-8 rounded-full"}):e.jsx("div",{className:"w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center",children:e.jsx(i,{size:16})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium",children:n.name}),e.jsx("div",{className:"text-xs text-gray-500",children:o?.role})]})]}),e.jsx(b,{onClick:k,variant:"secondary",leftIcon:"x",children:"Sign Out"})]}):e.jsx(b,{onClick:S,variant:"default",className:r,leftIcon:"user",children:"Sign In"}),y=({className:r="",user:a,isLoading:L=!1,onLogin:n,onLogout:o})=>L?e.jsx("div",{className:s("h-8 w-8 bg-gray-200 rounded-full animate-pulse",r)}):a?e.jsx("button",{onClick:o,className:s("flex items-center justify-center w-8 h-8","bg-gray-600 hover:bg-gray-700","text-white rounded-full","transition-colors duration-200",r),title:"Sign Out",children:e.jsx(w,{size:16})}):e.jsx("button",{onClick:n,className:s("flex items-center justify-center w-8 h-8","bg-blue-600 hover:bg-blue-700","text-white rounded-full","transition-colors duration-200",r),title:"Sign In",children:e.jsx(B,{size:16})});U.__docgenInfo={description:"",methods:[],displayName:"LoginButton",props:{className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},showUserInfo:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},variant:{required:!1,tsType:{name:"union",raw:"'button' | 'menu'",elements:[{name:"literal",value:"'button'"},{name:"literal",value:"'menu'"}]},description:"",defaultValue:{value:"'button'",computed:!1}},user:{required:!1,tsType:{name:"union",raw:`{
  name?: string | null;
  email?: string | null;
  picture?: string | null;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}`,signature:{properties:[{key:"name",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"email",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}},{key:"picture",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"null"}]},description:""},enhancedUser:{required:!1,tsType:{name:"union",raw:`{
  role?: string;
} | null`,elements:[{name:"signature",type:"object",raw:`{
  role?: string;
}`,signature:{properties:[{key:"role",value:{name:"string",required:!1}}]}},{name:"null"}]},description:""},isLoading:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},hasRole:{required:!1,tsType:{name:"signature",type:"function",raw:"(role: string) => boolean",signature:{arguments:[{type:{name:"string"},name:"role"}],return:{name:"boolean"}}},description:"",defaultValue:{value:"() => false",computed:!1}},onLogin:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onLogout:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onProfileClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onSettingsClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};y.__docgenInfo={description:"",methods:[],displayName:"QuickLoginButton",props:{className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},user:{required:!1,tsType:{name:"union",raw:"{ name?: string | null } | null",elements:[{name:"signature",type:"object",raw:"{ name?: string | null }",signature:{properties:[{key:"name",value:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}],required:!1}}]}},{name:"null"}]},description:""},isLoading:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onLogin:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onLogout:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const v=()=>()=>{},se={title:"Design System/Molecules/LoginButton/v1.0.0",component:U,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["button","menu"]}}},t={name:"John Doe",email:"john.doe@example.com",picture:"https://via.placeholder.com/150"},j={role:"developer"},l={args:{user:null,onLogin:v()}},u={args:{user:t,enhancedUser:j,variant:"button",onLogout:()=>console.log("Logout clicked")}},c={args:{user:t,enhancedUser:j,variant:"menu",showUserInfo:!0,onLogout:v(),onProfileClick:v(),onSettingsClick:v()}},d={args:{user:t,enhancedUser:{role:"admin"},variant:"menu",showUserInfo:!0,hasRole:r=>r==="admin",onLogout:()=>console.log("Logout clicked")}},m={args:{isLoading:!0}},g={args:{user:t,enhancedUser:j,showUserInfo:!0,variant:"button",onLogout:()=>console.log("Logout clicked")}},p={args:{user:{...t,picture:null},enhancedUser:j,variant:"menu",showUserInfo:!0,onLogout:()=>console.log("Logout clicked")}},f={render:()=>e.jsx(y,{onLogin:()=>console.log("Quick login clicked")})},x={render:()=>e.jsx(y,{user:t,onLogout:()=>console.log("Quick logout clicked")})},h={render:()=>e.jsx(y,{isLoading:!0})};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    user: null,
    onLogin: fn()
  }
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement, args }) => { ... }
}`,...l.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    user: mockUser,
    enhancedUser: mockEnhancedUser,
    variant: 'button',
    onLogout: () => console.log('Logout clicked')
  }
}`,...u.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    user: mockUser,
    enhancedUser: mockEnhancedUser,
    variant: 'menu',
    showUserInfo: true,
    onLogout: fn(),
    onProfileClick: fn(),
    onSettingsClick: fn()
  }
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement, args }) => { ... }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    user: mockUser,
    enhancedUser: {
      role: 'admin'
    },
    variant: 'menu',
    showUserInfo: true,
    hasRole: role => role === 'admin',
    onLogout: () => console.log('Logout clicked')
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    isLoading: true
  }
}`,...m.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    user: mockUser,
    enhancedUser: mockEnhancedUser,
    showUserInfo: true,
    variant: 'button',
    onLogout: () => console.log('Logout clicked')
  }
}`,...g.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    user: {
      ...mockUser,
      picture: null
    },
    enhancedUser: mockEnhancedUser,
    variant: 'menu',
    showUserInfo: true,
    onLogout: () => console.log('Logout clicked')
  }
}`,...p.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <QuickLoginButton onLogin={() => console.log('Quick login clicked')} />
}`,...f.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <QuickLoginButton user={mockUser} onLogout={() => console.log('Quick logout clicked')} />
}`,...x.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <QuickLoginButton isLoading={true} />
}`,...h.parameters?.docs?.source}}};const te=["LoggedOut","LoggedInButton","LoggedInMenu","AdminUser","Loading","WithUserInfo","NoProfilePicture","QuickLoggedOut","QuickLoggedIn","QuickLoading"];export{d as AdminUser,m as Loading,u as LoggedInButton,c as LoggedInMenu,l as LoggedOut,p as NoProfilePicture,h as QuickLoading,x as QuickLoggedIn,f as QuickLoggedOut,g as WithUserInfo,te as __namedExportsOrder,se as default};
