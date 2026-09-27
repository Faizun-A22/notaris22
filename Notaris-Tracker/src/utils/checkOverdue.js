export const checkOverdue = (dateString, status) => {
  if (!dateString || status === 'Selesai') return false;
  
  const targetDate = new Date(dateString);
  if (isNaN(targetDate.getTime())) return false;
  
  // Strip hours, minutes, seconds, milliseconds to compare only dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  return targetDate < today;
};
