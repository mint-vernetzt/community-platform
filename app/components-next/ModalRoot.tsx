/**
 * This is in a single module to avoid that every route imports the whole Modal.tsx module
 * only because root.tsx is using the simple ModalRoot component.
 * By moving this into its own module, we can avoid this and thereby reduce the client bundle size.
 */
export function ModalRoot() {
  return <div id="modal-root" />;
}
