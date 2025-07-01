import { useParams } from 'react-router-dom';
import { users } from './data/data';
import { Button } from '../../components/ui/button';
import { useState } from 'react';
import { AccessGrant } from './data/schema';
import PageLayout from '../../components/layouts/page-layout';
import { Dialog } from '../../components/ui/dialog';
import { Icons } from '../../components/icons';
import { AddAccessForm } from './components/add-access-form';
import { DataTable } from '../../components/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../components/data-table/data-table-column-header';
import { DataTableRowActions } from './components/permissions-table/data-table-row-actions';

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const user = users.find((u) => u.id === userId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setForceUpdate] = useState(0);

  if (!user) {
    return <div>User not found</div>;
  }

  const handleAddAccess = (role: string, workspaces: string[]) => {
    user.access.push({ role, workspaces });
    setForceUpdate((c) => c + 1);
    setIsModalOpen(false);
  };

  const handleDeleteAccess = (grantToDelete: AccessGrant) => {
    if (!user) return;
    user.access = user.access.filter((grant) => grant !== grantToDelete);
    setForceUpdate((c) => c + 1);
  };

  const columns: ColumnDef<AccessGrant>[] = [
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <div>{row.getValue('role')}</div>,
    },
    {
      accessorKey: 'workspaces',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Workspaces" />
      ),
      cell: ({ row }) => (
        <div>{(row.getValue('workspaces') as string[]).join(', ')}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          onDelete={() => handleDeleteAccess(row.original)}
        />
      ),
    },
  ];

  return (
    <PageLayout
      title={user.name}
      subtitle={user.email}
      actions={[
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Trigger asChild>
            <Button
              variant={'expandIcon'}
              Icon={Icons.plus}
              iconPlacement="right"
            >
              Add Access
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <AddAccessForm
              onClose={() => setIsModalOpen(false)}
              onAddAccess={handleAddAccess}
            />
          </Dialog.Content>
        </Dialog>,
      ]}
    >
      <DataTable
        columns={columns}
        data={user.access}
        isLoading={false}
        hideToolbar
      />
    </PageLayout>
  );
} 