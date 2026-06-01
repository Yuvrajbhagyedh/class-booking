import { SetMetadata } from '@nestjs/common';
export enum Role { TEACHER = 'teacher', PARENT = 'parent' }
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
