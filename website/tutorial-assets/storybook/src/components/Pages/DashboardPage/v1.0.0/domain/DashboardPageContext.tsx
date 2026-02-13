import React, { createContext, ReactNode, useContext, useMemo, useReducer } from 'react';
import type { DashboardAction, DashboardState } from '../types/dashboard.types';

const initialState: DashboardState = {
  selectedStats: [],
  timeRange: '7d',
  view: 'grid',
  refreshInterval: null,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SELECT_STAT':
      return {
        ...state,
        selectedStats: state.selectedStats.includes(action.payload)
          ? state.selectedStats.filter(id => id !== action.payload)
          : [...state.selectedStats, action.payload],
      };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_REFRESH_INTERVAL':
      return { ...state, refreshInterval: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
}

const DashboardPageContext = createContext<DashboardContextValue | null>(null);

export function DashboardPageProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  
  const value = useMemo(() => ({ state, dispatch }), [state]);
  
  return (
    <DashboardPageContext.Provider value={value}>
      {children}
    </DashboardPageContext.Provider>
  );
}

export function useDashboardPageContext() {
  const context = useContext(DashboardPageContext);
  if (!context) {
    throw new Error('useDashboardPageContext must be used within DashboardPageProvider');
  }
  return context;
}