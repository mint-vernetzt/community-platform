export interface ModalProps {
  id: string;
  children: React.ReactNode;
}

function Modal(props: ModalProps) {
  const { id, children } = props;
  return (
    <>
      <label htmlFor={id} className="btn btn-primary modal-button">
        Bild ändern
      </label>
      <input type="checkbox" id={id} className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">{children}</div>
      </div>
    </>
  );
}

export default Modal;
