import React, { useState, useEffect } from 'react';
import { Settings, Shield, Clock, ToggleLeft, ToggleRight, Save, RotateCcw, Megaphone, CheckCircle2, AlertTriangle, Info, Lock, BrainCircuit, PlayCircle } from 'lucide-react';

const SystemConfig = ({ user }) => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(null); // Key being saved

    const configDefinitions = [
        { key: 'REGISTRATION_ENABLED', label: 'Student Registration', desc: 'Allows new accounts to be created via the registration portal.', category: 'Operational' },
        { key: 'TEACHER_CREATE_QUESTIONS', label: 'Teacher Content Creation', desc: 'Allows educators to contribute to the global question bank.', category: 'Operational' },
        { key: 'MAINTENANCE_MODE', label: 'Maintenance Mode', desc: 'Locks all student and teacher access for scheduled maintenance.', category: 'Operational' },
        { key: 'AI_PROCTORING_ENABLED', label: 'AI Integrity Proctoring', desc: 'Enforces webcam and screen monitoring during examination sessions.', category: 'Security' },
        { key: 'REMEDIAL_MODE_ENFORCED', label: 'Remedial Enforcement', desc: 'Blocks academic progression if cognitive decline is detected.', category: 'Academic' },
        { key: 'SECURE_BROWSER_MODE', label: 'Secure Browser Policy', desc: 'Alerts proctors if tab-switching or multi-screen usage is detected.', category: 'Security' },
        { key: 'SYSTEM_NOTICE_ENABLED', label: 'Enable System Announcement', desc: 'Activates the global banner notice for all logged-in users.', category: 'Notification' }
    ];

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8081/api/admin/config', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = async (key, value, desc = '') => {
        setSaving(key);
        const originalConfigs = [...configs];
        const exists = configs.find(c => c.configKey === key);
        const newConfigs = exists
            ? configs.map(c => c.configKey === key ? { ...c, configValue: value.toString() } : c)
            : [...configs, { configKey: key, configValue: value.toString(), description: desc }];

        setConfigs(newConfigs);

        try {
            await fetch(`http://localhost:8081/api/admin/config/${key}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ value: value.toString(), description: desc || exists?.description })
            });
        } catch (err) {
            console.error("Update failed", err);
            setConfigs(originalConfigs);
            alert("Failed to update system parameter.");
        } finally {
            setSaving(null);
        }
    };

    const getConfigValue = (key, defaultVal = '') => configs.find(c => c.configKey === key)?.configValue || defaultVal;

    const renderToggle = (key) => {
        const isOn = getConfigValue(key) === 'true';
        return (
            <button
                onClick={() => updateConfig(key, !isOn)}
                disabled={saving === key}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOn ? 'bg-primary-600' : 'bg-surface-300'} ${saving === key ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        );
    };

    if (loading && configs.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full p-20 text-surface-400">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold uppercase tracking-widest text-xs">Accessing System Registry...</p>
        </div>
    );

    return (
        <div className="bg-surface-50 min-h-full font-sans pb-10">
            {/* Header */}
            <header className="bg-white border-b border-surface-200 px-8 py-6 sticky top-0 z-20 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-surface-900 flex items-center gap-3">
                        <Settings className="text-primary-600 w-8 h-8" strokeWidth={2.5} />
                        SYSTEM INFRASTRUCTURE CONTROL
                    </h1>
                    <p className="text-sm text-surface-500 font-bold uppercase tracking-wider mt-1 ml-11">Governance & Operational Parameters</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchConfigs} className="flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-bold uppercase transition-all">
                        <RotateCcw size={16} /> Sync Registry
                    </button>
                    <div className="h-8 w-[1px] bg-surface-200 mx-2"></div>
                    <div className="text-right">
                        <p className="text-[10px] text-surface-400 font-black uppercase">Service Status</p>
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 size={12} /> OPERATIONAL
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Broadcast Section */}
                <section className="bg-white border border-surface-200 shadow-sm overflow-hidden border-t-4 border-t-primary-600">
                    <div className="p-6 border-b border-surface-100 flex items-center justify-between bg-primary-50/30">
                        <div className="flex items-center gap-3">
                            <Megaphone className="text-primary-600" size={24} />
                            <div>
                                <h2 className="text-lg font-black text-surface-900 uppercase">Global System Notification</h2>
                                <p className="text-xs text-surface-500 font-medium">Broadcast alerts to every student and teacher terminal.</p>
                            </div>
                        </div>
                        {renderToggle('SYSTEM_NOTICE_ENABLED')}
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Notice Title</label>
                            <input
                                type="text"
                                value={getConfigValue('SYSTEM_NOTICE_TITLE', 'PARAKH System Update')}
                                onChange={(e) => updateConfig('SYSTEM_NOTICE_TITLE', e.target.value)}
                                className="w-full p-3 bg-surface-50 border border-surface-200 focus:border-primary-600 outline-none text-sm font-bold placeholder:text-surface-300"
                                placeholder="Enter bold heading..."
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Broadcast Message Content</label>
                            <input
                                type="text"
                                value={getConfigValue('SYSTEM_NOTICE_MESSAGE', 'Service will be optimized for performance tonight at 23:00 IST.')}
                                onChange={(e) => updateConfig('SYSTEM_NOTICE_MESSAGE', e.target.value)}
                                className="w-full p-3 bg-surface-50 border border-surface-200 focus:border-primary-600 outline-none text-sm font-medium placeholder:text-surface-300"
                                placeholder="Write the secondary message text..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Alert Priority</label>
                            <select
                                value={getConfigValue('SYSTEM_NOTICE_PRIORITY', 'LOW')}
                                onChange={(e) => updateConfig('SYSTEM_NOTICE_PRIORITY', e.target.value)}
                                className="w-full p-3 bg-surface-50 border border-surface-200 focus:border-primary-600 outline-none text-sm font-bold bg-white"
                            >
                                <option value="LOW">ℹ️ INFORMATIONAL (LOW)</option>
                                <option value="MEDIUM">⚠️ WARNING (MEDIUM)</option>
                                <option value="HIGH">🚨 URGENT (HIGH)</option>
                                <option value="CRITICAL">⚡ CRITICAL (SYSTEM DOWN)</option>
                            </select>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Operational Toggles */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-surface-400 uppercase tracking-widest flex items-center gap-2">
                            <PlayCircle size={16} /> Operational Controls
                        </h3>
                        {configDefinitions.filter(d => d.category === 'Operational').map(def => (
                            <div key={def.key} className="bg-white border border-surface-200 p-5 flex items-start justify-between shadow-sm group hover:border-primary-200 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-surface-900 uppercase leading-none">{def.label}</h4>
                                    <p className="text-xs text-surface-500 leading-relaxed max-w-xs">{def.desc}</p>
                                    <code className="text-[10px] text-surface-300 font-mono mt-2 block">{def.key}</code>
                                </div>
                                {renderToggle(def.key)}
                            </div>
                        ))}
                    </div>

                    {/* Integrated Controls (Security & Academic) */}
                    <div className="space-y-8">
                        {/* Governance */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-surface-400 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={16} /> Integrity & Governance
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {configDefinitions.filter(d => ['Security', 'Academic'].includes(d.category)).map(def => (
                                    <div key={def.key} className="bg-white border border-surface-200 p-5 flex items-start justify-between shadow-sm hover:border-primary-200 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {def.category === 'Security' ? <Lock size={12} className="text-blue-500" /> : <BrainCircuit size={12} className="text-purple-500" />}
                                                <h4 className="text-sm font-black text-surface-900 uppercase leading-none">{def.label}</h4>
                                            </div>
                                            <p className="text-xs text-surface-500 leading-relaxed">{def.desc}</p>
                                        </div>
                                        {renderToggle(def.key)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quantitative Parameters */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-surface-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} /> Temporal Parameters
                            </h3>
                            <div className="bg-white border border-surface-200 shadow-sm divide-y divide-surface-100">
                                <div className="p-4 flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-black text-surface-900 uppercase leading-none">Global Session Timeout</h4>
                                        <p className="text-[10px] text-surface-400 font-bold uppercase mt-1">Idle time before auto-logout</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={getConfigValue('AUTO_LOGOUT_MINUTES', '30')}
                                            onChange={(e) => updateConfig('AUTO_LOGOUT_MINUTES', e.target.value)}
                                            className="w-20 p-2 bg-surface-50 border border-surface-200 text-sm font-bold text-center focus:border-primary-600 outline-none"
                                        />
                                        <span className="text-[10px] font-black text-surface-400 uppercase">Min</span>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-black text-surface-900 uppercase leading-none">Default Exam Buffer</h4>
                                        <p className="text-[10px] text-surface-400 font-bold uppercase mt-1">Global maximum duration</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={getConfigValue('MAX_EXAM_DURATION', '60')}
                                            onChange={(e) => updateConfig('MAX_EXAM_DURATION', e.target.value)}
                                            className="w-20 p-2 bg-surface-50 border border-surface-200 text-sm font-bold text-center focus:border-primary-600 outline-none"
                                        />
                                        <span className="text-[10px] font-black text-surface-400 uppercase">Min</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Footer */}
            <div className="max-w-7xl mx-auto px-8 mt-10">
                <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-4">
                    <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-xs font-black text-amber-900 uppercase">Attention: Global Registry Changes</p>
                        <p className="text-xs text-amber-700 font-medium mt-1">
                            Modifying these parameters affects all users instantly. Ensure you have proper authorization before disabling security or academic enforcement modules. All changes are logged in the <span className="underline cursor-pointer">Security Audit Vault</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemConfig;
