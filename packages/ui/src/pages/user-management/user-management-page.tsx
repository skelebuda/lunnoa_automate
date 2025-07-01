import React from 'react';
import { DataTable } from '../../components/data-table/data-table';
import { columns } from './components/columns';
import { users } from './data/data';

export function UserManagementPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <p>Manage your workspace users here.</p>
      <div className="mt-4">
        <DataTable columns={columns} data={users} isLoading={false} />
      </div>
    </div>
  );
} 