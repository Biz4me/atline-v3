import * as migration_20260529_202003 from './20260529_202003';

export const migrations = [
  {
    up: migration_20260529_202003.up,
    down: migration_20260529_202003.down,
    name: '20260529_202003'
  },
];
