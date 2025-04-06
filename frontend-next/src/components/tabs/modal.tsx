import { useState, useEffect } from "react";
import { BasicTab } from "./basic";

export const ModalTab = (props: any) => {
  const closeModal = () => {
    props.setModalMessage("");
  }

  const [modalLines, setModalLines] = useState<string[]>([]);
  useEffect(() => {
    if (props.modalMessage) {
      const lines = props.modalMessage.split("\n");
      setModalLines(lines);
    }
  }, [props.modalMessage]);

  return (
    <BasicTab title="" {...props} style={{ marginBottom: "0.5rem" }} onClose={closeModal}>
      <div className="flex flex-col w-full mt-[2rem]"> 
        <div className="flex flex-col w-full">
          {modalLines.map((line, index) => (
            <div
              key={index}
              className="text-lg text-black p-1"
              style={{
                fontWeight: (index === 0 ? "bold" : "normal"),
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div className="flex flex-row justify-center mt-2">
          <button
            className="px-8 py-2 text-lg font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600"
            onClick={closeModal}
          >
            Ok
          </button>
        </div>
      </div>
    </BasicTab>
  );
}
