'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { clsx } from 'clsx';
import type { NetworkNode } from '@atline/types';

function AffiliateNode({ data, selected }: NodeProps) {
  const node = data as unknown as NetworkNode;
  const isNew = new Date(node.joinedAt) > new Date(Date.now() - 30 * 24 * 3600 * 1000);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-300" />

      <div
        className={clsx(
          'bg-white rounded-xl border-2 p-3 shadow-sm w-44 cursor-pointer transition-all',
          selected ? 'border-[#f4b342] shadow-md' : 'border-gray-200',
          node.isActive ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-gray-300'
        )}
      >
        {/* En-tête */}
        <div className="flex items-center gap-2 mb-2">
          <div className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
            node.isActive ? 'bg-emerald-500' : 'bg-gray-400'
          )}>
            {node.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{node.name}</p>
            {isNew && (
              <span className="text-[10px] bg-[#f4b342]/20 text-[#b45309] px-1.5 py-0.5 rounded font-medium">
                Nouveau
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Niveau</span>
            <span className="font-medium text-gray-700">{node.level}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Commission</span>
            <span className="font-medium text-emerald-600">{node.monthlyCommission.toFixed(2)} €</span>
          </div>
          {node.products.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {node.products.slice(0, 2).map((p) => (
                <span key={p} className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  {p}
                </span>
              ))}
              {node.products.length > 2 && (
                <span className="text-[9px] text-gray-400">+{node.products.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-300" />
    </>
  );
}

export default memo(AffiliateNode);
