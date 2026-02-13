import{j as r,r as u}from"./iframe-D5evrB1t.js";import{E as t,u as p}from"./ErrorBoundary-DsfJsOaU.js";import"./preload-helper-D9Z9MdNV.js";import"./triangle-alert-Bin-rNB-.js";import"./createLucideIcon-CYL-vWIR.js";import"./house-C64cIi8I.js";const f={title:"Design System/Molecules/ErrorBoundary/v1.0.0",component:t,parameters:{layout:"fullscreen"}};function d({shouldThrow:e}){if(e)throw new Error("This is a test error from BuggyComponent!");return r.jsxs("div",{className:"p-8",children:[r.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Component is working fine"}),r.jsx("p",{children:"No errors here!"})]})}function h(){const[e,o]=u.useState(!1);return r.jsx(t,{children:r.jsxs("div",{className:"p-8",children:[r.jsx("h1",{className:"text-3xl font-bold mb-4",children:"Error Boundary Demo"}),r.jsx("p",{className:"mb-4",children:"Click the button below to trigger an error and see the error boundary in action."}),r.jsx("button",{onClick:()=>o(!0),className:"px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",children:"Trigger Error"}),r.jsx("div",{className:"mt-8",children:r.jsx(d,{shouldThrow:e})})]})})}const s={render:()=>r.jsx(h,{})},n={render:()=>r.jsx(t,{children:r.jsx(d,{shouldThrow:!0})})},a={render:()=>r.jsx(t,{fallback:(e,o)=>r.jsxs("div",{className:"p-8 bg-yellow-50 border border-yellow-200 rounded-lg",children:[r.jsx("h2",{className:"text-xl font-bold text-yellow-800 mb-2",children:"Custom Error Handler"}),r.jsxs("p",{className:"text-yellow-700 mb-4",children:["Error: ",e.message]}),r.jsx("button",{onClick:o,className:"px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700",children:"Reset Application"})]}),children:r.jsx(d,{shouldThrow:!0})})},l={render:()=>r.jsx(t,{onError:(e,o)=>{console.log("Error logged to monitoring service:",{error:e.toString(),componentStack:o.componentStack,timestamp:new Date().toISOString()})},children:r.jsx(d,{shouldThrow:!0})})};function g(){const{throwError:e}=p(),o=async()=>{try{await new Promise((i,m)=>{setTimeout(()=>m(new Error("Async operation failed!")),1e3)})}catch(i){e(i)}};return r.jsxs("div",{className:"p-8",children:[r.jsx("h2",{className:"text-2xl font-bold mb-4",children:"useErrorHandler Hook Demo"}),r.jsx("p",{className:"mb-4",children:"This demonstrates using the hook to throw errors programmatically."}),r.jsx("button",{onClick:o,className:"px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700",children:"Trigger Async Error"})]})}const c={render:()=>r.jsx(t,{children:r.jsx(g,{})})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <ErrorTrigger />
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <ErrorBoundary>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <ErrorBoundary fallback={(error, reset) => <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Custom Error Handler</h2>
          <p className="text-yellow-700 mb-4">Error: {error.message}</p>
          <button onClick={reset} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
            Reset Application
          </button>
        </div>}>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
}`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <ErrorBoundary onError={(error, errorInfo) => {
    console.log('Error logged to monitoring service:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }}>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <ErrorBoundary>
      <HookExample />
    </ErrorBoundary>
}`,...c.parameters?.docs?.source}}};const k=["Default","WithError","WithCustomFallback","WithErrorLogging","WithHook"];export{s as Default,a as WithCustomFallback,n as WithError,l as WithErrorLogging,c as WithHook,k as __namedExportsOrder,f as default};
