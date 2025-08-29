import React from 'react';

import { Button } from './ui/button';
import { cn } from '../utils/cn';

function MicrosoftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 23 23"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="13" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="13" width="9" height="9" fill="#00a4ef" />
      <rect x="13" y="13" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export function AzureSignIn() {
  const handleClick = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    if (!serverUrl) return;
    window.location.href = `${serverUrl}/auth/login-with-azure`;
  };

  return (
    <div
      className={cn('mx-auto w-full', {
        hidden: !import.meta.env.VITE_AZURE_AD_CLIENT_ID,
      })}
    >
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleClick}
      >
        <MicrosoftIcon />
        Continue with Microsoft
      </Button>
    </div>
  );
}


