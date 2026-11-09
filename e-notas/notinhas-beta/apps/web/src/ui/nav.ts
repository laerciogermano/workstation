import { useCallback } from 'react';
import { useNavigate, type NavigateOptions, type To } from 'react-router';

/** Navegação com View Transition; voltar inverte a direção do deslize (html.back). */
export function useGo() {
  const navigate = useNavigate();
  return useCallback(
    (to: To | -1, opts: NavigateOptions = {}) => {
      const back = to === -1;
      document.documentElement.classList.toggle('back', back);
      if (back) {
        if (window.history.state?.idx > 0) {
          if (document.startViewTransition) document.startViewTransition(() => navigate(-1));
          else navigate(-1);
        } else navigate('/', { viewTransition: true });
        return;
      }
      navigate(to, { viewTransition: true, ...opts });
    },
    [navigate],
  );
}
