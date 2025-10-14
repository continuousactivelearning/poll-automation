import { useEffect } from "react";

export function useCopyProtection(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      const preventCopy = (e: ClipboardEvent) => e.preventDefault();
      const preventContextMenu = (e: MouseEvent) => e.preventDefault();
      const preventSelect = (e: Event) => e.preventDefault();

      document.addEventListener('copy', preventCopy);
      document.addEventListener('cut', preventCopy);
      document.addEventListener('contextmenu', preventContextMenu);
      document.addEventListener('selectstart', preventSelect);
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('cut', preventCopy);
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('selectstart', preventSelect);
        document.body.style.userSelect = '';
      };
    } else {
      document.body.style.userSelect = '';
    }
  }, [enabled]);
}