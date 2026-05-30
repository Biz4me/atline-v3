import * as migration_20260529_202003 from './20260529_202003';
import * as migration_20260529_202327 from './20260529_202327';
import * as migration_20260529_215900 from './20260529_215900';
import * as migration_20260529_220000 from './20260529_220000';
import * as migration_20260530_080000 from './20260530_080000';
import * as migration_20260530_090000 from './20260530_090000';

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
    up: migration_20260529_215900.up,
    down: migration_20260529_215900.down,
    name: '20260529_215900',
  },
  {
    up: migration_20260529_220000.up,
    down: migration_20260529_220000.down,
    name: '20260529_220000',
  },
  {
    up: migration_20260530_080000.up,
    down: migration_20260530_080000.down,
    name: '20260530_080000',
  },
  {
    up: migration_20260530_090000.up,
    down: migration_20260530_090000.down,
    name: '20260530_090000',
  },
];
