import { useContext } from 'react';
import { CasesContext } from '../contexts/CasesContext';

export const useCases = () => {
  const context = useContext(CasesContext);
  if (!context) {
    throw new Error('useCases must be used within a CasesProvider');
  }
  return context;
};
export default useCases;
