interface NavigatorWithBrave extends Navigator {
  brave?: {
    isBrave: () => Promise<boolean>;
  };
}

export function isBraveBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as NavigatorWithBrave).brave !== undefined;
}
