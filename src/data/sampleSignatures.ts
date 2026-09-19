// Signatures utility
export const PRESET_SIGNATURES: Record<string, string> = {};

export function getSignatureForPerson(name: string, customSig?: string): string | null {
  if (customSig && typeof customSig === 'string' && customSig.trim()) {
    return customSig.trim();
  }
  return null;
}
