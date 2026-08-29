import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save, 
  Check, 
  User, 
  Package, 
  UserCheck, 
  Tag, 
  Sparkles,
  Info
} from 'lucide-react';
import { AppDropdownSettings } from '../types';
import { DEFAULT_DROPDOWN_SETTINGS } from '../data/initialTrainings';

interface SettingsProps {
  settings: AppDropdownSettings;
  onUpdateSettings: (newSettings: AppDropdownSettings) => Promise<void>;
  onResetSettings: () => Promise<void>;
}

type ActiveCategory = 'assignedPersons' | 'packages' | 'pms' | 'statuses';

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings
}) => {
  const [activeTab, setActiveTab] = useState<ActiveCategory>('assignedPersons');
  const [newOption, setNewOption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const categories = [
    {
      id: 'assignedPersons' as const,
      label: 'Trainer',
      sub: 'Assigned Trainers',
      icon: User,
      count: settings.assignedPersons?.length || 0,
      description: 'Assigned trainers conducting customer training sessions'
    },
    {
      id: 'packages' as const,
      label: 'Package',
      sub: 'Software Packages',
      icon: Package,
      count: settings.packages?.length || 0,
      description: 'Tipsoi HRM product plans, add-ons, or custom module tiers'
    },
    {
      id: 'pms' as const,
      label: 'KAM/PM',
      sub: 'Project Managers & KAM',
      icon: UserCheck,
      count: settings.pms?.length || 0,
      description: 'Key Account Managers and Project Managers in charge of client'
    },
    {
      id: 'statuses' as const,
      label: 'Status',
      sub: 'Training Statuses',
      icon: Tag,
      count: settings.statuses?.length || 0,
      description: 'Workflow status progression (e.g. To-Do, Ongoing, Done, Hold, Cancel)'
    }
  ];

  const currentList = settings[activeTab] || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOption.trim();
    if (!trimmed) return;

    if (currentList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      alert(`"${trimmed}" already exists in this dropdown list.`);
      return;
    }

    const updated = {
      ...settings,
      [activeTab]: [...currentList, trimmed]
    };

    setIsSaving(true);
    try {
      await onUpdateSettings(updated);
      setNewOption('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to add option:', err);
      alert('Failed to save option. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (itemToRemove: string) => {
    if (currentList.length <= 1) {
      alert('At least one option must remain in the dropdown.');
      return;
    }

    const updated = {
      ...settings,
      [activeTab]: currentList.filter(item => item !== itemToRemove)
    };

    setIsSaving(true);
    try {
      await onUpdateSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to remove option:', err);
      alert('Failed to remove option. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all dropdown options to the original system defaults?')) {
      setIsSaving(true);
      try {
        await onResetSettings();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      } catch (err) {
        console.error('Failed to reset:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const activeCategoryMeta = categories.find(c => c.id === activeTab)!;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dropdown Configuration &amp; Settings</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize dropdown options for "Add New Customer &amp; Training Schedule" and system-wide filters
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Saved Successfully
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset all dropdown options to original defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          Any item you add or remove here will immediately be reflected in the <strong>Add New Customer &amp; Training Schedule</strong> dropdowns (<span className="text-emerald-300 font-semibold">Assigned person, Package, PM, Status</span>) as well as the quick edit modals and filter menus.
        </p>
      </div>

      {/* Category Tabs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-850 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/90 border-slate-850 hover:border-slate-700 hover:bg-slate-850/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {cat.count}
                </span>
              </div>
              <h3 className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                {cat.label}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {cat.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Card for Active Category */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Title & Add Form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Manage "{activeCategoryMeta.label}" Options</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                {currentList.length} items
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeCategoryMeta.description}
            </p>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAdd} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              required
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder={`Add new ${activeCategoryMeta.label}...`}
              className="px-3.5 py-2 bg-slate-950 text-xs text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none min-w-[220px]"
            />
            <button
              type="submit"
              disabled={isSaving || !newOption.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </button>
          </form>
        </div>

        {/* Existing Options List / Tags */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Current Dropdown Choices
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentList.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate" title={item}>
                    {item}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                  title={`Remove "${item}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
