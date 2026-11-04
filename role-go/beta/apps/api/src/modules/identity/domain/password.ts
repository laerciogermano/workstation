/** Senhas mais comuns (amostra da lista top-10k; docs/10 §3). */
const COMMON = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwerty123', 'qwertyuiop', '11111111', '00000000',
  '12341234', '87654321', 'senha123', 'senha1234', 'brasil123', 'iloveyou', 'abc12345', 'abcd1234', 'admin123',
  'mudar123', 'flamengo', 'corinthians', 'palmeiras', 'aaaaaaaa', '123123123', 'q1w2e3r4', '1q2w3e4r', 'princesa',
  'rolego123', 'teste123', 'welcome1',
]);

export function isWeakPassword(pw: string): boolean {
  return COMMON.has(pw.toLowerCase()) || /^(.)\1+$/.test(pw);
}
