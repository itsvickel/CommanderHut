import axios from 'axios';

export interface MasterPromptData {
  role_description: string;
  domain_restrictions: string;
  additional_rules: string;
}

export const getMasterPrompt = async (): Promise<MasterPromptData> => {
  const res = await axios.get('/api/admin/masterprompt', { withCredentials: true });
  return res.data;
};

export const updateMasterPrompt = async (data: MasterPromptData): Promise<MasterPromptData> => {
  const res = await axios.put('/api/admin/masterprompt', data, { withCredentials: true });
  return res.data;
};
