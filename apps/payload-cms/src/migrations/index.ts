import * as migration_20260529_202003 from './20260529_202003';
import * as migration_20260529_202327 from './20260529_202327';
import * as migration_20260529_220000 from './20260529_220000';

export const migrations = [
  {
    up: migration_20260529_202003.up,
    down: migration_20260529_202003.down,
    name: '20260529_202003',
  },
  {
    up: migration_20260529_202327.up,
    down: migration_20260529_202327.down,
    name: '20260529_202327',
  },
  {
    up: migration_20260529_220000.up,
    down: migration_20260529_220000.down,
    name: '20260529_220000',
  },
];
