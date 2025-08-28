import {
  Activity,
  Component,
  Home,
  Mail,
  Package,
  ScrollText,
  SunMoon,
} from 'lucide-react';

import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import Link from 'next/link';

// Core app pages we want quick access to during demos
const data = [
  { title: 'Home', icon: <Home className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/' },
  { title: 'Dashboard', icon: <Activity className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/dashboard' },
  { title: 'Traffic', icon: <Package className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/traffic' },
  { title: 'Simulation', icon: <ScrollText className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/traffic/simulation' },
  { title: 'Classify', icon: <Component className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/classify' },
  { title: 'Investigations', icon: <Activity className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/investigations' },
  { title: 'Suggestions', icon: <Mail className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/suggestions' },
  { title: 'Model', icon: <Component className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/model' },
  { title: 'Admin', icon: <Home className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '/admin' },
  { title: 'Theme', icon: <SunMoon className='h-full w-full text-neutral-600 dark:text-neutral-300' />, href: '#' },
];

export function AppleStyleDock() {
  return (
    <div className='fixed bottom-4 left-1/2 max-w-full -translate-x-1/2 z-50'>
      <Dock className='items-end pb-3'>
        {data.map((item, idx) => (
          <DockItem
            key={idx}
            className='aspect-square rounded-full bg-gray-200 dark:bg-neutral-800'
          >
            <DockLabel>
              <Link href={item.href}>{item.title}</Link>
            </DockLabel>
            <DockIcon>
              <Link href={item.href}>{item.icon}</Link>
            </DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
}
