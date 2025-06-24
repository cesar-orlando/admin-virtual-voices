import { useState, useEffect } from 'react';

export const useCompanyStatuses = () => {
  const [statuses, setStatuses] = useState<string[]>(() => {
    const saved = localStorage.getItem('companyStatuses');
    return saved ? JSON.parse(saved) : ["Activo", "Inactivo"];
  });

  const addStatus = (newStatus: string) => {
    if (newStatus && !statuses.includes(newStatus)) {
      const updatedStatuses = [...statuses, newStatus];
      setStatuses(updatedStatuses);
      localStorage.setItem('companyStatuses', JSON.stringify(updatedStatuses));
    }
  };

  const removeStatus = (statusToRemove: string) => {
    if (statuses.length > 2) {
      const updatedStatuses = statuses.filter(status => status !== statusToRemove);
      setStatuses(updatedStatuses);
      localStorage.setItem('companyStatuses', JSON.stringify(updatedStatuses));
    }
  };

  const updateStatuses = (newStatuses: string[]) => {
    setStatuses(newStatuses);
    localStorage.setItem('companyStatuses', JSON.stringify(newStatuses));
  };

  return {
    statuses,
    addStatus,
    removeStatus,
    updateStatuses
  };
}; 