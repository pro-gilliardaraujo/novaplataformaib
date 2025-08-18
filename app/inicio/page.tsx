'use client';

import { Box, Heading, Text, VStack, HStack, Button, Grid, GridItem, Icon } from '@chakra-ui/react';
import { FiFileText, FiBarChart, FiSettings, FiUsers } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function InicioPage() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Relatórios',
      description: 'Geração e visualização de relatórios',
      icon: FiFileText,
      path: '/relatorios',
      color: 'blue'
    },
    {
      title: 'Gráficos',
      description: 'Visualização de dados em gráficos',
      icon: FiBarChart,
      path: '/graficos',
      color: 'green'
    },
    {
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: FiSettings,
      path: '/configuracoes',
      color: 'purple'
    },
    {
      title: 'Usuários',
      description: 'Gerenciamento de usuários',
      icon: FiUsers,
      path: '/usuarios',
      color: 'orange'
    }
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" mb={4}>Nova Plataforma IB</Heading>
          <Text fontSize="lg" color="gray.600">
            Sistema de Gerenciamento de Relatórios de Colheita
          </Text>
        </Box>

        {/* Menu Grid */}
        <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={6}>
          {menuItems.map((item, index) => (
            <GridItem key={index}>
              <Box
                bg="white"
                p={6}
                borderRadius="lg"
                boxShadow="md"
                border="1px"
                borderColor="gray.200"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                  borderColor: `${item.color}.200`
                }}
                onClick={() => handleNavigate(item.path)}
              >
                <VStack spacing={4} align="center">
                  <Box
                    p={3}
                    borderRadius="full"
                    bg={`${item.color}.50`}
                    border="2px"
                    borderColor={`${item.color}.200`}
                  >
                    <Icon as={item.icon} boxSize={8} color={`${item.color}.500`} />
                  </Box>
                  
                  <VStack spacing={2} textAlign="center">
                    <Heading size="md" color="gray.700">
                      {item.title}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {item.description}
                    </Text>
                  </VStack>
                  
                  <Button
                    colorScheme={item.color}
                    variant="outline"
                    size="sm"
                    w="full"
                  >
                    Acessar
                  </Button>
                </VStack>
              </Box>
            </GridItem>
          ))}
        </Grid>

        {/* Footer Info */}
        <Box textAlign="center" pt={8}>
          <Text fontSize="sm" color="gray.500">
            Versão 1.0.7 - Sistema migrado para Next.js 14 com Chakra UI v2
          </Text>
        </Box>
      </VStack>
    </Box>
  );
} 