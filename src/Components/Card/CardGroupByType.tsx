import React, { useState } from 'react';
import type { Card } from '../../Interface/index';
import CardItem from './CardItem';

interface Props {
  onAssignCard?: (card: Card, groupName: string) => void;
}

const CardGroupByCustom: React.FC<Props> = () => {
  const [customGroups, setCustomGroups] = useState<{ [key: string]: Card[] }>({});
  const [newGroupName, setNewGroupName] = useState('');

  const addCustomGroup = () => {
    const trimmed = newGroupName.trim();
    if (trimmed && !customGroups[trimmed]) {
      setCustomGroups({ ...customGroups, [trimmed]: [] });
      setNewGroupName('');
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex gap-4">
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Add custom group (e.g. Finisher)"
          className="p-2 text-base flex-1"
        />
        <button
          onClick={addCustomGroup}
          className="px-4 py-2 bg-[#0077cc] text-white border-none rounded cursor-pointer hover:bg-[#005fa3]"
        >
          Add Group
        </button>
      </div>

      {Object.entries(customGroups).map(([groupName, cards]) => (
        <div key={groupName} className="mb-8">
          <h2>{groupName}</h2>
          <div className="flex flex-wrap gap-4">
            {cards.map((card) => (
              <CardItem obj={card} key={card.name + groupName} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardGroupByCustom;
