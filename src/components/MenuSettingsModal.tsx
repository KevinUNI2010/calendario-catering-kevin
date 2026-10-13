import { useEscapeKey } from '../hooks/useEscapeKey';
import React, { useState, useEffect } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { MenuOptions } from '../types';

interface MenuSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuOptions: MenuOptions;
  onSave: (newOptions: MenuOptions) => void;
}

type CategoryKey = keyof MenuOptions;

export const MenuSettingsModal: React.FC<MenuSettingsModalProps> = ({
  isOpen,
  onClose,
  menuOptions,
  onSave,
}) => {
  useEscapeKey(onClose, isOpen);

  const [localOptions, setLocalOptions] = useState<MenuOptions>(menuOptions);
  const [newItems, setNewItems] = useState<Record<CategoryKey, string>>({
    proteinas: '',
    ensaladas: '',
    salsas: '',
    guarniciones: '',
    carbohidratos: '',
    servilletas: '',
  });
  const [newColors, setNewColors] = useState<Record<CategoryKey, string>>({
    proteinas: '#000000',
    ensaladas: '#000000',
    salsas: '#000000',
    guarniciones: '#000000',
    carbohidratos: '#000000',
    servilletas: '#f472b6', // pink default
  });
  const [editingItem, setEditingItem] = useState<{ category: CategoryKey, originalName: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalOptions(menuOptions);
    }
  }, [isOpen, menuOptions]);

  if (!isOpen) return null;

  const categories: { key: CategoryKey; label: string; color: string }[] = [
    { key: 'proteinas', label: 'Proteínas', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' },
    { key: 'ensaladas', label: 'Ensaladas', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' },
    { key: 'guarniciones', label: 'Guarniciones', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    { key: 'carbohidratos', label: 'Carbohidratos', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { key: 'salsas', label: 'Salsas', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    { key: 'servilletas', label: 'Servilletas', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
  ];

  const handleAddItem = (category: CategoryKey) => {
    let rawName = newItems[category].trim();
    if (!rawName) return;

    let itemToSave = rawName;
    if (category === 'servilletas') {
      if (!rawName.includes('|')) {
        itemToSave = `${rawName}|${newColors[category]}`;
      } else {
        rawName = rawName.split('|')[0].trim();
      }
    }

    setLocalOptions((prev) => {
      const currentList = prev[category];
      
      // If we are actively editing an item in this category, replace it
      if (editingItem && editingItem.category === category) {
        const existingIndex = currentList.findIndex(existing => {
          if (category === 'servilletas') return existing.split('|')[0] === editingItem.originalName;
          return existing === editingItem.originalName;
        });

        if (existingIndex >= 0) {
          const newList = [...currentList];
          newList[existingIndex] = itemToSave;
          return { ...prev, [category]: newList };
        }
      }

      // If not editing, or the item wasn't found (fallback), check for duplicates by name
      const duplicateIndex = currentList.findIndex(existing => {
        if (category === 'servilletas') return existing.split('|')[0] === rawName;
        return existing === rawName;
      });

      if (duplicateIndex >= 0) {
        // Overwrite if it already exists
        const newList = [...currentList];
        newList[duplicateIndex] = itemToSave;
        return { ...prev, [category]: newList };
      } else {
        // Append new
        return { ...prev, [category]: [...currentList, itemToSave] };
      }
    });

    setNewItems((prev) => ({ ...prev, [category]: '' }));
    setEditingItem(null);
  };

  const handleRemoveItem = (category: CategoryKey, item: string) => {
    setLocalOptions((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }));
  };

  const handleSave = () => {
    onSave(localOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ⚙️ Configuración del Menú
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-8 flex-1 scrollbar-thin">
          {categories.map(({ key, label, color }) => (
            <div key={key} className="flex flex-col gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
              
              <div className="flex flex-wrap gap-2">
                {localOptions[key]?.map((item) => {
                  const isServilleta = key === 'servilletas';
                  const [name, colorHex] = isServilleta ? item.split('|') : [item, ''];
                  const bgColor = isServilleta && colorHex ? colorHex : '';
                  const textColor = isServilleta && colorHex ? '#111827' : '';

                  return (
                    <div 
                      key={item}
                      className={`flex items-stretch overflow-hidden rounded-full text-xs font-medium border ${isServilleta && colorHex ? 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 shadow-sm' : `${color} px-3 py-1.5 gap-1.5 items-center`}`}
                    >
                      {isServilleta && colorHex && (
                        <div className="w-4 shrink-0 border-r border-black/5 dark:border-white/5" style={{ backgroundColor: colorHex }} />
                      )}
                      <div className={`flex items-center gap-1.5 ${isServilleta && colorHex ? 'px-2.5 py-1.5' : ''}`}>
                        <span 
                          className={`cursor-pointer hover:underline decoration-dashed underline-offset-2 ${isServilleta && colorHex ? 'font-semibold' : ''} ${editingItem?.originalName === name ? 'text-blue-600 dark:text-blue-400' : ''}`}
                          title="Haz clic para editar"
                          onClick={() => {
                            setNewItems(prev => ({ ...prev, [key]: name }));
                            setEditingItem({ category: key, originalName: name });
                            if (isServilleta && colorHex) {
                              setNewColors(prev => ({ ...prev, [key]: colorHex }));
                            }
                          }}
                        >
                          {name}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(key, item)}
                          className={`rounded-full p-0.5 transition cursor-pointer ${isServilleta && colorHex ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mt-1">
                {key === 'servilletas' && (
                  <input
                    type="color"
                    value={newColors[key]}
                    onChange={(e) => setNewColors((prev) => ({ ...prev, [key]: e.target.value }))}
                    title="Color de la servilleta"
                    className="w-10 h-10 p-1 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 cursor-pointer shrink-0"
                  />
                )}
                <input
                  type="text"
                  placeholder={`Añadir nueva opción en ${label.toLowerCase()}...`}
                  value={newItems[key]}
                  onChange={(e) => {
                    setNewItems((prev) => ({ ...prev, [key]: e.target.value }));
                    if (e.target.value === '' && editingItem?.category === key) {
                       setEditingItem(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem(key);
                  }}
                  className="flex-1 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddItem(key)}
                  disabled={!newItems[key].trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                >
                  {editingItem?.category === key ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>

      </div>
    </div>
  );
};
