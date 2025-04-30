import React from 'react';
import { Outlet } from 'react-router-dom';

import PageLayout from '../../components/layouts/page-layout';
import { PageSideNavLink } from '../../components/layouts/page-side-nav';
import { useUser } from '../../hooks/useUser';

export default function LayoutComponent() {
  const { workspace } = useUser();

  const leftRailNavigationItems: React.ReactNode[] = [
    <PageSideNavLink
      item={{ title: 'Workspace', to: '/workspace-settings' }}
    />,
    <PageSideNavLink
      item={{ title: 'Preferences', to: '/workspace-preferences' }}
    />,
    <PageSideNavLink
      item={{ title: 'Invitations', to: '/workspace-invitations' }}
    />,
  ];

  return (
    <PageLayout
      title="Workspace Settings"
      subtitle={`Manage your settings for ${workspace!.name}.`}
      leftRailNavigationItems={[...leftRailNavigationItems]}
    >
      <Outlet />
    </PageLayout>
  );
}
