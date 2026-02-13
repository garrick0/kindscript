import{R as i}from"./ReleaseFilters-Ycse-2-j.js";import"./iframe-D5evrB1t.js";import"./preload-helper-D9Z9MdNV.js";const e=o=>()=>console.log("Action:",o),h={title:"Design System/Organisms/ReleaseFilters",component:i,parameters:{layout:"padded",docs:{description:{component:"Filter controls for the releases list, allowing users to filter by status and other criteria."}}},tags:["autodocs"],argTypes:{currentStatus:{control:"select",options:["","draft","review","approved","archived"],description:"Currently selected status filter"},currentSearch:{control:"text",description:"Currently selected search term"},onFilterChange:{action:"filterChanged",description:"Called when a filter is changed"},onClearFilters:{action:"filtersCleared",description:"Called when filters are cleared"}}},r={args:{currentStatus:"",currentSearch:"",onFilterChange:e("filter-changed"),onClearFilters:e("filters-cleared")}},t={args:{currentStatus:"draft",currentSearch:"",onFilterChange:e("filter-changed"),onClearFilters:e("filters-cleared")}},a={args:{currentStatus:"review",currentSearch:"",onFilterChange:e("filter-changed"),onClearFilters:e("filters-cleared")}},n={args:{currentStatus:"approved",currentSearch:"",onFilterChange:e("filter-changed"),onClearFilters:e("filters-cleared")}},c={args:{currentStatus:"",currentSearch:"wireframe",onFilterChange:e("filter-changed"),onClearFilters:e("filters-cleared")}},s={args:{currentStatus:"review",currentSearch:"auth",onFilterChange:e("filter-changed"),onClearFilters:e("filters-cleared")}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    currentStatus: '',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    currentStatus: 'draft',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    currentStatus: 'review',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    currentStatus: 'approved',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
}`,...n.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    currentStatus: '',
    currentSearch: 'wireframe',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
}`,...c.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    currentStatus: 'review',
    currentSearch: 'auth',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
}`,...s.parameters?.docs?.source}}};const g=["Default","WithDraftSelected","WithReviewSelected","WithApprovedSelected","WithSearchTerm","WithStatusAndSearch"];export{r as Default,n as WithApprovedSelected,t as WithDraftSelected,a as WithReviewSelected,c as WithSearchTerm,s as WithStatusAndSearch,g as __namedExportsOrder,h as default};
