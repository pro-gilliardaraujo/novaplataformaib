'use client';

import { ChakraProvider as ChakraProviderBase } from '@chakra-ui/react';

// Componente Provider básico
export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProviderBase>
      {children}
    </ChakraProviderBase>
  );
}

// Exportação padrão
export default ChakraProvider; 