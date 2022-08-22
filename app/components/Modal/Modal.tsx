import { Children } from "react";
import { H2 } from "../Heading/Heading";

export interface ModalProps {
  id: string;
  children: React.ReactNode;
}

function Modal(props: ModalProps) {
  const { id, children } = props;
  return (
    <>
      <input type="checkbox" id={id} className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <H2 className="text-center">Profilfoto</H2>
          {children}

          <div className="modal-action">
            <label htmlFor={id} className="btn btn-outline btn-primary">
              Abbrechen
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;
