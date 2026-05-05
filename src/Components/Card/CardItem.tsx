import React, { useState } from 'react';
import CardModal from './CardModal';
import type { Card } from "../../Interface/index";

interface CardProps {
  key?: string | number;
  obj: Card;
}

const CardItem: React.FC<CardProps> = ({ obj, key }) => {
  const [isModal, setIsModal] = useState<boolean>(false);

  return (
    <div key={key} className="p-4 bg-white border-2 border-[#e0dacf] rounded-xl max-w-[340px] mx-auto shadow-[0_6px_18px_rgba(0,0,0,0.1)]">
      {obj ? (
        <>
          <div
            onClick={() => !isModal && setIsModal(true)}
            className={`${isModal ? 'cursor-default' : 'cursor-pointer hover:scale-[1.25]'} transition-transform duration-200`}
          >
            <img
              src={obj?.image_uris?.large || obj?.image_uris?.normal}
              alt={obj.name}
              className="w-[70%] h-auto rounded-[10px]"
            />
          </div>
        </>
      ) : (
        <p>No card data available</p>
      )}

      {isModal && (
        <CardModal isOpen={isModal} onClose={() => setIsModal(false)}>
          <div className="flex flex-col items-center p-6 w-[60vw] h-[80vh] md:flex-row md:gap-8">
            <img
              src={obj?.image_uris?.png || obj?.image_uris?.normal}
              alt={obj.name}
              className="w-[25vw] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
            />
            <div className="max-w-[500px] text-left text-base bg-white p-4 rounded-xl border border-[#e6e6e6] shadow-[0_4px_8px_rgba(0,0,0,0.08)]">
              <h3>{obj.name}</h3>
              <div className="mb-2 leading-relaxed text-[0.95rem]"><strong>Mana Cost:</strong> {obj.mana_cost}</div>
              <div className="mb-2 leading-relaxed text-[0.95rem]"><strong>Type:</strong> {obj.type_line}</div>
              <div className="mb-2 leading-relaxed text-[0.95rem]"><strong>Text:</strong> {obj.oracle_text}</div>
              <div className="mb-2 leading-relaxed text-[0.95rem]"><strong>Set:</strong> {obj.set_name}</div>
              <div className="mb-2 leading-relaxed text-[0.95rem]"><strong>Artist:</strong> {obj.artist}</div>
              <div className="mb-2 leading-relaxed text-[0.95rem]"><strong>Released:</strong> {obj.released_at}</div>
              <div className="mb-2 leading-relaxed text-[0.95rem]"><strong>Layout:</strong> {obj.layout}</div>
              <table className="flex flex-wrap">
                {Object.entries(obj.legalities ?? {}).map(([format, status]) => (
                  <div key={format} className="w-1/2">
                    <td>{format.toUpperCase()}</td>
                    <td>{status === 'legal' ? '✅' : '❌'}</td>
                  </div>
                ))}
              </table>
            </div>
          </div>
        </CardModal>
      )}
    </div>
  );
};

export default CardItem;
