import { Row } from '@tanstack/react-table';
import { DropdownMenu } from '../../../../components/ui/dropdown-menu';
import { Button } from '../../../../components/ui/button';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { AccessGrant } from '../../data/schema';

interface DataTableRowActionsProps {
  row: Row<AccessGrant>;
  onDelete: () => void;
}

export function DataTableRowActions({
  onDelete,
}: DataTableRowActionsProps) {
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
        <DropdownMenu.Item
          onClick={onDelete}
          className="text-red-600 focus:text-red-600"
        >
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
} 