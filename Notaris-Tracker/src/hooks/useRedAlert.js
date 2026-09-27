import { useMemo } from 'react';
import { useCases } from './useCases';
import { checkOverdue } from '../utils/checkOverdue';

export const useRedAlert = () => {
  const { cases } = useCases();

  const overdueCases = useMemo(() => {
    return cases.filter((c) => !c.isDraft && checkOverdue(c.estimationDate, c.status));
  }, [cases]);

  return {
    overdueCases,
    hasAlerts: overdueCases.length > 0,
    count: overdueCases.length,
  };
};
export default useRedAlert;
