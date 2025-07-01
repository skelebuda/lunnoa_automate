import { User } from './schema';

export const users: User[] = [
  {
    id: 'USR-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    access: [
      { role: 'System Admin', workspaces: ['Accounting', 'IT'] },
      { role: 'Observer', workspaces: ['CRO'] },
    ],
  },
  {
    id: 'USR-002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    access: [{ role: 'Workspace Admin', workspaces: ['CRO'] }],
  },
  {
    id: 'USR-003',
    name: 'Peter Jones',
    email: 'peter.jones@example.com',
    access: [{ role: 'Agent Architect', workspaces: ['CFO'] }],
  },
  {
    id: 'USR-004',
    name: 'Mary Williams',
    email: 'mary.williams@example.com',
    access: [{ role: 'Workflow', workspaces: ['Accounting'] }],
  },
  {
    id: 'USR-005',
    name: 'David Brown',
    email: 'david.brown@example.com',
    access: [{ role: 'Observer', workspaces: ['IT'] }],
  },
  {
    id: 'USR-006',
    name: 'Susan Davis',
    email: 'susan.davis@example.com',
    access: [
      { role: 'Operator', workspaces: ['CRO', 'CFO'] },
      { role: 'Observer', workspaces: ['Accounting'] },
    ],
  },
];

export const roles = [
  'System Admin',
  'Workspace Admin',
  'Agent Architect',
  'Workflow',
  'Observer',
  'Operator',
];

export const workspaces = ['Accounting', 'CRO', 'CFO', 'IT']; 