/**
 * Invoker Commands の show-modal が効かない環境向けに、短い遅延後に dialog を開く。
 */
export function scheduleShowModalFallback(commandfor: string): void {
  window.setTimeout(() => {
    const el = document.getElementById(commandfor) as HTMLDialogElement | null;
    if (el !== null && !el.open) {
      el.showModal();
    }
  }, 50);
}
