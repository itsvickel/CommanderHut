import { useState, useEffect, useRef } from 'react';
import { getMasterPrompt, updateMasterPrompt } from '../services/adminService';

const OUTPUT_FORMAT =
  'Output ONLY valid JSON — no markdown, no bold (**), no explanation, no code fences.\n' +
  'Required JSON keys:\n' +
  '  commander: string (exact real Magic: The Gathering card name)\n' +
  '  color_identity: array of letters from W U B R G only\n' +
  '  strategy: string, max 400 chars\n' +
  '  signature_cards: array of objects, each with:\n' +
  '    name: string (exact real Magic: The Gathering card name)\n' +
  '    role: one of win_con | ramp | draw | removal | interaction | synergy | utility\n' +
  'Do not invent card names.';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const labelClass = 'text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400';
const textareaClass = 'w-full box-border px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-md resize-y text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

const AdminMasterPrompt = () => {
  const [roleDescription, setRoleDescription] = useState('');
  const [domainRestrictions, setDomainRestrictions] = useState('');
  const [additionalRules, setAdditionalRules] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMasterPrompt();
        setRoleDescription(data.role_description);
        setDomainRestrictions(data.domain_restrictions);
        setAdditionalRules(data.additional_rules);
      } catch {
        setFetchError('Failed to load master prompt. You may not have admin access.');
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await updateMasterPrompt({ role_description: roleDescription, domain_restrictions: domainRestrictions, additional_rules: additionalRules });
      setSaveStatus('success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400 text-sm">Loading...</div>;
  if (fetchError) return <div className="p-8 text-red-600 dark:text-red-400 text-sm">{fetchError}</div>;

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-8 text-left">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Master Prompt Editor</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Changes take effect within 60 seconds (cache TTL).</p>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Role Description</label>
          <textarea rows={4} value={roleDescription} onChange={e => setRoleDescription(e.target.value)} className={textareaClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Domain Restrictions</label>
          <textarea rows={4} value={domainRestrictions} onChange={e => setDomainRestrictions(e.target.value)} className={textareaClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Additional Rules</label>
          <textarea rows={6} value={additionalRules} onChange={e => setAdditionalRules(e.target.value)} className={textareaClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            Output Format <span className="font-normal normal-case text-xs text-gray-400">(hardcoded — edit in source)</span>
          </label>
          <textarea rows={5} value={OUTPUT_FORMAT} readOnly className={`${textareaClass} bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-default focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600`} />
        </div>
        <div className="flex items-center justify-end gap-4">
          {saveStatus === 'error' && <p className="text-red-600 dark:text-red-400 text-sm m-0">Save failed — try again</p>}
          {saveStatus === 'success' && <p className="text-green-600 dark:text-green-400 text-sm m-0">Saved!</p>}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterPrompt;
