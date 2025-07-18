import { Injectable } from '@nestjs/common';

import { ServerConfig } from '../../../config/server.config';
import { PrismaService } from '../../global/prisma/prisma.service';

@Injectable()
export class DevService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  getWorkspaces = async () => {
    return await this.prisma.workspace.findMany({
      select: {
        id: true,
        createdAt: true,
        createdByWorkspaceUser: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        workspaceUsers: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        connections: {
          select: {
            _count: true,
          },
        },
        knowledge: {
          select: {
            _count: true,
          },
        },
        variables: {
          select: {
            _count: true,
          },
        },
        projects: {
          select: {
            _count: true,
            workflows: {
              select: {
                _count: true,
                executions: true,
              },
            },
            agents: {
              select: {
                _count: true,
                tasks: {
                  select: {
                    _count: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  };

  getWorkspacesByEmail = async ({ email }: { email: string }) => {
    return await this.prisma.workspace.findMany({
      where: {
        workspaceUsers: {
          some: {
            user: {
              email,
            },
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
        createdByWorkspaceUser: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        workspaceUsers: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        connections: {
          select: {
            _count: true,
          },
        },
        knowledge: {
          select: {
            _count: true,
          },
        },
        variables: {
          select: {
            _count: true,
          },
        },
        projects: {
          select: {
            _count: true,
            workflows: {
              select: {
                _count: true,
                executions: true,
              },
            },
            agents: {
              select: {
                _count: true,
                tasks: {
                  select: {
                    _count: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  };
}
