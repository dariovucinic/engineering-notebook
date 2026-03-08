import React from 'react';
import { SceneObject } from '@/types/cad';

interface PropertiesPanelProps {
    objects: SceneObject[];
    selectedId: string | null;
    handleUpdateObject: (id: string, updates: Partial<SceneObject>) => void;
    forgeParams?: any[];
    paramOverrides?: Record<string, number>;
    setParamOverrides?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    objects, selectedId, handleUpdateObject, forgeParams, paramOverrides, setParamOverrides
}) => {
    const hasParam = forgeParams && forgeParams.length > 0;
    const obj = selectedId ? objects.find(o => o.id === selectedId) : null;

    if (!obj && !hasParam) return null;

    return (
        <div className="bg-black/60 backdrop-blur-xl p-3 rounded-lg border border-white/10 text-white text-xs w-64 mt-2 animate-in slide-in-from-left-2 ml-4 absolute top-28 z-40 shadow-2xl">
            {hasParam && (
                <div className="mb-4">
                    <div className="font-bold mb-3 text-cyan-400 uppercase tracking-widest text-[9px] border-b border-white/10 pb-1">Script Parameters</div>
                    <div className="space-y-4">
                        {forgeParams!.map((p, i) => {
                            const val = paramOverrides?.[p.name] ?? p.value;
                            return (
                                <div key={i} className="flex flex-col gap-1.5 overflow-hidden">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-white/90 font-medium truncate" title={p.description}>{p.name}</span>
                                        <span className="text-[10px] text-cyan-200 bg-cyan-900/30 px-1.5 py-0.5 rounded font-mono">{val} {p.unit || ''}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={p.min ?? 0}
                                        max={p.max ?? 100}
                                        step={p.step ?? 1}
                                        value={val}
                                        onChange={(e) => {
                                            if (setParamOverrides) {
                                                setParamOverrides(prev => ({
                                                    ...prev,
                                                    [p.name]: parseFloat(e.target.value)
                                                }));
                                            }
                                        }}
                                        className="w-full accent-cyan-500 hover:accent-cyan-400 cursor-pointer"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {obj && obj.type !== 'step' && obj.type !== 'forge' && (
                <div className={hasParam ? 'border-t border-white/10 pt-3' : ''}>
                    <div className="font-bold mb-3 text-white/50 uppercase tracking-widest text-[9px] border-b border-white/10 pb-1">Object Info</div>
                    {(() => {
                        const updateDim = (index: number, value: string) => {
                            const num = parseFloat(value);
                            const newDims = [...(obj.dims || [1, 1, 1])] as [number, number, number];
                            const newBindings = [...(obj.dimBindings || [undefined, undefined, undefined])] as [string?, string?, string?];

                            if (!isNaN(num)) {
                                newDims[index] = num;
                                newBindings[index] = undefined;
                            } else {
                                newBindings[index] = value;
                            }
                            handleUpdateObject(obj.id, { dims: newDims, dimBindings: newBindings });
                        };

                        const getValue = (index: number) => {
                            if (obj.dimBindings?.[index]) return obj.dimBindings[index];
                            return obj.dims?.[index] || 1;
                        };

                        return (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 text-white/60 font-mono text-[10px]">X / D</span>
                                    <input
                                        className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 outline-none focus:border-cyan-500 font-mono text-[11px]"
                                        value={getValue(0)}
                                        onChange={(e) => updateDim(0, e.target.value)}
                                    />
                                </div>
                                {(obj.type === 'cube' || obj.type === 'cylinder') && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 text-white/60 font-mono text-[10px]">Y / H</span>
                                        <input
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 outline-none focus:border-cyan-500 font-mono text-[11px]"
                                            value={getValue(1)}
                                            onChange={(e) => updateDim(1, e.target.value)}
                                        />
                                    </div>
                                )}
                                {obj.type === 'cube' && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 text-white/60 font-mono text-[10px]">Z / W</span>
                                        <input
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 outline-none focus:border-cyan-500 font-mono text-[11px]"
                                            value={getValue(2)}
                                            onChange={(e) => updateDim(2, e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
