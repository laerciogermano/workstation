/** O UUID do visitante (person_key) fica neste navegador; é a identidade dele até vincular uma conta. */
const K = "flow-person-key";
export const getPersonKey = (): string | undefined => { try { return localStorage.getItem(K) || undefined; } catch { return undefined; } };
export const savePersonKey = (k: string): void => { try { localStorage.setItem(K, k); } catch { /* ignore */ } };
export const clearPersonKey = (): void => { try { localStorage.removeItem(K); } catch { /* ignore */ } };
