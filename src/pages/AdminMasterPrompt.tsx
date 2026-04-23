import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
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
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await updateMasterPrompt({
        role_description: roleDescription,
        domain_restrictions: domainRestrictions,
        additional_rules: additionalRules,
      });
      setSaveStatus('success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) return <PageWrapper><LoadingMsg>Loading...</LoadingMsg></PageWrapper>;
  if (fetchError) return <PageWrapper><ErrorMsg>{fetchError}</ErrorMsg></PageWrapper>;

  return (
    <PageWrapper>
      <PageTitle>Master Prompt Editor</PageTitle>
      <PageSubtitle>Changes take effect within 60 seconds (cache TTL).</PageSubtitle>

      <Form>
        <Section>
          <Label>Role Description</Label>
          <Textarea
            rows={4}
            value={roleDescription}
            onChange={e => setRoleDescription(e.target.value)}
          />
        </Section>

        <Section>
          <Label>Domain Restrictions</Label>
          <Textarea
            rows={4}
            value={domainRestrictions}
            onChange={e => setDomainRestrictions(e.target.value)}
          />
        </Section>

        <Section>
          <Label>Additional Rules</Label>
          <Textarea
            rows={6}
            value={additionalRules}
            onChange={e => setAdditionalRules(e.target.value)}
          />
        </Section>

        <Section>
          <Label>
            Output Format{' '}
            <ReadOnlyBadge>(hardcoded — edit in source)</ReadOnlyBadge>
          </Label>
          <ReadOnlyTextarea rows={5} value={OUTPUT_FORMAT} readOnly />
        </Section>

        <Footer>
          {saveStatus === 'error' && <ErrorMsg>Save failed — try again</ErrorMsg>}
          {saveStatus === 'success' && <SuccessMsg>Saved!</SuccessMsg>}
          <SaveButton onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
          </SaveButton>
        </Footer>
      </Form>
    </PageWrapper>
  );
};

export default AdminMasterPrompt;

const PageWrapper = styled.div`
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  text-align: left;
`;

const PageTitle = styled.h2`
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #111827;
`;

const PageSubtitle = styled.p`
  margin: 0 0 2rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.05em;
`;

const ReadOnlyBadge = styled.span`
  font-weight: 400;
  text-transform: none;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const Textarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  font-size: 0.875rem;
  font-family: monospace;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  color: #374151;
  background: #fff;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
`;

const ReadOnlyTextarea = styled(Textarea)`
  background: #f3f4f6;
  color: #9ca3af;
  cursor: default;
  border-color: #e5e7eb;
  &:focus {
    border-color: #e5e7eb;
    box-shadow: none;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
`;

const SaveButton = styled.button`
  padding: 0.6rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }
`;

const LoadingMsg = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
`;

const ErrorMsg = styled.p`
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0;
`;

const SuccessMsg = styled.p`
  color: #16a34a;
  font-size: 0.875rem;
  margin: 0;
`;
