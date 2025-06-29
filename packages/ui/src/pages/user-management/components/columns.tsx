import { ColumnDef } from '@tanstack/react-table';
import { User } from '../data/schema';
import { DataTableColumnHeader } from '../../../components/data-table/data-table-column-header';
import { Row } from '@tanstack/react-table';
import { DropdownMenu } from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const navigate = useNavigate();
  const user = row.original as User;

  const handleEdit = () => {
    navigate(`/user-management/${user.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="w-[160px]">
        <DropdownMenu.Item onClick={handleEdit}>Edit</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div>{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'access',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Roles" />
    ),
    cell: ({ row }) => {
      const access = row.getValue('access') as User['access'];
      return <div>{access.map((a) => a.role).join(', ')}</div>;
    },
  },
  {
    id: 'workspaces',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Workspaces" />
    ),
    cell: ({ row }) => {
      const access = row.original.access;
      const allWorkspaces = new Set<string>();
      access.forEach((a) => a.workspaces.forEach((w) => allWorkspaces.add(w)));
      return <div>{[...allWorkspaces].join(', ')}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]; 