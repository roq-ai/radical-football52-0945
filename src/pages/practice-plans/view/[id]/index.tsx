import AppLayout from 'layout/app-layout';
import Link from 'next/link';
import React, { useState } from 'react';
import { Text, Box, Spinner, TableContainer, Table, Thead, Tr, Th, Tbody, Td, Button } from '@chakra-ui/react';
import { UserSelect } from 'components/user-select';
import { getPracticePlanById } from 'apiSdk/practice-plans';
import { Error } from 'components/error';
import { PracticePlanInterface } from 'interfaces/practice-plan';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { AccessOperationEnum, AccessServiceEnum, useAuthorizationApi, withAuthorization } from '@roq/nextjs';
import { deleteDrillById } from 'apiSdk/drills';

function PracticePlanViewPage() {
  const { hasAccess } = useAuthorizationApi();
  const router = useRouter();
  const id = router.query.id as string;
  const { data, error, isLoading, mutate } = useSWR<PracticePlanInterface>(
    () => (id ? `/practice-plans/${id}` : null),
    () =>
      getPracticePlanById(id, {
        relations: ['coach', 'team', 'drill'],
      }),
  );

  const drillHandleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      await deleteDrillById(id);
      await mutate();
    } catch (error) {
      setDeleteError(error);
    }
  };

  const [deleteError, setDeleteError] = useState(null);
  const [createError, setCreateError] = useState(null);

  return (
    <AppLayout>
      <Text as="h1" fontSize="2xl" fontWeight="bold">
        Practice Plan Detail View
      </Text>
      <Box bg="white" p={4} rounded="md" shadow="md">
        {error && <Error error={error} />}
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <Text fontSize="md" fontWeight="bold">
              name: {data?.name}
            </Text>
            <Text fontSize="md" fontWeight="bold">
              description: {data?.description}
            </Text>
            {hasAccess('coach', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) && (
              <Text fontSize="md" fontWeight="bold">
                coach: <Link href={`/coaches/view/${data?.coach?.id}`}>{data?.coach?.id}</Link>
              </Text>
            )}
            {hasAccess('team', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) && (
              <Text fontSize="md" fontWeight="bold">
                team: <Link href={`/teams/view/${data?.team?.id}`}>{data?.team?.id}</Link>
              </Text>
            )}
            {hasAccess('drill', AccessOperationEnum.READ, AccessServiceEnum.PROJECT) && (
              <>
                <Text fontSize="md" fontWeight="bold">
                  Drill
                </Text>
                <Link href={`/drills/create?practice_plan_id=${data?.id}`}>
                  <Button colorScheme="blue" mr="4">
                    Create
                  </Button>
                </Link>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>id</Th>
                        <Th>name</Th>
                        <Th>description</Th>
                        <Th>Edit</Th>
                        <Th>View</Th>
                        <Th>Delete</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data?.drill?.map((record) => (
                        <Tr key={record.id}>
                          <Td>{record.id}</Td>
                          <Td>{record.name}</Td>
                          <Td>{record.description}</Td>
                          <Td>
                            <Button>
                              <Link href={`/drills/edit/${record.id}`}>Edit</Link>
                            </Button>
                          </Td>
                          <Td>
                            <Button>
                              <Link href={`/drills/view/${record.id}`}>View</Link>
                            </Button>
                          </Td>
                          <Td>
                            <Button onClick={() => drillHandleDelete(record.id)}>Delete</Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </Box>
    </AppLayout>
  );
}

export default withAuthorization({
  service: AccessServiceEnum.PROJECT,
  entity: 'practice_plan',
  operation: AccessOperationEnum.READ,
})(PracticePlanViewPage);
