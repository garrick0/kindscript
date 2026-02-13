import{r as p,j as e,R as de}from"./iframe-D5evrB1t.js";import{B as O}from"./Button-DTif8qqZ.js";import{C as T}from"./Card-C_kcNzkr.js";import{c as Pe}from"./index-SGlD7ZDG.js";import{c as w}from"./cn-BQ1woUC9.js";import{I as ue}from"./Input-CY5-kxsz.js";import{P as B,G as je}from"./package-voSg-YqC.js";import{S as re}from"./search-DrQCx2FU.js";import{U as Ke}from"./user-MOkHRdz7.js";import{C as Ze,E as be}from"./eye-BeouNTFJ.js";import{c as me}from"./createLucideIcon-CYL-vWIR.js";import{C as ne,I as $,a as Q,F as J,Z as ie,b as le,T as Fe,c as He,d as We,D as Ge,e as Je}from"./Icon-BVdV1tcm.js";import{C as q}from"./database-Bh5bi1zG.js";import{C as U,a as Ie}from"./plus-BIwiTHae.js";import{F as z}from"./file-code-Dg1sg6wZ.js";import{S as X}from"./shield-OUs8JC_K.js";import{S as K}from"./settings-DU1kDWgt.js";import{P as he,a as Xe}from"./play-CTq2X17R.js";import{R as Y,T as Z}from"./triangle-alert-Bin-rNB-.js";import{F as Ye}from"./file-text-BR3Iz2MY.js";var se=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(s){return this.listeners.add(s),this.onSubscribe(),()=>{this.listeners.delete(s),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}},W=typeof window>"u"||"Deno"in globalThis;function ee(){}function Ne(s){return typeof s=="number"&&s>=0&&s!==1/0}function et(s,t){return Math.max(s+(t||0)-Date.now(),0)}function H(s,t){return typeof s=="function"?s(t):s}function P(s,t){return typeof s=="function"?s(t):s}function we(s){return JSON.stringify(s,(t,a)=>oe(a)?Object.keys(a).sort().reduce((n,i)=>(n[i]=a[i],n),{}):a)}function Ae(s,t){if(s===t)return s;const a=ke(s)&&ke(t);if(a||oe(s)&&oe(t)){const n=a?s:Object.keys(s),i=n.length,c=a?t:Object.keys(t),o=c.length,g=a?[]:{},f=new Set(n);let N=0;for(let v=0;v<o;v++){const j=a?v:c[v];(!a&&f.has(j)||a)&&s[j]===void 0&&t[j]===void 0?(g[j]=void 0,N++):(g[j]=Ae(s[j],t[j]),g[j]===s[j]&&s[j]!==void 0&&N++)}return i===o&&N===i?s:g}return t}function te(s,t){if(!t||Object.keys(s).length!==Object.keys(t).length)return!1;for(const a in s)if(s[a]!==t[a])return!1;return!0}function ke(s){return Array.isArray(s)&&s.length===Object.keys(s).length}function oe(s){if(!Ce(s))return!1;const t=s.constructor;if(t===void 0)return!0;const a=t.prototype;return!(!Ce(a)||!a.hasOwnProperty("isPrototypeOf")||Object.getPrototypeOf(s)!==Object.prototype)}function Ce(s){return Object.prototype.toString.call(s)==="[object Object]"}function Me(s,t,a){return typeof a.structuralSharing=="function"?a.structuralSharing(s,t):a.structuralSharing!==!1?Ae(s,t):t}function qe(s,t){return typeof s=="function"?s(...t):!!s}var tt=class extends se{#t;#e;#s;constructor(){super(),this.#s=s=>{if(!W&&window.addEventListener){const t=()=>s();return window.addEventListener("visibilitychange",t,!1),()=>{window.removeEventListener("visibilitychange",t)}}}}onSubscribe(){this.#e||this.setEventListener(this.#s)}onUnsubscribe(){this.hasListeners()||(this.#e?.(),this.#e=void 0)}setEventListener(s){this.#s=s,this.#e?.(),this.#e=s(t=>{typeof t=="boolean"?this.setFocused(t):this.onFocus()})}setFocused(s){this.#t!==s&&(this.#t=s,this.onFocus())}onFocus(){const s=this.isFocused();this.listeners.forEach(t=>{t(s)})}isFocused(){return typeof this.#t=="boolean"?this.#t:globalThis.document?.visibilityState!=="hidden"}},st=new tt,at=class extends se{#t=!0;#e;#s;constructor(){super(),this.#s=s=>{if(!W&&window.addEventListener){const t=()=>s(!0),a=()=>s(!1);return window.addEventListener("online",t,!1),window.addEventListener("offline",a,!1),()=>{window.removeEventListener("online",t),window.removeEventListener("offline",a)}}}}onSubscribe(){this.#e||this.setEventListener(this.#s)}onUnsubscribe(){this.hasListeners()||(this.#e?.(),this.#e=void 0)}setEventListener(s){this.#s=s,this.#e?.(),this.#e=s(this.setOnline.bind(this))}setOnline(s){this.#t!==s&&(this.#t=s,this.listeners.forEach(a=>{a(s)}))}isOnline(){return this.#t}},nt=new at;function Te(){let s,t;const a=new Promise((i,c)=>{s=i,t=c});a.status="pending",a.catch(()=>{});function n(i){Object.assign(a,i),delete a.resolve,delete a.reject}return a.resolve=i=>{n({status:"fulfilled",value:i}),s(i)},a.reject=i=>{n({status:"rejected",reason:i}),t(i)},a}function rt(s){return(s??"online")==="online"?nt.isOnline():!0}var it=s=>setTimeout(s,0);function lt(){let s=[],t=0,a=g=>{g()},n=g=>{g()},i=it;const c=g=>{t?s.push(g):i(()=>{a(g)})},o=()=>{const g=s;s=[],g.length&&i(()=>{n(()=>{g.forEach(f=>{a(f)})})})};return{batch:g=>{let f;t++;try{f=g()}finally{t--,t||o()}return f},batchCalls:g=>(...f)=>{c(()=>{g(...f)})},schedule:c,setNotifyFunction:g=>{a=g},setBatchNotifyFunction:g=>{n=g},setScheduler:g=>{i=g}}}var ae=lt();function ot(s,t){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:rt(t.networkMode)?"fetching":"paused",...s===void 0&&{error:null,status:"pending"}}}function ct(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}var dt=class extends se{constructor(s,t){super(),this.options=t,this.#t=s,this.#l=null,this.#i=Te(),this.bindMethods(),this.setOptions(t)}#t;#e=void 0;#s=void 0;#a=void 0;#n;#r;#i;#l;#p;#m;#h;#c;#d;#o;#x=new Set;bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(this.#e.addObserver(this),Se(this.#e,this.options)?this.#u():this.updateResult(),this.#v())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return ce(this.#e,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return ce(this.#e,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#j(),this.#b(),this.#e.removeObserver(this)}setOptions(s){const t=this.options,a=this.#e;if(this.options=this.#t.defaultQueryOptions(s),this.options.enabled!==void 0&&typeof this.options.enabled!="boolean"&&typeof this.options.enabled!="function"&&typeof P(this.options.enabled,this.#e)!="boolean")throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");this.#N(),this.#e.setOptions(this.options),t._defaulted&&!te(this.options,t)&&this.#t.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#e,observer:this});const n=this.hasListeners();n&&Re(this.#e,a,this.options,t)&&this.#u(),this.updateResult(),n&&(this.#e!==a||P(this.options.enabled,this.#e)!==P(t.enabled,this.#e)||H(this.options.staleTime,this.#e)!==H(t.staleTime,this.#e))&&this.#g();const i=this.#f();n&&(this.#e!==a||P(this.options.enabled,this.#e)!==P(t.enabled,this.#e)||i!==this.#o)&&this.#y(i)}getOptimisticResult(s){const t=this.#t.getQueryCache().build(this.#t,s),a=this.createResult(t,s);return mt(this,a)&&(this.#a=a,this.#r=this.options,this.#n=this.#e.state),a}getCurrentResult(){return this.#a}trackResult(s,t){return new Proxy(s,{get:(a,n)=>(this.trackProp(n),t?.(n),n==="promise"&&!this.options.experimental_prefetchInRender&&this.#i.status==="pending"&&this.#i.reject(new Error("experimental_prefetchInRender feature flag is not enabled")),Reflect.get(a,n))})}trackProp(s){this.#x.add(s)}getCurrentQuery(){return this.#e}refetch({...s}={}){return this.fetch({...s})}fetchOptimistic(s){const t=this.#t.defaultQueryOptions(s),a=this.#t.getQueryCache().build(this.#t,t);return a.fetch().then(()=>this.createResult(a,t))}fetch(s){return this.#u({...s,cancelRefetch:s.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#a))}#u(s){this.#N();let t=this.#e.fetch(this.options,s);return s?.throwOnError||(t=t.catch(ee)),t}#g(){this.#j();const s=H(this.options.staleTime,this.#e);if(W||this.#a.isStale||!Ne(s))return;const a=et(this.#a.dataUpdatedAt,s)+1;this.#c=setTimeout(()=>{this.#a.isStale||this.updateResult()},a)}#f(){return(typeof this.options.refetchInterval=="function"?this.options.refetchInterval(this.#e):this.options.refetchInterval)??!1}#y(s){this.#b(),this.#o=s,!(W||P(this.options.enabled,this.#e)===!1||!Ne(this.#o)||this.#o===0)&&(this.#d=setInterval(()=>{(this.options.refetchIntervalInBackground||st.isFocused())&&this.#u()},this.#o))}#v(){this.#g(),this.#y(this.#f())}#j(){this.#c&&(clearTimeout(this.#c),this.#c=void 0)}#b(){this.#d&&(clearInterval(this.#d),this.#d=void 0)}createResult(s,t){const a=this.#e,n=this.options,i=this.#a,c=this.#n,o=this.#r,f=s!==a?s.state:this.#s,{state:N}=s;let v={...N},j=!1,h;if(t._optimisticResults){const M=this.hasListeners(),F=!M&&Se(s,t),u=M&&Re(s,a,t,n);(F||u)&&(v={...v,...ot(N.data,s.options)}),t._optimisticResults==="isRestoring"&&(v.fetchStatus="idle")}let{error:E,errorUpdatedAt:l,status:m}=v;h=v.data;let r=!1;if(t.placeholderData!==void 0&&h===void 0&&m==="pending"){let M;i?.isPlaceholderData&&t.placeholderData===o?.placeholderData?(M=i.data,r=!0):M=typeof t.placeholderData=="function"?t.placeholderData(this.#h?.state.data,this.#h):t.placeholderData,M!==void 0&&(m="success",h=Me(i?.data,M,t),j=!0)}if(t.select&&h!==void 0&&!r)if(i&&h===c?.data&&t.select===this.#p)h=this.#m;else try{this.#p=t.select,h=t.select(h),h=Me(i?.data,h,t),this.#m=h,this.#l=null}catch(M){this.#l=M}this.#l&&(E=this.#l,h=this.#m,l=Date.now(),m="error");const y=v.fetchStatus==="fetching",x=m==="pending",d=m==="error",C=x&&y,b=h!==void 0,R={status:m,fetchStatus:v.fetchStatus,isPending:x,isSuccess:m==="success",isError:d,isInitialLoading:C,isLoading:C,data:h,dataUpdatedAt:v.dataUpdatedAt,error:E,errorUpdatedAt:l,failureCount:v.fetchFailureCount,failureReason:v.fetchFailureReason,errorUpdateCount:v.errorUpdateCount,isFetched:v.dataUpdateCount>0||v.errorUpdateCount>0,isFetchedAfterMount:v.dataUpdateCount>f.dataUpdateCount||v.errorUpdateCount>f.errorUpdateCount,isFetching:y,isRefetching:y&&!x,isLoadingError:d&&!b,isPaused:v.fetchStatus==="paused",isPlaceholderData:j,isRefetchError:d&&b,isStale:xe(s,t),refetch:this.refetch,promise:this.#i,isEnabled:P(t.enabled,s)!==!1};if(this.options.experimental_prefetchInRender){const M=A=>{R.status==="error"?A.reject(R.error):R.data!==void 0&&A.resolve(R.data)},F=()=>{const A=this.#i=R.promise=Te();M(A)},u=this.#i;switch(u.status){case"pending":s.queryHash===a.queryHash&&M(u);break;case"fulfilled":(R.status==="error"||R.data!==u.value)&&F();break;case"rejected":(R.status!=="error"||R.error!==u.reason)&&F();break}}return R}updateResult(){const s=this.#a,t=this.createResult(this.#e,this.options);if(this.#n=this.#e.state,this.#r=this.options,this.#n.data!==void 0&&(this.#h=this.#e),te(t,s))return;this.#a=t;const a=()=>{if(!s)return!0;const{notifyOnChangeProps:n}=this.options,i=typeof n=="function"?n():n;if(i==="all"||!i&&!this.#x.size)return!0;const c=new Set(i??this.#x);return this.options.throwOnError&&c.add("error"),Object.keys(this.#a).some(o=>{const g=o;return this.#a[g]!==s[g]&&c.has(g)})};this.#w({listeners:a()})}#N(){const s=this.#t.getQueryCache().build(this.#t,this.options);if(s===this.#e)return;const t=this.#e;this.#e=s,this.#s=s.state,this.hasListeners()&&(t?.removeObserver(this),s.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#v()}#w(s){ae.batch(()=>{s.listeners&&this.listeners.forEach(t=>{t(this.#a)}),this.#t.getQueryCache().notify({query:this.#e,type:"observerResultsUpdated"})})}};function ut(s,t){return P(t.enabled,s)!==!1&&s.state.data===void 0&&!(s.state.status==="error"&&t.retryOnMount===!1)}function Se(s,t){return ut(s,t)||s.state.data!==void 0&&ce(s,t,t.refetchOnMount)}function ce(s,t,a){if(P(t.enabled,s)!==!1&&H(t.staleTime,s)!=="static"){const n=typeof a=="function"?a(s):a;return n==="always"||n!==!1&&xe(s,t)}return!1}function Re(s,t,a,n){return(s!==t||P(n.enabled,s)===!1)&&(!a.suspense||s.state.status!=="error")&&xe(s,a)}function xe(s,t){return P(t.enabled,s)!==!1&&s.isStaleByTime(H(t.staleTime,s))}function mt(s,t){return!te(s.getCurrentResult(),t)}var ht=class extends se{#t;#e=void 0;#s;#a;constructor(s,t){super(),this.#t=s,this.setOptions(t),this.bindMethods(),this.#n()}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(s){const t=this.options;this.options=this.#t.defaultMutationOptions(s),te(this.options,t)||this.#t.getMutationCache().notify({type:"observerOptionsUpdated",mutation:this.#s,observer:this}),t?.mutationKey&&this.options.mutationKey&&we(t.mutationKey)!==we(this.options.mutationKey)?this.reset():this.#s?.state.status==="pending"&&this.#s.setOptions(this.options)}onUnsubscribe(){this.hasListeners()||this.#s?.removeObserver(this)}onMutationUpdate(s){this.#n(),this.#r(s)}getCurrentResult(){return this.#e}reset(){this.#s?.removeObserver(this),this.#s=void 0,this.#n(),this.#r()}mutate(s,t){return this.#a=t,this.#s?.removeObserver(this),this.#s=this.#t.getMutationCache().build(this.#t,this.options),this.#s.addObserver(this),this.#s.execute(s)}#n(){const s=this.#s?.state??ct();this.#e={...s,isPending:s.status==="pending",isSuccess:s.status==="success",isError:s.status==="error",isIdle:s.status==="idle",mutate:this.mutate,reset:this.reset}}#r(s){ae.batch(()=>{if(this.#a&&this.hasListeners()){const t=this.#e.variables,a=this.#e.context;s?.type==="success"?(this.#a.onSuccess?.(s.data,t,a),this.#a.onSettled?.(s.data,null,t,a)):s?.type==="error"&&(this.#a.onError?.(s.error,t,a),this.#a.onSettled?.(void 0,s.error,t,a))}this.listeners.forEach(t=>{t(this.#e)})})}},xt=p.createContext(void 0),pe=s=>{const t=p.useContext(xt);if(!t)throw new Error("No QueryClient set, use QueryClientProvider to set one");return t},De=p.createContext(!1),pt=()=>p.useContext(De);De.Provider;function gt(){let s=!1;return{clearReset:()=>{s=!1},reset:()=>{s=!0},isReset:()=>s}}var ft=p.createContext(gt()),yt=()=>p.useContext(ft),vt=(s,t)=>{(s.suspense||s.throwOnError||s.experimental_prefetchInRender)&&(t.isReset()||(s.retryOnMount=!1))},jt=s=>{p.useEffect(()=>{s.clearReset()},[s])},bt=({result:s,errorResetBoundary:t,throwOnError:a,query:n,suspense:i})=>s.isError&&!t.isReset()&&!s.isFetching&&n&&(i&&s.data===void 0||qe(a,[s.error,n])),Nt=s=>{if(s.suspense){const t=n=>n==="static"?n:Math.max(n??1e3,1e3),a=s.staleTime;s.staleTime=typeof a=="function"?(...n)=>t(a(...n)):t(a),typeof s.gcTime=="number"&&(s.gcTime=Math.max(s.gcTime,1e3))}},wt=(s,t)=>s.isLoading&&s.isFetching&&!t,kt=(s,t)=>s?.suspense&&t.isPending,Ee=(s,t,a)=>t.fetchOptimistic(s).catch(()=>{a.clearReset()});function Ct(s,t,a){const n=pt(),i=yt(),c=pe(),o=c.defaultQueryOptions(s);c.getDefaultOptions().queries?._experimental_beforeQuery?.(o),o._optimisticResults=n?"isRestoring":"optimistic",Nt(o),vt(o,i),jt(i);const g=!c.getQueryCache().get(o.queryHash),[f]=p.useState(()=>new t(c,o)),N=f.getOptimisticResult(o),v=!n&&s.subscribed!==!1;if(p.useSyncExternalStore(p.useCallback(j=>{const h=v?f.subscribe(ae.batchCalls(j)):ee;return f.updateResult(),h},[f,v]),()=>f.getCurrentResult(),()=>f.getCurrentResult()),p.useEffect(()=>{f.setOptions(o)},[o,f]),kt(o,N))throw Ee(o,f,i);if(bt({result:N,errorResetBoundary:i,throwOnError:o.throwOnError,query:c.getQueryCache().get(o.queryHash),suspense:o.suspense}))throw N.error;return c.getDefaultOptions().queries?._experimental_afterQuery?.(o,N),o.experimental_prefetchInRender&&!W&&wt(N,n)&&(g?Ee(o,f,i):c.getQueryCache().get(o.queryHash)?.promise)?.catch(ee).finally(()=>{f.updateResult()}),o.notifyOnChangeProps?N:f.trackResult(N)}function G(s,t){return Ct(s,dt)}function _(s,t){const a=pe(),[n]=p.useState(()=>new ht(a,s));p.useEffect(()=>{n.setOptions(s)},[n,s]);const i=p.useSyncExternalStore(p.useCallback(o=>n.subscribe(ae.batchCalls(o)),[n]),()=>n.getCurrentResult(),()=>n.getCurrentResult()),c=p.useCallback((o,g)=>{n.mutate(o,g).catch(ee)},[n]);if(i.error&&qe(n.options.throwOnError,[i.error]))throw i.error;return{...i,mutate:c,mutateAsync:i.mutate}}/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mt=[["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",key:"k3hazp"}]],Tt=me("book",Mt);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m9 15 2 2 4-4",key:"1grp1n"}]],Oe=me("file-check",St);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",key:"vktsd0"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor",key:"kqv944"}]],Et=me("tag",Rt),Ot=Pe("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80",secondary:"border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",destructive:"border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/80",outline:"text-gray-950 dark:text-gray-50"}},defaultVariants:{variant:"default"}});function S({className:s,variant:t,...a}){return e.jsx("div",{className:w(Ot({variant:t}),s),...a})}S.__docgenInfo={description:"",methods:[],displayName:"Badge",composes:["VariantProps"]};const ge=p.forwardRef(({className:s,value:t=0,max:a=100,...n},i)=>{const c=Math.min(Math.max(t/a*100,0),100);return e.jsx("div",{ref:i,role:"progressbar","aria-valuenow":t,"aria-valuemin":0,"aria-valuemax":a,className:w("relative h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",s),...n,children:e.jsx("div",{className:"h-full w-full flex-1 bg-gray-900 transition-all dark:bg-gray-50",style:{transform:`translateX(-${100-c}%)`}})})});ge.displayName="Progress";ge.__docgenInfo={description:"",methods:[],displayName:"Progress",props:{value:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"0",computed:!1}},max:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"100",computed:!1}}}};const fe=de.createContext({value:"",onChange:()=>{}}),Le=({defaultValue:s="",value:t,onValueChange:a,className:n,children:i})=>{const[c,o]=p.useState(s),g=t!==void 0?t:c,f=N=>{t===void 0&&o(N),a?.(N)};return e.jsx(fe.Provider,{value:{value:g,onChange:f},children:e.jsx("div",{className:n,children:i})})},$e=({className:s,children:t})=>e.jsx("div",{className:w("inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",s),children:t}),D=({value:s,className:t,children:a})=>{const{value:n,onChange:i}=de.useContext(fe),c=n===s;return e.jsx("button",{onClick:()=>i(s),className:w("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",c&&"bg-white text-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50",t),children:a})},L=({value:s,className:t,children:a})=>{const{value:n}=de.useContext(fe);return n!==s?null:e.jsx("div",{className:t,children:a})};Le.__docgenInfo={description:"",methods:[],displayName:"Tabs",props:{defaultValue:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},value:{required:!1,tsType:{name:"string"},description:""},onValueChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};$e.__docgenInfo={description:"",methods:[],displayName:"TabsList",props:{className:{required:!1,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};D.__docgenInfo={description:"",methods:[],displayName:"TabsTrigger",props:{value:{required:!0,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};L.__docgenInfo={description:"",methods:[],displayName:"TabsContent",props:{value:{required:!0,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};class Pt{constructor(){this.baseUrl="/api/migrations"}async getMigrations(){const t=await fetch(this.baseUrl);if(!t.ok)throw new Error(`Failed to fetch migrations: ${t.statusText}`);const a=await t.json();return Array.isArray(a)?a:a.migrations||a||[]}async getMigration(t){const a=await fetch(`${this.baseUrl}/${t}`);if(!a.ok){if(a.status===404)return null;throw new Error(`Failed to fetch migration ${t}: ${a.statusText}`)}const n=await a.json();return n.migration||n}async getComplianceReport(t){const a=await fetch(`${this.baseUrl}/${t}/compliance`);if(!a.ok)throw new Error(`Failed to fetch compliance report: ${a.statusText}`);const n=await a.json();return n.compliance||n}async getMigrationHistory(){const t=await fetch(`${this.baseUrl}/history`);if(!t.ok)throw new Error(`Failed to fetch migration history: ${t.statusText}`);const a=await t.json();return Array.isArray(a)?a:a.history||a||[]}async startMigration(t){const a=await fetch(`${this.baseUrl}/${t}/start`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!a.ok)throw new Error(`Failed to start migration: ${a.statusText}`)}async pauseMigration(t){const a=await fetch(`${this.baseUrl}/${t}/pause`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!a.ok)throw new Error(`Failed to pause migration: ${a.statusText}`)}async runComplianceCheck(t){const a=await fetch(`${this.baseUrl}/${t}/check-compliance`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!a.ok)throw new Error(`Failed to run compliance check: ${a.statusText}`);const n=await a.json();return n.compliance||n}async runAutoMigration(t){const a=await fetch(`${this.baseUrl}/${t}/auto-migrate`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!a.ok)throw new Error(`Failed to run auto-migration: ${a.statusText}`);const n=await a.json();return n.result||n}async exportReport(t){const a=await fetch(`${this.baseUrl}/${t}/export`);if(!a.ok)throw new Error(`Failed to export report: ${a.statusText}`);return a.json()}async migrateFile(t,a){return console.log(`Migrating file ${a} for migration ${t}`),Promise.resolve()}async validateFile(t,a){return console.log(`Validating file ${a} for migration ${t}`),Promise.resolve(!0)}}const I=new Pt,Ft=()=>{const s=pe(),[t,a]=p.useState(!1),[n,i]=p.useState(null),{data:c=[],isLoading:o}=G({queryKey:["migrations"],queryFn:()=>I.getMigrations(),refetchInterval:t?5e3:!1}),{data:g}=G({queryKey:["migration",n],queryFn:()=>n?I.getMigration(n):null,enabled:!!n}),{data:f}=G({queryKey:["compliance",n],queryFn:()=>n?I.getComplianceReport(n):null,enabled:!!n}),{data:N=[]}=G({queryKey:["migration-history"],queryFn:()=>I.getMigrationHistory()}),v=_({mutationFn:b=>I.startMigration(b),onSuccess:()=>{a(!0),s.invalidateQueries({queryKey:["migrations"]}),s.invalidateQueries({queryKey:["migration-history"]})}}),j=_({mutationFn:b=>I.pauseMigration(b),onSuccess:()=>{a(!1),s.invalidateQueries({queryKey:["migrations"]})}}),h=_({mutationFn:b=>I.runComplianceCheck(b),onSuccess:b=>{s.setQueryData(["compliance",n],b),s.invalidateQueries({queryKey:["migrations"]}),s.invalidateQueries({queryKey:["migration-history"]})}}),E=_({mutationFn:b=>I.runAutoMigration(b),onSuccess:()=>{s.invalidateQueries({queryKey:["migrations"]}),s.invalidateQueries({queryKey:["migration-history"]}),s.invalidateQueries({queryKey:["compliance"]})}}),l=_({mutationFn:()=>I.exportReport(n||""),onSuccess:b=>{const k=new Blob([JSON.stringify(b,null,2)],{type:"application/json"}),R=URL.createObjectURL(k),M=document.createElement("a");M.href=R,M.download=`migration-report-${new Date().toISOString()}.json`,M.click(),URL.revokeObjectURL(R)}}),m=p.useCallback(b=>{v.mutate(b)},[v]),r=p.useCallback(()=>{n&&j.mutate(n)},[n,j]),y=p.useCallback(b=>{h.mutate(b)},[h]),x=p.useCallback(b=>{E.mutate(b)},[E]),d=p.useCallback(()=>{l.mutate()},[l]),C=p.useCallback(()=>{s.invalidateQueries({queryKey:["migrations"]}),s.invalidateQueries({queryKey:["compliance"]}),s.invalidateQueries({queryKey:["migration-history"]})},[s]);return p.useEffect(()=>{if(c.length>0&&!n){const b=c.find(k=>k.status==="in-progress")||c[0];i(b.id)}},[c,n]),p.useEffect(()=>{const b=c.find(k=>k.status==="in-progress");a(!!b)},[c]),{migrations:c,activeMigration:g,complianceData:f,migrationHistory:N,isRunning:t,isLoading:o,startMigration:m,pauseMigration:r,runComplianceCheck:y,runAutoMigration:x,exportReport:d,refreshData:C,isStarting:v.isPending,isPausing:j.isPending,isCheckingCompliance:h.isPending,isAutoMigrating:E.isPending,isExporting:l.isPending}},It=Pe("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50",destructive:"border-red-500/50 text-red-600 dark:border-red-500 [&>svg]:text-red-600 dark:border-red-900/50 dark:text-red-900 dark:dark:border-red-900 dark:[&>svg]:text-red-900"}},defaultVariants:{variant:"default"}}),ye=p.forwardRef(({className:s,variant:t,...a},n)=>e.jsx("div",{ref:n,role:"alert",className:w(It({variant:t}),s),...a}));ye.displayName="Alert";const Ue=p.forwardRef(({className:s,...t},a)=>e.jsx("h5",{ref:a,className:w("mb-1 font-medium leading-none tracking-tight",s),...t}));Ue.displayName="AlertTitle";const ve=p.forwardRef(({className:s,...t},a)=>e.jsx("div",{ref:a,className:w("text-sm [&_p]:leading-relaxed",s),...t}));ve.displayName="AlertDescription";ye.__docgenInfo={description:"",methods:[],displayName:"Alert"};Ue.__docgenInfo={description:"",methods:[],displayName:"AlertTitle"};ve.__docgenInfo={description:"",methods:[],displayName:"AlertDescription"};const Ve=[{id:"pages-v1",name:"Pages (Versioned)",description:"Self-contained page components with versioning support",version:"1.0.0",discovery:{basePattern:"apps/storybook/src/components/Pages",instancePattern:"*/v[0-9]+.[0-9]+.[0-9]+",filePatterns:{required:["ui/*.tsx","metadata.json"],optional:["README.md","domain/*.ts","data/*.ts","validation/*.ts","types/*.ts","*.test.tsx","*.stories.tsx","dependencies.json"],forbidden:["*.tmp","*.backup","node_modules"]}},structure:{folders:[{path:"ui",required:!0,description:"UI components and views"},{path:"domain",required:!1,description:"Business logic and hooks"},{path:"data",required:!1,description:"Data services and API calls"},{path:"validation",required:!1,description:"Validation schemas using Zod"},{path:"types",required:!1,description:"TypeScript type definitions"}],files:[{path:"metadata.json",required:!0,validation:{schema:"page-metadata-schema"}},{path:"README.md",required:!1}],dependencies:[]},assertions:[{id:"page-eslint",name:"ESLint Compliance",description:"Check ESLint rules for all TypeScript/JavaScript files",type:"eslint",config:{eslint:{rules:{"no-console":"error","no-unused-vars":"error","@typescript-eslint/no-explicit-any":"warn"}}},execution:{runOn:"manual",timeout:3e4,cache:!0,parallel:!0},severity:"error",autoFix:!0},{id:"page-tests",name:"Test Coverage",description:"Ensure adequate test coverage",type:"test",config:{test:{runner:"vitest",pattern:"*.test.{ts,tsx}",coverage:{threshold:70,type:"lines"}}},execution:{runOn:"manual",timeout:6e4,cache:!1,parallel:!1},severity:"warning"},{id:"page-structure",name:"Folder Structure",description:"Validate required folder structure",type:"structure",config:{structure:{requiredFiles:["metadata.json"],requiredFolders:["ui"],namingConvention:"PascalCase"}},execution:{runOn:"manual",timeout:5e3,cache:!0,parallel:!0},severity:"error"},{id:"page-dependencies",name:"Dependency Check",description:"Validate dependencies are properly managed",type:"dependency",config:{dependency:{allowed:["react","react-dom","@induction/shared","lucide-react"],forbidden:["jquery","lodash"],maxCount:20}},execution:{runOn:"manual",timeout:1e4,cache:!0,parallel:!0},severity:"warning"}],template:{id:"page-template-v1",name:"Page Template",description:"Template for creating new page modules",files:[{path:"ui/{{name}}Page.tsx",template:"page-component.template"},{path:"domain/use{{name}}.ts",template:"page-hook.template"},{path:"data/{{name.lower}}.service.ts",template:"page-service.template"},{path:"types/{{name.lower}}.types.ts",template:"page-types.template"},{path:"metadata.json",template:"page-metadata.template"},{path:"README.md",template:"page-readme.template"}]},metadata:{author:"system",createdAt:"2025-01-01T00:00:00Z",updatedAt:"2025-01-01T00:00:00Z",tags:["pages","ui","frontend","components"],documentation:"/docs/module-types/pages.md"}},{id:"organisms-v1",name:"Organisms (Versioned)",description:"Complex UI components with business logic",version:"1.0.0",discovery:{basePattern:"apps/storybook/src/components/organisms",instancePattern:"*/v[0-9]+.[0-9]+.[0-9]+",filePatterns:{required:["*.tsx","*.types.ts"],optional:["*.service.ts","*.validation.ts","*.test.tsx","*.stories.tsx","use*.ts"],forbidden:["*.tmp","*.backup"]}},structure:{folders:[],files:[{path:"{{name}}.tsx",required:!0},{path:"{{name.lower}}.types.ts",required:!0}],dependencies:[]},assertions:[{id:"organism-eslint",name:"ESLint Compliance",description:"Check ESLint rules",type:"eslint",config:{eslint:{rules:{"no-console":"error","react-hooks/rules-of-hooks":"error","react-hooks/exhaustive-deps":"warn"}}},execution:{runOn:"manual",timeout:3e4,cache:!0,parallel:!0},severity:"error",autoFix:!0},{id:"organism-complexity",name:"Complexity Check",description:"Ensure components are not too complex",type:"custom",config:{custom:{script:"check-complexity",args:["--max","15"],expectedOutput:"pass"}},execution:{runOn:"manual",timeout:1e4,cache:!0,parallel:!0},severity:"warning"}],metadata:{author:"system",createdAt:"2025-01-01T00:00:00Z",updatedAt:"2025-01-01T00:00:00Z",tags:["organisms","ui","frontend","components"],documentation:"/docs/module-types/organisms.md"}},{id:"api-routes-v1",name:"API Routes",description:"Next.js API route handlers",version:"1.0.0",discovery:{basePattern:"apps/platform/src/app/api",instancePattern:"*/route.ts",filePatterns:{required:["route.ts"],optional:["route.test.ts","types.ts","validation.ts"],forbidden:["*.tmp"]}},structure:{folders:[],files:[{path:"route.ts",required:!0,validation:{customValidator:"api-route-validator"}}],dependencies:[]},assertions:[{id:"api-eslint",name:"ESLint Compliance",description:"Check ESLint rules for API routes",type:"eslint",config:{eslint:{rules:{"no-console":"warn","@typescript-eslint/no-explicit-any":"error"}}},execution:{runOn:"manual",timeout:3e4,cache:!0,parallel:!0},severity:"error",autoFix:!0},{id:"api-validation",name:"Input Validation",description:"Ensure all routes validate input",type:"custom",config:{custom:{script:"check-api-validation",args:[],expectedOutput:"valid"}},execution:{runOn:"manual",timeout:15e3,cache:!1,parallel:!0},severity:"error"},{id:"api-auth",name:"Authentication Check",description:"Verify authentication is properly implemented",type:"custom",config:{custom:{script:"check-api-auth",args:[],expectedOutput:"protected"}},execution:{runOn:"manual",timeout:1e4,cache:!0,parallel:!0},severity:"warning"}],metadata:{author:"system",createdAt:"2025-01-01T00:00:00Z",updatedAt:"2025-01-01T00:00:00Z",tags:["api","backend","routes","nextjs"],documentation:"/docs/module-types/api-routes.md"}},{id:"services-v1",name:"Backend Services",description:"Business logic services in lib/api",version:"1.0.0",discovery:{basePattern:"apps/platform/src/lib/api",instancePattern:"*/*.service.ts",filePatterns:{required:["*.service.ts"],optional:["*.types.ts","*.validation.ts","*.test.ts","*.utils.ts"],forbidden:["*.tmp","*.backup"]}},structure:{folders:[],files:[{path:"{{name}}.service.ts",required:!0}],dependencies:[]},assertions:[{id:"service-eslint",name:"ESLint Compliance",description:"Check ESLint rules for services",type:"eslint",config:{eslint:{rules:{"no-console":"error","@typescript-eslint/no-explicit-any":"error","no-unused-vars":"error"}}},execution:{runOn:"manual",timeout:3e4,cache:!0,parallel:!0},severity:"error",autoFix:!0},{id:"service-tests",name:"Unit Tests",description:"Ensure services have tests",type:"test",config:{test:{runner:"vitest",pattern:"*.test.ts",coverage:{threshold:80,type:"lines"}}},execution:{runOn:"manual",timeout:6e4,cache:!1,parallel:!1},severity:"error"}],metadata:{author:"system",createdAt:"2025-01-01T00:00:00Z",updatedAt:"2025-01-01T00:00:00Z",tags:["services","backend","business-logic"],documentation:"/docs/module-types/services.md"}}];class V{constructor(){this.moduleTypes=new Map,this.moduleInstances=new Map,this.discoveryCache=new Map,this.loadDefaultModuleTypes()}static getInstance(){return V.instance||(V.instance=new V),V.instance}loadDefaultModuleTypes(){Ve.forEach(t=>{this.moduleTypes.set(t.id,t)})}async getModuleTypes(){return Array.from(this.moduleTypes.values())}async getModuleType(t){return this.moduleTypes.get(t)||null}async createModuleType(t){if(this.moduleTypes.has(t.id))throw new Error(`Module type with id ${t.id} already exists`);return this.moduleTypes.set(t.id,t),t}async updateModuleType(t,a){const n=this.moduleTypes.get(t);if(!n)throw new Error(`Module type with id ${t} not found`);const i={...n,...a,id:t};return this.moduleTypes.set(t,i),i}async deleteModuleType(t){if(!this.moduleTypes.has(t))throw new Error(`Module type with id ${t} not found`);this.moduleTypes.delete(t),this.discoveryCache.delete(t)}async discoverModules(t){const a=Date.now(),n=[];try{const i=await this.getModuleType(t.typeId);if(!i)throw new Error(`Module type ${t.typeId} not found`);if(!t.force&&this.discoveryCache.has(t.typeId))return{typeId:t.typeId,discovered:this.discoveryCache.get(t.typeId),errors:[],duration:0};const c=await this.simulateDiscovery(i,t.basePath);return this.discoveryCache.set(t.typeId,c),c.forEach(o=>{this.moduleInstances.set(o.id,o)}),{typeId:t.typeId,discovered:c,errors:n,duration:Date.now()-a}}catch(i){return n.push(i instanceof Error?i.message:"Unknown error"),{typeId:t.typeId,discovered:[],errors:n,duration:Date.now()-a}}}async simulateDiscovery(t,a){const n=[];return t.id==="pages-v1"?["DashboardPage","SettingsPage","ReleasesPage","DocumentsPage","WorkflowsPage"].forEach(c=>{const o={id:`page-${c.toLowerCase()}`,typeId:t.id,path:`apps/storybook/src/components/Pages/${c}/v1.0.0`,name:c,version:"1.0.0",discovery:{discoveredAt:new Date().toISOString(),files:[{path:`ui/${c}.tsx`,relativePath:`ui/${c}.tsx`,size:Math.floor(Math.random()*1e4)+1e3,lastModified:new Date().toISOString(),type:"required",validation:{status:"valid",messages:[]}},{path:`domain/use${c.replace("Page","")}.ts`,relativePath:`domain/use${c.replace("Page","")}.ts`,size:Math.floor(Math.random()*5e3)+500,lastModified:new Date().toISOString(),type:"optional",validation:{status:"valid",messages:[]}},{path:"metadata.json",relativePath:"metadata.json",size:256,lastModified:new Date().toISOString(),type:"required",validation:{status:Math.random()>.3?"valid":"invalid",messages:Math.random()>.3?[]:["metadata.json is missing or invalid"]}},{path:"README.md",relativePath:"README.md",size:1024,lastModified:new Date().toISOString(),type:"required",validation:{status:Math.random()>.5?"valid":"warning",messages:Math.random()>.5?[]:["README.md needs updating"]}}],folders:["ui","domain","data","validation","types"],dependencies:[{module:"react",type:"external",version:"18.3.1",resolved:!0},{module:"@induction/shared",type:"internal",resolved:!0}]},validation:{lastChecked:new Date().toISOString(),status:Math.random()>.7?"valid":Math.random()>.3?"warning":"invalid",assertions:[],errors:[],warnings:[]},metrics:{linesOfCode:Math.floor(Math.random()*1e3)+200,complexity:Math.floor(Math.random()*20)+5,testCoverage:Math.floor(Math.random()*40)+60,lastModified:new Date().toISOString(),contributors:["developer1","developer2"]}};n.push(o)}):t.id==="organisms-v1"&&["ReleasesManager","DocumentManager","AIAssistant"].forEach(c=>{const o={id:`organism-${c.toLowerCase()}`,typeId:t.id,path:`apps/storybook/src/components/organisms/${c}/v1.0.0`,name:c,version:"1.0.0",discovery:{discoveredAt:new Date().toISOString(),files:[],folders:[],dependencies:[]},validation:{lastChecked:new Date().toISOString(),status:Math.random()>.5?"valid":"warning",assertions:[],errors:[],warnings:[]},metrics:{linesOfCode:Math.floor(Math.random()*500)+100,complexity:Math.floor(Math.random()*15)+3,testCoverage:Math.floor(Math.random()*30)+50,lastModified:new Date().toISOString(),contributors:["developer1"]}};n.push(o)}),n}async getModules(t){if(t)return this.discoveryCache.get(t)||[];const a=[];return this.discoveryCache.forEach(n=>{a.push(...n)}),a}async getModule(t){return this.moduleInstances.get(t)||null}async validateModule(t){const a=Date.now(),n=await this.getModule(t.moduleId);if(!n)throw new Error(`Module ${t.moduleId} not found`);const i=await this.getModuleType(n.typeId);if(!i)throw new Error(`Module type ${n.typeId} not found`);const c=t.assertions?i.assertions.filter(j=>t.assertions.includes(j.id)):i.assertions,o=[];let g=0;for(const j of c){const h=await this.runAssertion(n,j,t.autoFix);o.push(h),t.autoFix&&h.status==="passed"&&(g+=h.details.filesFailed)}const f=o.some(j=>j.status==="failed"&&j.assertionName.includes("error")),N=o.some(j=>j.status==="failed"&&!j.assertionName.includes("error")),v=f?"invalid":N?"warning":"valid";return n.validation={lastChecked:new Date().toISOString(),status:v,assertions:o,errors:f?[{file:n.path,message:"Validation failed",severity:"error"}]:[],warnings:N?[{file:n.path,message:"Validation warnings",severity:"warning"}]:[]},{moduleId:t.moduleId,status:v,results:o,fixed:g,duration:Date.now()-a}}async runAssertion(t,a,n){const i=Date.now(),c=Math.random()>.3;return{assertionId:a.id,assertionName:a.name,status:c?"passed":"failed",executedAt:new Date().toISOString(),duration:Date.now()-i,details:{filesChecked:t.discovery.files.length,filesPassed:c?t.discovery.files.length:Math.floor(t.discovery.files.length*.7),filesFailed:c?0:Math.ceil(t.discovery.files.length*.3),failures:c?[]:[{file:t.discovery.files[0]?.path||"unknown",line:42,column:10,rule:a.name,message:`${a.name} check failed`,severity:a.severity||"error",fixable:n||!1,fix:n?{range:[100,150],text:"// Fixed"}:void 0}]}}}async runAssertions(t){const a=await this.getModules(t),n=new Map;for(const i of a){const c=await this.validateModule({moduleId:i.id,autoFix:!1});n.set(i.id,c.results)}return n}async generateModule(t,a,n){const i=await this.getModuleType(t);if(!i)throw new Error(`Module type ${t} not found`);if(!i.template)throw new Error(`Module type ${t} has no template`);const c={id:`${t}-${a.toLowerCase()}`,typeId:t,path:`generated/${a}`,name:a,version:"1.0.0",discovery:{discoveredAt:new Date().toISOString(),files:[],folders:[],dependencies:[]},validation:{lastChecked:new Date().toISOString(),status:"unchecked",assertions:[],errors:[],warnings:[]},metrics:{linesOfCode:0,complexity:0,lastModified:new Date().toISOString(),contributors:[]}};return this.moduleInstances.set(c.id,c),c}async getModuleMetrics(t){const a=await this.getModules(t),n={total:a.length,valid:a.filter(i=>i.validation.status==="valid").length,invalid:a.filter(i=>i.validation.status==="invalid").length,warnings:a.filter(i=>i.validation.status==="warning").length,unchecked:a.filter(i=>i.validation.status==="unchecked").length,averageCoverage:0,averageComplexity:0};if(a.length>0){const i=a.filter(o=>o.metrics.testCoverage!==void 0).map(o=>o.metrics.testCoverage),c=a.map(o=>o.metrics.complexity);n.averageCoverage=i.length>0?i.reduce((o,g)=>o+g,0)/i.length:0,n.averageComplexity=c.reduce((o,g)=>o+g,0)/c.length}return n}}function At(){const[s,t]=p.useState({selectedType:null,selectedModule:null,moduleTypes:[],modules:[],loading:!1,error:null,filters:{status:"all",search:"",tags:[]},assertions:{running:!1,results:[],selectedAssertions:[]}}),a=V.getInstance();p.useEffect(()=>{n()},[]);const n=p.useCallback(async()=>{t(l=>({...l,loading:!0,error:null}));try{const l=await a.getModuleTypes();t(m=>({...m,moduleTypes:l,loading:!1,selectedType:m.selectedType||l[0]?.id||null})),l[0]?.id&&await o(l[0].id)}catch(l){t(m=>({...m,error:l instanceof Error?l.message:"Failed to load module types",loading:!1}))}},[]),i=p.useCallback(async l=>{t(m=>({...m,selectedType:l,selectedModule:null})),l&&await o(l)},[]),c=p.useCallback(l=>{t(m=>({...m,selectedModule:l}))},[]),o=p.useCallback(async(l,m=!1)=>{t(r=>({...r,loading:!0,error:null}));try{const r=await a.discoverModules({typeId:l,force:m});r.errors.length>0?t(y=>({...y,error:r.errors.join(", "),loading:!1})):t(y=>({...y,modules:r.discovered,loading:!1}))}catch(r){t(y=>({...y,error:r instanceof Error?r.message:"Failed to discover modules",loading:!1}))}},[]),g=p.useCallback(async(l,m)=>{t(r=>({...r,assertions:{...r.assertions,running:!0}}));try{const r=await a.validateModule({moduleId:l,assertions:m,autoFix:!1});t(x=>({...x,assertions:{...x.assertions,running:!1,results:r.results}}));const y=await a.getModule(l);y&&t(x=>({...x,modules:x.modules.map(d=>d.id===l?y:d)}))}catch(r){t(y=>({...y,error:r instanceof Error?r.message:"Failed to validate module",assertions:{...y.assertions,running:!1}}))}},[]),f=p.useCallback(async l=>{t(m=>({...m,assertions:{...m.assertions,running:!0}}));try{const m=await a.runAssertions(l),r=[];m.forEach(y=>{r.push(...y)}),t(y=>({...y,assertions:{...y.assertions,running:!1,results:r}})),await o(l,!0)}catch(m){t(r=>({...r,error:m instanceof Error?m.message:"Failed to run assertions",assertions:{...r.assertions,running:!1}}))}},[o]),N=p.useCallback(async(l,m,r)=>{t(y=>({...y,loading:!0,error:null}));try{await a.generateModule(l,m,r),await o(l,!0)}catch(y){t(x=>({...x,error:y instanceof Error?y.message:"Failed to generate module",loading:!1}))}},[o]),v=p.useCallback((l,m)=>{t(r=>({...r,filters:{...r.filters,[l]:m}}))},[]),j=p.useCallback(async()=>{await n(),s.selectedType&&await o(s.selectedType,!0)},[n,o,s.selectedType]),h=s.modules.filter(l=>{if(s.filters.status!=="all"&&l.validation.status!==s.filters.status)return!1;if(s.filters.search){const m=s.filters.search.toLowerCase();if(!l.name.toLowerCase().includes(m)&&!l.path.toLowerCase().includes(m))return!1}if(s.filters.tags.length>0){const m=s.moduleTypes.find(r=>r.id===l.typeId);if(m&&!s.filters.tags.some(y=>m.metadata.tags.includes(y)))return!1}return!0}),E={total:s.modules.length,valid:s.modules.filter(l=>l.validation.status==="valid").length,invalid:s.modules.filter(l=>l.validation.status==="invalid").length,warnings:s.modules.filter(l=>l.validation.status==="warning").length,unchecked:s.modules.filter(l=>l.validation.status==="unchecked").length};return{moduleTypes:s.moduleTypes,modules:s.modules,selectedType:s.selectedType,selectedModule:s.selectedModule,loading:s.loading,error:s.error,filters:s.filters,assertions:s.assertions,selectModuleType:i,selectModule:c,discoverModules:o,validateModule:g,runAllAssertions:f,generateModule:N,setFilter:v,refreshData:j,filteredModules:h,moduleMetrics:E}}function Qe({testFiles:s=[],className:t=""}){const[a,n]=p.useState({status:"idle",output:[]}),[i,c]=p.useState([]),o=p.useRef(null),g=["src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.vitest.stories.test.tsx","src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.addon.test.ts"],f=s.length>0?s:g;p.useEffect(()=>{o.current&&(o.current.scrollTop=o.current.scrollHeight)},[a.output]);const N=async()=>{const l=i.length>0?i:f;n({status:"running",output:[`🚀 Running tests: ${l.join(", ")}`,""],testCount:void 0});try{const m=await fetch("http://localhost:3001/api/test/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({testFiles:l,options:{reporter:"verbose",run:!0}})});if(!m.ok)throw new Error(`HTTP error! status: ${m.status}`);const r=m.body?.getReader(),y=new TextDecoder;if(r){let b="";for(;;){const{done:k,value:R}=await r.read();if(k)break;b+=y.decode(R,{stream:!0});const M=b.split(`
`);b=M.pop()||"",M.forEach(F=>{F.trim()&&n(u=>({...u,output:[...u.output,F]}))})}b.trim()&&n(k=>({...k,output:[...k.output,b]}))}const x=a.output.join(`
`),d=x.match(/Tests\s+(\d+)\s+passed.*?\((\d+)\)/),C=x.match(/Duration\s+([\d.]+)s/);n(b=>({...b,status:x.includes("failed")?"error":"success",testCount:d?{passed:parseInt(d[1]),failed:0,total:parseInt(d[2])}:void 0,duration:C?parseFloat(C[1]):void 0}))}catch(m){n(r=>({...r,status:"error",output:[...r.output,"","❌ Error running tests:",String(m)]}))}},v=()=>{n({status:"idle",output:[]})},j=l=>{c(m=>m.includes(l)?m.filter(r=>r!==l):[...m,l])},h={idle:"text-gray-600",running:"text-blue-600",success:"text-green-600",error:"text-red-600"},E={idle:"⚪",running:"🔄",success:"✅",error:"❌"};return e.jsxs("div",{className:`bg-white rounded-lg border shadow-sm p-4 ${t}`,children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("span",{className:"text-lg font-semibold",children:"Test Runner"}),e.jsxs("span",{className:`text-sm ${h[a.status]}`,children:[E[a.status]," ",a.status.charAt(0).toUpperCase()+a.status.slice(1)]})]}),e.jsxs("div",{className:"flex space-x-2",children:[e.jsx(O,{onClick:N,disabled:a.status==="running",variant:a.status==="running"?"secondary":"default",size:"sm",children:a.status==="running"?"Running...":"Run Tests"}),e.jsx(O,{onClick:v,variant:"outline",size:"sm",disabled:a.output.length===0,children:"Clear"})]})]}),e.jsxs("div",{className:"mb-4",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-700 mb-2",children:"Test Files:"}),e.jsx("div",{className:"space-y-2",children:f.map((l,m)=>{const r=l.split("/").pop()||l,y=i.length===0||i.includes(l);return e.jsxs("label",{className:"flex items-center space-x-2 text-sm",children:[e.jsx("input",{type:"checkbox",checked:y,onChange:()=>j(l),className:"rounded border-gray-300 text-blue-600 focus:ring-blue-500"}),e.jsx("span",{className:"font-mono text-xs bg-gray-100 px-2 py-1 rounded",children:r})]},m)})})]}),a.testCount&&e.jsx("div",{className:"mb-4 p-3 bg-gray-50 rounded-lg",children:e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsxs("div",{className:"flex space-x-4",children:[e.jsxs("span",{className:"text-green-600",children:["✅ ",a.testCount.passed," passed"]}),a.testCount.failed>0&&e.jsxs("span",{className:"text-red-600",children:["❌ ",a.testCount.failed," failed"]}),e.jsxs("span",{className:"text-gray-600",children:["📊 ",a.testCount.total," total"]})]}),a.duration&&e.jsxs("span",{className:"text-gray-500",children:["⏱️ ",a.duration,"s"]})]})}),e.jsxs("div",{className:"bg-gray-900 rounded-lg p-4 h-96 overflow-auto font-mono text-sm",children:[e.jsx("div",{ref:o,className:"space-y-1",children:a.output.length===0?e.jsx("div",{className:"text-gray-500 italic",children:'Click "Run Tests" to execute tests and see output here...'}):a.output.map((l,m)=>e.jsx("div",{className:`${l.includes("✓")?"text-green-400":l.includes("❌")||l.includes("Error")?"text-red-400":l.includes("PASS")||l.includes("passed")?"text-green-300":l.includes("FAIL")||l.includes("failed")?"text-red-300":l.includes("RUN")||l.includes("Running")?"text-blue-300":l.startsWith("[36m[MSW][0m")?"text-cyan-400":"text-gray-300"}`,children:l.replace(/\[36m\[MSW\]\[0m/g,"[MSW]").replace(/\[32m✓\[0m/g,"✓")},m))}),a.status==="running"&&e.jsxs("div",{className:"flex items-center space-x-2 text-blue-400 mt-2",children:[e.jsx("div",{className:"animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"}),e.jsx("span",{children:"Tests running..."})]})]})]})}Qe.__docgenInfo={description:"",methods:[],displayName:"TestRunner",props:{testFiles:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}}}};function _e({className:s="",moduleTypes:t=Ve}){const[a,n]=p.useState(null),[i,c]=p.useState(""),[o,g]=p.useState("all"),[f,N]=p.useState({discovery:!0,structure:!0,assertions:!0}),v=Array.from(new Set(t.flatMap(r=>r.metadata.tags))),j=t.filter(r=>{const y=!i||r.name.toLowerCase().includes(i.toLowerCase())||r.description.toLowerCase().includes(i.toLowerCase())||r.metadata.tags.some(d=>d.toLowerCase().includes(i.toLowerCase())),x=o==="all"||r.metadata.tags.includes(o);return y&&x}),h=t.find(r=>r.id===a),E=r=>{N(y=>({...y,[r]:!y[r]}))},l=r=>{switch(r){case"error":return"text-red-600 bg-red-50";case"warning":return"text-yellow-600 bg-yellow-50";case"info":return"text-blue-600 bg-blue-50";default:return"text-gray-600 bg-gray-50"}},m=r=>{switch(r){case"eslint":return e.jsx(X,{className:"h-4 w-4"});case"test":return e.jsx(he,{className:"h-4 w-4"});case"structure":return e.jsx(J,{className:"h-4 w-4"});case"dependency":return e.jsx(B,{className:"h-4 w-4"});case"custom":return e.jsx(le,{className:"h-4 w-4"});default:return e.jsx(K,{className:"h-4 w-4"})}};return e.jsxs("div",{className:w("bg-white rounded-lg border shadow-sm",s),children:[e.jsxs("div",{className:"p-4 border-b",children:[e.jsx("div",{className:"flex items-center justify-between mb-4",children:e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(B,{className:"h-5 w-5 text-blue-600"}),e.jsx("h3",{className:"text-lg font-semibold",children:"Module Types"}),e.jsxs(S,{variant:"outline",children:[t.length," types"]})]})}),e.jsxs("div",{className:"flex space-x-3",children:[e.jsxs("div",{className:"flex-1 relative",children:[e.jsx(re,{className:"absolute left-3 top-2.5 h-4 w-4 text-gray-400"}),e.jsx(ue,{placeholder:"Search module types...",value:i,onChange:r=>c(r.target.value),className:"pl-10"})]}),e.jsxs("select",{value:o,onChange:r=>g(r.target.value),className:"px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",children:[e.jsx("option",{value:"all",children:"All Tags"}),v.map(r=>e.jsx("option",{value:r,children:r},r))]})]})]}),e.jsxs("div",{className:"flex h-96",children:[e.jsx("div",{className:"w-1/3 border-r p-4 overflow-y-auto",children:e.jsx("div",{className:"space-y-2",children:j.map(r=>e.jsx("div",{onClick:()=>n(r.id),className:w("p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50",a===r.id?"border-blue-500 bg-blue-50":"border-gray-200"),children:e.jsx("div",{className:"flex items-start justify-between",children:e.jsxs("div",{className:"flex-1",children:[e.jsx("h4",{className:"font-medium text-sm",children:r.name}),e.jsx("p",{className:"text-xs text-gray-500 mt-1 line-clamp-2",children:r.description}),e.jsxs("div",{className:"flex items-center space-x-2 mt-2",children:[e.jsxs(S,{variant:"outline",className:"text-xs",children:["v",r.version]}),e.jsxs("span",{className:"text-xs text-gray-400",children:[r.assertions.length," assertions"]})]}),e.jsxs("div",{className:"flex flex-wrap gap-1 mt-2",children:[r.metadata.tags.slice(0,3).map(y=>e.jsx(S,{variant:"secondary",className:"text-xs px-1.5 py-0.5",children:y},y)),r.metadata.tags.length>3&&e.jsxs("span",{className:"text-xs text-gray-400",children:["+",r.metadata.tags.length-3]})]})]})})},r.id))})}),e.jsx("div",{className:"flex-1 p-4 overflow-y-auto",children:h?e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("h2",{className:"text-xl font-semibold",children:h.name}),e.jsxs(S,{variant:"outline",children:["v",h.version]})]}),e.jsx("p",{className:"text-gray-600 mb-4",children:h.description}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-sm",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Ke,{className:"h-4 w-4 text-gray-500"}),e.jsx("span",{className:"font-medium",children:"Author:"}),e.jsx("span",{children:h.metadata.author})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Ze,{className:"h-4 w-4 text-gray-500"}),e.jsx("span",{className:"font-medium",children:"Updated:"}),e.jsx("span",{children:new Date(h.metadata.updatedAt).toLocaleDateString()})]})]}),e.jsx("div",{className:"flex flex-wrap gap-2 mt-3",children:h.metadata.tags.map(r=>e.jsxs(S,{variant:"secondary",className:"flex items-center space-x-1",children:[e.jsx(Et,{className:"h-3 w-3"}),e.jsx("span",{children:r})]},r))})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>E("discovery"),className:"flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-50 rounded",children:[f.discovery?e.jsx(ne,{className:"h-4 w-4"}):e.jsx(q,{className:"h-4 w-4"}),e.jsx(re,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"font-medium",children:"Discovery Pattern"})]}),f.discovery&&e.jsxs("div",{className:"ml-6 mt-2 space-y-3",children:[e.jsx("div",{className:"p-3 bg-gray-50 rounded-lg",children:e.jsxs("div",{className:"text-sm space-y-2",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Base Pattern:"}),e.jsx("code",{className:"ml-2 px-2 py-1 bg-white rounded text-xs font-mono",children:h.discovery.basePattern})]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Instance Pattern:"}),e.jsx("code",{className:"ml-2 px-2 py-1 bg-white rounded text-xs font-mono",children:h.discovery.instancePattern})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 gap-3",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-sm font-medium text-green-600 flex items-center space-x-1",children:[e.jsx(U,{className:"h-4 w-4"}),e.jsx("span",{children:"Required Files"})]}),e.jsx("ul",{className:"mt-1 space-y-1 text-xs",children:h.discovery.filePatterns.required.map(r=>e.jsx("li",{className:"font-mono bg-green-50 px-2 py-1 rounded",children:r},r))})]}),e.jsxs("div",{children:[e.jsxs("span",{className:"text-sm font-medium text-blue-600 flex items-center space-x-1",children:[e.jsx($,{className:"h-4 w-4"}),e.jsx("span",{children:"Optional Files"})]}),e.jsx("ul",{className:"mt-1 space-y-1 text-xs",children:h.discovery.filePatterns.optional.map(r=>e.jsx("li",{className:"font-mono bg-blue-50 px-2 py-1 rounded",children:r},r))})]}),h.discovery.filePatterns.forbidden.length>0&&e.jsxs("div",{children:[e.jsxs("span",{className:"text-sm font-medium text-red-600 flex items-center space-x-1",children:[e.jsx(Q,{className:"h-4 w-4"}),e.jsx("span",{children:"Forbidden Files"})]}),e.jsx("ul",{className:"mt-1 space-y-1 text-xs",children:h.discovery.filePatterns.forbidden.map(r=>e.jsx("li",{className:"font-mono bg-red-50 px-2 py-1 rounded",children:r},r))})]})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>E("structure"),className:"flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-50 rounded",children:[f.structure?e.jsx(ne,{className:"h-4 w-4"}):e.jsx(q,{className:"h-4 w-4"}),e.jsx(J,{className:"h-4 w-4 text-green-600"}),e.jsx("span",{className:"font-medium",children:"Structure Requirements"})]}),f.structure&&e.jsxs("div",{className:"ml-6 mt-2 space-y-3",children:[h.structure.folders.length>0&&e.jsxs("div",{children:[e.jsx("span",{className:"text-sm font-medium",children:"Folders:"}),e.jsx("div",{className:"mt-1 space-y-2",children:h.structure.folders.map(r=>e.jsxs("div",{className:"flex items-center space-x-2 text-sm",children:[e.jsx(J,{className:"h-4 w-4 text-blue-500"}),e.jsx("code",{className:"font-mono",children:r.path}),e.jsx(S,{variant:r.required?"default":"secondary",className:"text-xs",children:r.required?"Required":"Optional"}),e.jsxs("span",{className:"text-gray-500",children:["- ",r.description]})]},r.path))})]}),h.structure.files.length>0&&e.jsxs("div",{children:[e.jsx("span",{className:"text-sm font-medium",children:"Files:"}),e.jsx("div",{className:"mt-1 space-y-2",children:h.structure.files.map(r=>e.jsxs("div",{className:"flex items-center space-x-2 text-sm",children:[e.jsx(z,{className:"h-4 w-4 text-green-500"}),e.jsx("code",{className:"font-mono",children:r.path}),e.jsx(S,{variant:r.required?"default":"secondary",className:"text-xs",children:r.required?"Required":"Optional"}),r.validation&&e.jsx(S,{variant:"outline",className:"text-xs",children:"Validated"})]},r.path))})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>E("assertions"),className:"flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-50 rounded",children:[f.assertions?e.jsx(ne,{className:"h-4 w-4"}):e.jsx(q,{className:"h-4 w-4"}),e.jsx(X,{className:"h-4 w-4 text-red-600"}),e.jsxs("span",{className:"font-medium",children:["Assertions (",h.assertions.length,")"]})]}),f.assertions&&e.jsx("div",{className:"ml-6 mt-2 space-y-3",children:h.assertions.map(r=>e.jsx(T,{className:"p-3",children:e.jsxs("div",{className:"flex items-start space-x-3",children:[e.jsx("div",{className:w("p-1.5 rounded",l(r.severity)),children:m(r.type)}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center space-x-2 mb-1",children:[e.jsx("h5",{className:"font-medium text-sm",children:r.name}),e.jsx(S,{variant:"outline",className:"text-xs",children:r.type}),e.jsx(S,{variant:r.severity==="error"?"destructive":r.severity==="warning"?"secondary":"default",className:"text-xs",children:r.severity})]}),e.jsx("p",{className:"text-xs text-gray-600 mb-2",children:r.description}),e.jsxs("div",{className:"flex items-center space-x-4 text-xs text-gray-500",children:[e.jsxs("div",{className:"flex items-center space-x-1",children:[e.jsx(Ie,{className:"h-3 w-3"}),e.jsxs("span",{children:[r.execution.timeout/1e3,"s timeout"]})]}),e.jsxs("div",{className:"flex items-center space-x-1",children:[e.jsx(ie,{className:"h-3 w-3"}),e.jsxs("span",{children:["Run on ",r.execution.runOn]})]}),r.autoFix&&e.jsx(S,{variant:"outline",className:"text-xs",children:"Auto-fix"})]})]})]})},r.id))})]}),h.metadata.documentation&&e.jsx("div",{className:"p-3 bg-blue-50 rounded-lg",children:e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(Tt,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium",children:"Documentation:"}),e.jsx("a",{href:h.metadata.documentation,className:"text-blue-600 text-sm underline hover:text-blue-800",children:h.metadata.documentation})]})})]}):e.jsx("div",{className:"flex items-center justify-center h-full text-gray-500",children:e.jsxs("div",{className:"text-center",children:[e.jsx(B,{className:"h-12 w-12 mx-auto mb-4 text-gray-300"}),e.jsx("p",{children:"Select a module type to view details"})]})})})]})]})}_e.__docgenInfo={description:"",methods:[],displayName:"ModuleTypeViewer",props:{className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}},moduleTypes:{required:!1,tsType:{name:"Array",elements:[{name:"ModuleType"}],raw:"ModuleType[]"},description:"",defaultValue:{value:`[
  {
    id: 'pages-v1',
    name: 'Pages (Versioned)',
    description: 'Self-contained page components with versioning support',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/storybook/src/components/Pages',
      instancePattern: '*/v[0-9]+.[0-9]+.[0-9]+',
      filePatterns: {
        required: [
          'ui/*.tsx',
          'metadata.json'
        ],
        optional: [
          'README.md',
          'domain/*.ts',
          'data/*.ts',
          'validation/*.ts',
          'types/*.ts',
          '*.test.tsx',
          '*.stories.tsx',
          'dependencies.json'
        ],
        forbidden: [
          '*.tmp',
          '*.backup',
          'node_modules'
        ]
      }
    },
    
    structure: {
      folders: [
        {
          path: 'ui',
          required: true,
          description: 'UI components and views'
        },
        {
          path: 'domain',
          required: false,
          description: 'Business logic and hooks'
        },
        {
          path: 'data',
          required: false,
          description: 'Data services and API calls'
        },
        {
          path: 'validation',
          required: false,
          description: 'Validation schemas using Zod'
        },
        {
          path: 'types',
          required: false,
          description: 'TypeScript type definitions'
        }
      ],
      files: [
        {
          path: 'metadata.json',
          required: true,
          validation: {
            schema: 'page-metadata-schema'
          }
        },
        {
          path: 'README.md',
          required: false
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'page-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules for all TypeScript/JavaScript files',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'error',
              'no-unused-vars': 'error',
              '@typescript-eslint/no-explicit-any': 'warn'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'page-tests',
        name: 'Test Coverage',
        description: 'Ensure adequate test coverage',
        type: 'test',
        config: {
          test: {
            runner: 'vitest',
            pattern: '*.test.{ts,tsx}',
            coverage: {
              threshold: 70,
              type: 'lines'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 60000,
          cache: false,
          parallel: false
        },
        severity: 'warning'
      },
      {
        id: 'page-structure',
        name: 'Folder Structure',
        description: 'Validate required folder structure',
        type: 'structure',
        config: {
          structure: {
            requiredFiles: ['metadata.json'],
            requiredFolders: ['ui'],
            namingConvention: 'PascalCase'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 5000,
          cache: true,
          parallel: true
        },
        severity: 'error'
      },
      {
        id: 'page-dependencies',
        name: 'Dependency Check',
        description: 'Validate dependencies are properly managed',
        type: 'dependency',
        config: {
          dependency: {
            allowed: ['react', 'react-dom', '@induction/shared', 'lucide-react'],
            forbidden: ['jquery', 'lodash'],
            maxCount: 20
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 10000,
          cache: true,
          parallel: true
        },
        severity: 'warning'
      }
    ],
    
    template: {
      id: 'page-template-v1',
      name: 'Page Template',
      description: 'Template for creating new page modules',
      files: [
        {
          path: 'ui/{{name}}Page.tsx',
          template: 'page-component.template'
        },
        {
          path: 'domain/use{{name}}.ts',
          template: 'page-hook.template'
        },
        {
          path: 'data/{{name.lower}}.service.ts',
          template: 'page-service.template'
        },
        {
          path: 'types/{{name.lower}}.types.ts',
          template: 'page-types.template'
        },
        {
          path: 'metadata.json',
          template: 'page-metadata.template'
        },
        {
          path: 'README.md',
          template: 'page-readme.template'
        }
      ]
    },
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['pages', 'ui', 'frontend', 'components'],
      documentation: '/docs/module-types/pages.md'
    }
  },
  
  {
    id: 'organisms-v1',
    name: 'Organisms (Versioned)',
    description: 'Complex UI components with business logic',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/storybook/src/components/organisms',
      instancePattern: '*/v[0-9]+.[0-9]+.[0-9]+',
      filePatterns: {
        required: [
          '*.tsx',
          '*.types.ts'
        ],
        optional: [
          '*.service.ts',
          '*.validation.ts',
          '*.test.tsx',
          '*.stories.tsx',
          'use*.ts'
        ],
        forbidden: [
          '*.tmp',
          '*.backup'
        ]
      }
    },
    
    structure: {
      folders: [],
      files: [
        {
          path: '{{name}}.tsx',
          required: true
        },
        {
          path: '{{name.lower}}.types.ts',
          required: true
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'organism-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'error',
              'react-hooks/rules-of-hooks': 'error',
              'react-hooks/exhaustive-deps': 'warn'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'organism-complexity',
        name: 'Complexity Check',
        description: 'Ensure components are not too complex',
        type: 'custom',
        config: {
          custom: {
            script: 'check-complexity',
            args: ['--max', '15'],
            expectedOutput: 'pass'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 10000,
          cache: true,
          parallel: true
        },
        severity: 'warning'
      }
    ],
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['organisms', 'ui', 'frontend', 'components'],
      documentation: '/docs/module-types/organisms.md'
    }
  },
  
  {
    id: 'api-routes-v1',
    name: 'API Routes',
    description: 'Next.js API route handlers',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/platform/src/app/api',
      instancePattern: '*/route.ts',
      filePatterns: {
        required: [
          'route.ts'
        ],
        optional: [
          'route.test.ts',
          'types.ts',
          'validation.ts'
        ],
        forbidden: [
          '*.tmp'
        ]
      }
    },
    
    structure: {
      folders: [],
      files: [
        {
          path: 'route.ts',
          required: true,
          validation: {
            customValidator: 'api-route-validator'
          }
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'api-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules for API routes',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'warn',
              '@typescript-eslint/no-explicit-any': 'error'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'api-validation',
        name: 'Input Validation',
        description: 'Ensure all routes validate input',
        type: 'custom',
        config: {
          custom: {
            script: 'check-api-validation',
            args: [],
            expectedOutput: 'valid'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 15000,
          cache: false,
          parallel: true
        },
        severity: 'error'
      },
      {
        id: 'api-auth',
        name: 'Authentication Check',
        description: 'Verify authentication is properly implemented',
        type: 'custom',
        config: {
          custom: {
            script: 'check-api-auth',
            args: [],
            expectedOutput: 'protected'
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 10000,
          cache: true,
          parallel: true
        },
        severity: 'warning'
      }
    ],
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['api', 'backend', 'routes', 'nextjs'],
      documentation: '/docs/module-types/api-routes.md'
    }
  },
  
  {
    id: 'services-v1',
    name: 'Backend Services',
    description: 'Business logic services in lib/api',
    version: '1.0.0',
    
    discovery: {
      basePattern: 'apps/platform/src/lib/api',
      instancePattern: '*/*.service.ts',
      filePatterns: {
        required: [
          '*.service.ts'
        ],
        optional: [
          '*.types.ts',
          '*.validation.ts',
          '*.test.ts',
          '*.utils.ts'
        ],
        forbidden: [
          '*.tmp',
          '*.backup'
        ]
      }
    },
    
    structure: {
      folders: [],
      files: [
        {
          path: '{{name}}.service.ts',
          required: true
        }
      ],
      dependencies: []
    },
    
    assertions: [
      {
        id: 'service-eslint',
        name: 'ESLint Compliance',
        description: 'Check ESLint rules for services',
        type: 'eslint',
        config: {
          eslint: {
            rules: {
              'no-console': 'error',
              '@typescript-eslint/no-explicit-any': 'error',
              'no-unused-vars': 'error'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 30000,
          cache: true,
          parallel: true
        },
        severity: 'error',
        autoFix: true
      },
      {
        id: 'service-tests',
        name: 'Unit Tests',
        description: 'Ensure services have tests',
        type: 'test',
        config: {
          test: {
            runner: 'vitest',
            pattern: '*.test.ts',
            coverage: {
              threshold: 80,
              type: 'lines'
            }
          }
        },
        execution: {
          runOn: 'manual',
          timeout: 60000,
          cache: false,
          parallel: false
        },
        severity: 'error'
      }
    ],
    
    metadata: {
      author: 'system',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tags: ['services', 'backend', 'business-logic'],
      documentation: '/docs/module-types/services.md'
    }
  }
]`,computed:!1}}}};const ze=({className:s})=>{const{moduleTypes:t,selectedType:a,selectedModule:n,loading:i,error:c,filters:o,assertions:g,selectModuleType:f,selectModule:N,validateModule:v,runAllAssertions:j,setFilter:h,refreshData:E,filteredModules:l,moduleMetrics:m}=At(),[r,y]=p.useState(new Set),[x,d]=p.useState("tree"),[C,b]=p.useState("explorer"),k=l.find(u=>u.id===n),R=t.find(u=>u.id===a),M=u=>{switch(u){case"valid":return e.jsx(U,{className:"h-4 w-4 text-green-600"});case"invalid":return e.jsx(Q,{className:"h-4 w-4 text-red-600"});case"warning":return e.jsx(Z,{className:"h-4 w-4 text-yellow-600"});default:return e.jsx($,{className:"h-4 w-4 text-gray-400"})}},F=u=>{switch(u){case"valid":return"success";case"invalid":return"destructive";case"warning":return"warning";default:return"default"}};return e.jsxs("div",{className:w("space-y-4",s),children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2",children:[e.jsx(B,{className:"h-5 w-5 text-blue-600"}),"Module Explorer"]}),e.jsxs("div",{className:"flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1",children:[e.jsxs("button",{onClick:()=>b("explorer"),className:w("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2",C==="explorer"?"bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm":"text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"),children:[e.jsx(be,{className:"h-4 w-4"}),"Explorer"]}),e.jsxs("button",{onClick:()=>b("types"),className:w("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2",C==="types"?"bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm":"text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"),children:[e.jsx(le,{className:"h-4 w-4"}),"Types"]}),e.jsxs("button",{onClick:()=>b("tests"),className:w("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2",C==="tests"?"bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm":"text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"),children:[e.jsx(Fe,{className:"h-4 w-4"}),"Tests"]}),e.jsxs("button",{onClick:()=>b("editor"),className:w("px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2",C==="editor"?"bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm":"text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"),children:[e.jsx(K,{className:"h-4 w-4"}),"Editor"]})]}),e.jsxs("select",{value:a||"",onChange:u=>f(u.target.value||null),className:"px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",children:[e.jsx("option",{value:"",children:"Select module type..."}),t.map(u=>e.jsxs("option",{value:u.id,children:[u.name," (v",u.version,")"]},u.id))]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("div",{className:"flex items-center border border-gray-200 rounded-lg",children:[e.jsx("button",{onClick:()=>d("tree"),className:w("px-3 py-1.5 text-sm",x==="tree"?"bg-blue-600 text-white":"text-gray-600 hover:bg-gray-50"),children:"Tree"}),e.jsx("button",{onClick:()=>d("grid"),className:w("px-3 py-1.5 text-sm",x==="grid"?"bg-blue-600 text-white":"text-gray-600 hover:bg-gray-50"),children:"Grid"})]}),e.jsx(O,{variant:"outline",size:"sm",onClick:E,disabled:i,children:e.jsx(Y,{className:w("h-4 w-4",i&&"animate-spin")})}),e.jsxs(O,{variant:"outline",size:"sm",onClick:()=>a&&j(a),disabled:!a||g.running,children:[e.jsx(he,{className:"h-4 w-4"}),"Run All"]})]})]}),e.jsxs("div",{className:"grid grid-cols-5 gap-2",children:[e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:m.total}),e.jsx("div",{className:"text-xs text-gray-500",children:"Total"})]}),e.jsxs("div",{className:"bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-green-600",children:m.valid}),e.jsx("div",{className:"text-xs text-gray-500",children:"Valid"})]}),e.jsxs("div",{className:"bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-red-600",children:m.invalid}),e.jsx("div",{className:"text-xs text-gray-500",children:"Invalid"})]}),e.jsxs("div",{className:"bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-yellow-600",children:m.warnings}),e.jsx("div",{className:"text-xs text-gray-500",children:"Warnings"})]}),e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-gray-600",children:m.unchecked}),e.jsx("div",{className:"text-xs text-gray-500",children:"Unchecked"})]})]}),c&&e.jsxs(ye,{variant:"destructive",children:[e.jsx(Q,{className:"h-4 w-4"}),e.jsx(ve,{children:c})]}),C==="explorer"?e.jsxs("div",{className:"grid grid-cols-12 gap-4",children:[e.jsx("div",{className:"col-span-4",children:e.jsxs(T,{className:"p-4",children:[e.jsxs("div",{className:"space-y-3 mb-4",children:[e.jsx(ue,{type:"search",placeholder:"Search modules...",value:o.search,onChange:u=>h("search",u.target.value),className:"w-full",icon:e.jsx(re,{className:"h-4 w-4"})}),e.jsxs("select",{value:o.status,onChange:u=>h("status",u.target.value),className:"w-full px-3 py-2 border border-gray-200 rounded-lg text-sm",children:[e.jsx("option",{value:"all",children:"All Status"}),e.jsx("option",{value:"valid",children:"Valid"}),e.jsx("option",{value:"invalid",children:"Invalid"}),e.jsx("option",{value:"warning",children:"Warning"}),e.jsx("option",{value:"unchecked",children:"Unchecked"})]})]}),e.jsx("div",{className:"space-y-1 max-h-[500px] overflow-y-auto",children:i?e.jsxs("div",{className:"text-center py-8",children:[e.jsx(Y,{className:"h-6 w-6 animate-spin mx-auto mb-2 text-gray-400"}),e.jsx("p",{className:"text-sm text-gray-500",children:"Loading modules..."})]}):l.length===0?e.jsxs("div",{className:"text-center py-8",children:[e.jsx(B,{className:"h-8 w-8 mx-auto mb-2 text-gray-400"}),e.jsx("p",{className:"text-sm text-gray-500",children:a?"No modules found":"Select a module type"})]}):x==="tree"?l.map(u=>e.jsxs("div",{onClick:()=>N(u.id),className:w("flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",n===u.id?"bg-blue-50 dark:bg-blue-900/20 border border-blue-200":"hover:bg-gray-50 dark:hover:bg-gray-800"),children:[e.jsxs("div",{className:"flex items-center gap-2 flex-1",children:[M(u.validation.status),e.jsx("span",{className:"text-sm font-medium text-gray-900 dark:text-white",children:u.name}),u.version&&e.jsxs(S,{variant:"outline",className:"text-xs",children:["v",u.version]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[u.metrics.testCoverage!==void 0&&e.jsxs("span",{className:"text-xs text-gray-500",children:[u.metrics.testCoverage,"%"]}),e.jsx(q,{className:"h-4 w-4 text-gray-400"})]})]},u.id)):e.jsx("div",{className:"grid grid-cols-2 gap-2",children:l.map(u=>e.jsxs(T,{onClick:()=>N(u.id),className:w("p-3 cursor-pointer transition-colors",n===u.id?"ring-2 ring-blue-500":"hover:bg-gray-50"),children:[e.jsxs("div",{className:"flex items-start justify-between mb-2",children:[M(u.validation.status),e.jsx(S,{variant:F(u.validation.status),className:"text-xs",children:u.validation.status})]}),e.jsx("div",{className:"text-sm font-medium text-gray-900 dark:text-white",children:u.name}),e.jsxs("div",{className:"text-xs text-gray-500 mt-1",children:[u.discovery.files.length," files"]})]},u.id))})})]})}),e.jsx("div",{className:"col-span-8",children:k?e.jsxs(T,{className:"p-4",children:[e.jsxs("div",{className:"flex items-start justify-between mb-4",children:[e.jsxs("div",{children:[e.jsxs("h4",{className:"text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2",children:[M(k.validation.status),k.name]}),e.jsx("p",{className:"text-sm text-gray-500 mt-1",children:k.path})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(O,{variant:"outline",size:"sm",onClick:()=>v(k.id),disabled:g.running,children:[e.jsx(X,{className:"h-4 w-4"}),"Validate"]}),e.jsxs(O,{variant:"outline",size:"sm",children:[e.jsx(be,{className:"h-4 w-4"}),"View Code"]})]})]}),e.jsxs("div",{className:"mb-4",children:[e.jsxs("h5",{className:"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2",children:[e.jsx(J,{className:"h-4 w-4"}),"File Structure"]}),e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1",children:[k.discovery.folders.map(u=>e.jsxs("div",{className:"flex items-center gap-2 text-sm",children:[e.jsx(He,{className:"h-4 w-4 text-blue-500"}),e.jsxs("span",{className:"text-gray-700 dark:text-gray-300",children:[u,"/"]})]},u)),k.discovery.files.map(u=>e.jsxs("div",{className:"flex items-center justify-between text-sm ml-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Ye,{className:"h-4 w-4 text-gray-400"}),e.jsx("span",{className:"text-gray-700 dark:text-gray-300",children:u.relativePath}),u.validation&&e.jsx(S,{variant:u.validation.status==="valid"?"success":u.validation.status==="warning"?"warning":"destructive",className:"text-xs",children:u.validation.status})]}),e.jsxs("span",{className:"text-xs text-gray-500",children:[(u.size/1024).toFixed(1),"kb"]})]},u.path))]})]}),R&&e.jsxs("div",{className:"mb-4",children:[e.jsxs("h5",{className:"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2",children:[e.jsx(X,{className:"h-4 w-4"}),"Assertions (",R.assertions.length,")"]}),e.jsx("div",{className:"space-y-2",children:R.assertions.map(u=>{const A=g.results.find(Be=>Be.assertionId===u.id);return e.jsxs("div",{className:"flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[A?A.status==="passed"?e.jsx(U,{className:"h-4 w-4 text-green-600"}):A.status==="failed"?e.jsx(Q,{className:"h-4 w-4 text-red-600"}):e.jsx(Z,{className:"h-4 w-4 text-yellow-600"}):e.jsx($,{className:"h-4 w-4 text-gray-400"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-gray-900 dark:text-white",children:u.name}),e.jsx("div",{className:"text-xs text-gray-500",children:u.description})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(S,{variant:u.severity==="error"?"destructive":u.severity==="warning"?"warning":"default",className:"text-xs",children:u.severity}),u.autoFix&&e.jsx(S,{variant:"outline",className:"text-xs",children:"Auto-fix"})]})]},u.id)})})]}),e.jsxs("div",{children:[e.jsxs("h5",{className:"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2",children:[e.jsx(We,{className:"h-4 w-4"}),"Metrics"]}),e.jsxs("div",{className:"grid grid-cols-3 gap-3",children:[e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-800 rounded-lg p-3",children:[e.jsx("div",{className:"text-xs text-gray-500 mb-1",children:"Lines of Code"}),e.jsx("div",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:k.metrics.linesOfCode})]}),e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-800 rounded-lg p-3",children:[e.jsx("div",{className:"text-xs text-gray-500 mb-1",children:"Complexity"}),e.jsx("div",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:k.metrics.complexity})]}),k.metrics.testCoverage!==void 0&&e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-800 rounded-lg p-3",children:[e.jsx("div",{className:"text-xs text-gray-500 mb-1",children:"Test Coverage"}),e.jsxs("div",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:[k.metrics.testCoverage,"%"]})]})]})]})]}):e.jsx(T,{className:"p-8",children:e.jsxs("div",{className:"text-center",children:[e.jsx(le,{className:"h-12 w-12 mx-auto mb-4 text-gray-400"}),e.jsx("h4",{className:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"Select a Module"}),e.jsx("p",{className:"text-sm text-gray-500",children:"Choose a module from the list to view its details and run validations"})]})})})]}):C==="types"?e.jsx(_e,{moduleTypes:t,className:"w-full"}):C==="tests"?e.jsx(Qe,{testFiles:["src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.vitest.stories.test.tsx","src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.addon.test.ts"],className:"w-full"}):e.jsx("div",{className:"p-8 text-center",children:e.jsxs("div",{className:"max-w-md mx-auto",children:[e.jsx(K,{className:"h-16 w-16 text-blue-600 mx-auto mb-4"}),e.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"Module Type Editor"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-400 mb-6",children:"Create and manage module type definitions with comprehensive configuration options including discovery patterns, structure requirements, and validation rules."}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs(O,{onClick:()=>{console.log("Navigate to /module-types"),window.open("/module-types","_blank")},className:"w-full flex items-center justify-center gap-2",children:[e.jsx(K,{className:"h-4 w-4"}),"Open Module Type Editor"]}),e.jsx("p",{className:"text-xs text-gray-500",children:"Opens the dedicated Module Type Editor page"})]})]})})]})};ze.__docgenInfo={description:"",methods:[],displayName:"ModuleExplorer",props:{className:{required:!1,tsType:{name:"string"},description:""}}};const qt=({className:s})=>{const{migrations:t,activeMigration:a,migrationHistory:n,isRunning:i,isLoading:c,startMigration:o,pauseMigration:g,runComplianceCheck:f,runAutoMigration:N,exportReport:v,refreshData:j}=Ft(),[h,E]=p.useState(a?.id||"portable-stories"),[l,m]=p.useState("all"),[r,y]=p.useState("");p.useEffect(()=>{j()},[]);const x=t.find(d=>d.id===h)||t[0];return c?e.jsx("div",{className:w("min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center",s),children:e.jsxs("div",{className:"text-center",children:[e.jsx(Y,{className:"h-8 w-8 animate-spin mx-auto mb-4 text-gray-400"}),e.jsx("p",{className:"text-gray-500",children:"Loading migrations..."})]})}):!t||t.length===0?e.jsx("div",{className:w("min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center",s),children:e.jsxs("div",{className:"text-center",children:[e.jsx(je,{className:"h-12 w-12 mx-auto mb-4 text-gray-400"}),e.jsx("h2",{className:"text-xl font-semibold text-gray-900 dark:text-white mb-2",children:"No Migrations Found"}),e.jsx("p",{className:"text-gray-500",children:"Create your first migration to get started."})]})}):e.jsxs("div",{className:w("min-h-screen bg-gray-50 dark:bg-gray-900",s),children:[e.jsx("div",{className:"bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700",children:e.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:e.jsxs("div",{className:"flex items-center justify-between py-4",children:[e.jsxs("div",{className:"flex items-center space-x-4",children:[e.jsx(je,{className:"h-8 w-8 text-blue-600 dark:text-blue-400"}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:"Migration Manager"}),e.jsx("p",{className:"text-sm text-gray-500 dark:text-gray-400",children:"Manage and track code migrations across your codebase"})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsxs(O,{variant:"outline",size:"sm",onClick:j,className:"flex items-center gap-2",children:[e.jsx(Y,{className:"h-4 w-4"}),"Refresh"]}),e.jsxs(O,{variant:"outline",size:"sm",onClick:v,className:"flex items-center gap-2",children:[e.jsx(Ge,{className:"h-4 w-4"}),"Export Report"]})]})]})})}),e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:[e.jsxs("div",{className:"mb-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h2",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:"Active Migration"}),e.jsxs("select",{value:h,onChange:d=>E(d.target.value),className:"w-64 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",children:[t.length===0&&e.jsx("option",{value:"",children:"Select a migration"}),t.map(d=>e.jsxs("option",{value:d.id,children:[d.name," (",d.compliance.toFixed(1),"%)"]},d.id))]})]}),x?e.jsx(T,{className:"p-6",children:e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-2",children:[e.jsx("h3",{className:"text-xl font-semibold text-gray-900 dark:text-white",children:x.name}),e.jsx(S,{variant:x.status==="completed"?"secondary":x.status==="in-progress"?"outline":"default",children:x.status})]}),e.jsx("p",{className:"text-gray-600 dark:text-gray-400 mb-4",children:x.description}),e.jsxs("div",{className:"mb-4",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Compliance Progress"}),e.jsxs("span",{className:"text-sm font-semibold text-gray-900 dark:text-white",children:[x.compliance,"% / ",x.target,"%"]})]}),e.jsx(ge,{value:x.compliance,max:100,className:"h-3"}),e.jsxs("div",{className:"flex items-center justify-between mt-2",children:[e.jsxs("span",{className:"text-xs text-gray-500",children:[x.filesCompliant," of ",x.totalFiles," files"]}),e.jsxs("span",{className:"text-xs text-gray-500",children:[x.filesRemaining," remaining"]})]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs(O,{onClick:()=>f(x.id),variant:"outline",size:"sm",className:"flex items-center gap-2",children:[e.jsx(Oe,{className:"h-4 w-4"}),"Check Compliance"]}),e.jsxs(O,{onClick:()=>N(x.id),variant:"outline",size:"sm",className:"flex items-center gap-2",disabled:i,children:[e.jsx(ie,{className:"h-4 w-4"}),"Auto-Migrate"]}),e.jsx(O,{onClick:()=>i?g():o(x.id),variant:i?"destructive":"default",size:"sm",className:"flex items-center gap-2",children:i?e.jsxs(e.Fragment,{children:[e.jsx(Xe,{className:"h-4 w-4"}),"Pause"]}):e.jsxs(e.Fragment,{children:[e.jsx(he,{className:"h-4 w-4"}),"Start Migration"]})})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 ml-8",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:x.timeEstimate}),e.jsx("div",{className:"text-xs text-gray-500",children:"Est. Time"})]}),e.jsxs("div",{className:"text-center",children:[e.jsxs("div",{className:"text-2xl font-bold text-green-600",children:[x.successRate,"%"]}),e.jsx("div",{className:"text-xs text-gray-500",children:"Success Rate"})]})]})]})}):e.jsx(T,{className:"p-6",children:e.jsxs("div",{className:"text-center py-8",children:[e.jsx($,{className:"h-12 w-12 text-gray-400 mx-auto mb-4"}),e.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"No Migrations Found"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-400",children:"Create a new migration or select an existing one to get started."})]})})]}),x&&e.jsxs(Le,{defaultValue:"overview",className:"space-y-4",children:[e.jsxs($e,{children:[e.jsx(D,{value:"overview",children:"Overview"}),e.jsx(D,{value:"modules",children:"Modules"}),e.jsx(D,{value:"files",children:"Files"}),e.jsx(D,{value:"tools",children:"Tools"}),e.jsx(D,{value:"history",children:"History"}),e.jsx(D,{value:"docs",children:"Documentation"})]}),e.jsxs(L,{value:"overview",className:"space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs(T,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"Compliance Metrics"}),e.jsx(Je,{className:"h-5 w-5 text-blue-600"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Current"}),e.jsxs("span",{className:"font-semibold",children:[x.compliance,"%"]})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Target"}),e.jsxs("span",{className:"font-semibold",children:[x.target,"%"]})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Gap"}),e.jsxs("span",{className:"font-semibold text-orange-600",children:[x.target-x.compliance,"%"]})]})]})]}),e.jsxs(T,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"File Statistics"}),e.jsx(z,{className:"h-5 w-5 text-green-600"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Total Files"}),e.jsx("span",{className:"font-semibold",children:x.totalFiles})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Compliant"}),e.jsx("span",{className:"font-semibold text-green-600",children:x.filesCompliant})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Remaining"}),e.jsx("span",{className:"font-semibold text-orange-600",children:x.filesRemaining})]})]})]}),e.jsxs(T,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"Time Tracking"}),e.jsx(Ie,{className:"h-5 w-5 text-purple-600"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Started"}),e.jsx("span",{className:"font-semibold",children:x.startDate})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Elapsed"}),e.jsx("span",{className:"font-semibold",children:x.elapsedTime})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"ETA"}),e.jsx("span",{className:"font-semibold",children:x.eta})]})]})]})]}),e.jsxs(T,{className:"p-6",children:[e.jsxs("h3",{className:"font-semibold text-gray-900 dark:text-white mb-4",children:["Migration Path to ",x.target,"% Compliance"]}),e.jsx("div",{className:"space-y-3",children:x.milestones?.map((d,C)=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:w("flex items-center justify-center w-8 h-8 rounded-full",d.completed?"bg-green-100 text-green-600":d.current?"bg-blue-100 text-blue-600":"bg-gray-100 text-gray-400"),children:d.completed?e.jsx(U,{className:"h-5 w-5"}):d.current?e.jsx("div",{className:"w-3 h-3 bg-blue-600 rounded-full animate-pulse"}):e.jsx("div",{className:"w-3 h-3 bg-gray-400 rounded-full"})}),e.jsx("div",{className:"flex-1",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("div",{className:"font-medium text-gray-900 dark:text-white",children:d.name}),e.jsx("div",{className:"text-sm text-gray-500",children:d.description})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"font-semibold text-gray-900 dark:text-white",children:[d.targetCompliance,"%"]}),e.jsxs("div",{className:"text-xs text-gray-500",children:[d.filesNeeded," files"]})]})]})})]},C))})]}),e.jsxs(T,{className:"p-6",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white mb-4",children:"Recent Activity"}),e.jsx("div",{className:"space-y-3",children:n.slice(0,5).map((d,C)=>e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:w("p-2 rounded-lg",d.type==="success"?"bg-green-100 text-green-600":d.type==="warning"?"bg-yellow-100 text-yellow-600":d.type==="error"?"bg-red-100 text-red-600":"bg-gray-100 text-gray-600"),children:d.type==="success"?e.jsx(U,{className:"h-4 w-4"}):d.type==="warning"?e.jsx(Z,{className:"h-4 w-4"}):d.type==="error"?e.jsx(Q,{className:"h-4 w-4"}):e.jsx($,{className:"h-4 w-4"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-medium text-gray-900 dark:text-white",children:d.message}),e.jsx("div",{className:"text-xs text-gray-500",children:d.timestamp})]})]},C))})]})]}),e.jsx(L,{value:"modules",className:"space-y-4",children:e.jsx(ze,{})}),e.jsxs(L,{value:"files",className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4",children:[e.jsx("div",{className:"flex-1",children:e.jsx(ue,{type:"search",placeholder:"Search files...",value:r,onChange:d=>y(d.target.value),className:"w-full"})}),e.jsxs("select",{value:l,onChange:d=>m(d.target.value),className:"w-40 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",children:[e.jsx("option",{value:"all",children:"All Files"}),e.jsx("option",{value:"pending",children:"Pending"}),e.jsx("option",{value:"in-progress",children:"In Progress"}),e.jsx("option",{value:"completed",children:"Completed"})]})]}),e.jsx(T,{className:"p-6",children:e.jsx("div",{className:"space-y-2",children:x.files?.filter(d=>(l==="all"||d.status===l)&&(r===""||d.path.toLowerCase().includes(r.toLowerCase()))).map((d,C)=>e.jsxs("div",{className:"flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:w("w-2 h-2 rounded-full",d.status==="completed"?"bg-green-500":d.status==="in-progress"?"bg-yellow-500":"bg-gray-300")}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium text-gray-900 dark:text-white",children:d.path}),e.jsxs("div",{className:"text-xs text-gray-500",children:[d.type," • ",d.complexity," complexity"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(S,{variant:d.status==="completed"?"success":d.status==="in-progress"?"warning":"default",children:d.status}),e.jsx(O,{size:"xs",variant:"ghost",children:e.jsx(q,{className:"h-4 w-4"})})]})]},C))})})]}),e.jsx(L,{value:"tools",className:"space-y-4",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs(T,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"Compliance Checker"}),e.jsx(Oe,{className:"h-5 w-5 text-blue-600"})]}),e.jsx("p",{className:"text-sm text-gray-600 mb-4",children:"Analyze all files to determine current compliance status"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"p-3 bg-gray-50 dark:bg-gray-800 rounded-lg",children:e.jsx("code",{className:"text-xs",children:"npm run migration:check"})}),e.jsx(O,{onClick:()=>f(x.id),className:"w-full",variant:"outline",children:"Run Compliance Check"})]})]}),e.jsxs(T,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"Auto-Migration Tool"}),e.jsx(ie,{className:"h-5 w-5 text-yellow-600"})]}),e.jsx("p",{className:"text-sm text-gray-600 mb-4",children:"Automatically migrate simple cases"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"p-3 bg-gray-50 dark:bg-gray-800 rounded-lg",children:e.jsx("code",{className:"text-xs",children:"npm run migration:auto"})}),e.jsx(O,{onClick:()=>N(x.id),className:"w-full",variant:"outline",children:"Run Auto-Migration"})]})]}),e.jsxs(T,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"ESLint Enforcement"}),e.jsx(K,{className:"h-5 w-5 text-purple-600"})]}),e.jsx("p",{className:"text-sm text-gray-600 mb-4",children:"Enforce pattern compliance with ESLint rules"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"p-3 bg-gray-50 dark:bg-gray-800 rounded-lg",children:e.jsx("code",{className:"text-xs",children:"npm run migration:validate"})}),e.jsx(O,{className:"w-full",variant:"outline",children:"Run Validation"})]})]}),e.jsxs(T,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"Terminal Output"}),e.jsx(Fe,{className:"h-5 w-5 text-green-600"})]}),e.jsxs("div",{className:"bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs h-32 overflow-y-auto",children:[e.jsx("div",{children:"$ npm run migration:check"}),e.jsx("div",{children:"🔍 Analyzing test files for compliance..."}),e.jsx("div",{children:" "}),e.jsx("div",{children:"📊 Portable Stories Compliance Report"}),e.jsx("div",{children:" "}),e.jsx("div",{children:"Summary:"}),e.jsx("div",{children:"  Total test files: 47"}),e.jsx("div",{children:"  Compliant: 28"}),e.jsx("div",{children:"  Non-compliant: 5"}),e.jsx("div",{children:" "}),e.jsx("div",{children:"Compliance Rate: 84.8%"})]})]})]})}),e.jsx(L,{value:"history",className:"space-y-4",children:e.jsx(T,{className:"p-6",children:e.jsx("div",{className:"space-y-4",children:n.map((d,C)=>e.jsxs("div",{className:"flex items-start gap-4 pb-4 border-b last:border-0",children:[e.jsx("div",{className:w("p-2 rounded-lg",d.type==="success"?"bg-green-100 text-green-600":d.type==="warning"?"bg-yellow-100 text-yellow-600":d.type==="error"?"bg-red-100 text-red-600":"bg-gray-100 text-gray-600"),children:d.type==="success"?e.jsx(U,{className:"h-5 w-5"}):d.type==="warning"?e.jsx(Z,{className:"h-5 w-5"}):d.type==="error"?e.jsx(Q,{className:"h-5 w-5"}):e.jsx($,{className:"h-5 w-5"})}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center justify-between mb-1",children:[e.jsx("h4",{className:"font-medium text-gray-900 dark:text-white",children:d.message}),e.jsx("span",{className:"text-xs text-gray-500",children:d.timestamp})]}),e.jsx("p",{className:"text-sm text-gray-600",children:d.details}),d.files&&e.jsx("div",{className:"mt-2 flex flex-wrap gap-2",children:d.files.map((b,k)=>e.jsx(S,{variant:"outline",className:"text-xs",children:b},k))})]})]},C))})})}),e.jsx(L,{value:"docs",className:"space-y-4",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs(T,{className:"p-6",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white mb-4",children:"Migration Guide"}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("a",{href:"#",className:"flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(z,{className:"h-5 w-5 text-blue-600"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium",children:"Migration Process"}),e.jsx("div",{className:"text-xs text-gray-500",children:"6-phase methodology"})]})]}),e.jsx(q,{className:"h-4 w-4 text-gray-400"})]}),e.jsxs("a",{href:"#",className:"flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(z,{className:"h-5 w-5 text-green-600"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium",children:"Golden Examples"}),e.jsx("div",{className:"text-xs text-gray-500",children:"Button, HomePage"})]})]}),e.jsx(q,{className:"h-4 w-4 text-gray-400"})]}),e.jsxs("a",{href:"#",className:"flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(z,{className:"h-5 w-5 text-purple-600"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-medium",children:"Migration Example"}),e.jsx("div",{className:"text-xs text-gray-500",children:"DashboardPage step-by-step"})]})]}),e.jsx(q,{className:"h-4 w-4 text-gray-400"})]})]})]}),e.jsxs(T,{className:"p-6",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white mb-4",children:"Resources"}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx($,{className:"h-4 w-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-medium",children:"Quick Start"})]}),e.jsxs("p",{className:"text-xs text-gray-600",children:["Run ",e.jsx("code",{children:"npm run migration:check"})," to see current status"]})]}),e.jsxs("div",{className:"p-3 bg-green-50 dark:bg-green-900/20 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(U,{className:"h-4 w-4 text-green-600"}),e.jsx("span",{className:"text-sm font-medium",children:"Best Practices"})]}),e.jsx("p",{className:"text-xs text-gray-600",children:"Start with simple components and work up to complex ones"})]}),e.jsxs("div",{className:"p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx(Z,{className:"h-4 w-4 text-yellow-600"}),e.jsx("span",{className:"text-sm font-medium",children:"Common Issues"})]}),e.jsx("p",{className:"text-xs text-gray-600",children:"Complex mocking patterns require manual migration"})]})]})]})]})})]})]})]})};qt.__docgenInfo={description:"",methods:[],displayName:"MigrationsPage",props:{className:{required:!1,tsType:{name:"string"},description:""}}};export{qt as M};
