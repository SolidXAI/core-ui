// rolesHelper.ts in your NPM package

import { useSelector } from 'react-redux';

export function useHasAllRoles(roles: string[]): boolean {
  const { user } = useSelector((state: any) => state.auth);
  return !!user?.user?.roles && roles.every(role => user?.user?.roles.includes(role));
}

export function useHasAnyRole(rolesToCheck: string[]) {
  const { user } = useSelector((state: any) => state.auth);
  return hasAnyRole(user?.user?.roles, rolesToCheck);
}

export function hasAnyRole(userRoles: string[] | undefined, rolesToCheck: string[]) {
  return !!userRoles && rolesToCheck.some(role => userRoles.includes(role));
}
