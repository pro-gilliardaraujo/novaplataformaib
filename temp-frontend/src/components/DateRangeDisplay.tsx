import React from 'react';
import { Text } from '@chakra-ui/react';

interface DateRangeDisplayProps {
  startDate: Date;
  endDate: Date;
}

export const DateRangeDisplay: React.FC<DateRangeDisplayProps> = ({ startDate, endDate }) => {
  const formatDate = (date: Date) => {
    // Usar a data diretamente sem criar nova instância para evitar problemas de timezone
    
    // Formatar a data no padrão brasileiro (dd/MM/yyyy)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  return (
    <Text fontSize="sm" textAlign="center" color="black">
      {formatDate(startDate)} - {formatDate(endDate)}
    </Text>
  );
}; 