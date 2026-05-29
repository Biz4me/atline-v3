import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@atline/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      hasLicence: boolean;
      hasCoach: boolean;
      mlmLevel: number;
      directCount: number;
      referralCode: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole;
    hasLicence: boolean;
    hasCoach: boolean;
    mlmLevel: number;
    directCount: number;
    referralCode: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    hasLicence: boolean;
    hasCoach: boolean;
    mlmLevel: number;
    directCount: number;
    referralCode: string;
  }
}
