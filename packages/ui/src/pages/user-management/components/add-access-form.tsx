import { Button } from '../../../components/ui/button';
import { roles, workspaces as allWorkspaces } from '../data/data';
import { MultiSelect } from '../../../components/ui/multi-select';
import { Select } from '../../../components/ui/select';
import { Form } from '../../../components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface AddAccessFormProps {
  onClose: () => void;
  onAddAccess: (role: string, workspaces: string[]) => void;
}

const addAccessSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  workspaces: z.array(z.string()).min(1, 'At least one workspace is required'),
});

type AddAccessType = z.infer<typeof addAccessSchema>;

export function AddAccessForm({ onAddAccess, onClose }: AddAccessFormProps) {
  const form = useForm<AddAccessType>({
    resolver: zodResolver(addAccessSchema),
    defaultValues: {
      role: '',
      workspaces: [],
    },
  });

  const onSubmit = (values: AddAccessType) => {
    onAddAccess(values.role, values.workspaces);
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <Form.Header>
          <Form.Title>Add Access</Form.Title>
          <Form.Description>
            Select a role and one or more workspaces to grant access.
          </Form.Description>
        </Form.Header>
        <Form.Content className="space-y-6">
          <Form.Field
            control={form.control}
            name="role"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Role</Form.Label>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <Form.Control>
                    <Select.Trigger>
                      <Select.Value placeholder="Select a role" />
                    </Select.Trigger>
                  </Form.Control>
                  <Select.Content>
                    {roles.map((role: string) => (
                      <Select.Item key={role} value={role}>
                        {role}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="workspaces"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Workspaces</Form.Label>
                <MultiSelect
                  items={allWorkspaces.map((ws: string) => ({
                    label: ws,
                    value: ws,
                  }))}
                  onChange={field.onChange}
                  placeholder="Select workspaces"
                />
                <Form.Message />
              </Form.Item>
            )}
          />
        </Form.Content>
        <Form.Footer className="space-x-2 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Access</Button>
        </Form.Footer>
      </form>
    </Form>
  );
} 