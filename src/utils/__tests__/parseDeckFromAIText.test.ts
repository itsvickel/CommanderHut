import { parseDeckFromAIText } from '../parseDeckFromAIText';

describe('parseDeckFromAIText', () => {
  it('returns null when text has no bold tokens', () => {
    expect(parseDeckFromAIText('No cards here at all')).toBeNull();
  });

  it('returns null when text has exactly one bold token', () => {
    expect(parseDeckFromAIText('Just **One Card** in here')).toBeNull();
  });

  it('sets the first bold token as commander', () => {
    const text = '**Rhys the Redeemed** leads **Avenger of Zendikar** and **Path to Exile**';
    const result = parseDeckFromAIText(text);
    expect(result).not.toBeNull();
    expect(result!.commander).toBe('Rhys the Redeemed');
  });

  it('puts remaining bold tokens in cards array', () => {
    const text = '**Rhys the Redeemed** leads **Avenger of Zendikar** and **Path to Exile**';
    const result = parseDeckFromAIText(text);
    expect(result!.cards).toEqual(['Avenger of Zendikar', 'Path to Exile']);
  });

  it('handles bold tokens containing spaces and punctuation', () => {
    const text = '**Atraxa, Praetors Voice** and **Sol Ring** here';
    const result = parseDeckFromAIText(text);
    expect(result!.commander).toBe('Atraxa, Praetors Voice');
    expect(result!.cards).toEqual(['Sol Ring']);
  });

  it('stores the original full text in rawText', () => {
    const text = '**Commander A** and **Card B** — extra prose here';
    const result = parseDeckFromAIText(text);
    expect(result!.rawText).toBe(text);
  });
});
