import React from 'react';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface User {
  name: string;
  role: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  // Fixed: Added React import above to resolve React namespace here
  icon: React.ReactNode;
  path: string;
  color: string;
}