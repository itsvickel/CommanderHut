import React, { useState } from 'react';
import styled from 'styled-components';
import { Card } from '../interfaces/card';
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

  const assignCardToGroup = (card: Card, groupName: string) => {
    setCustomGroups(prev => ({
      ...prev,
      [groupName]: [...(prev[groupName] || []), card],
    }));
  };

  const removeCardFromGroup = (card: Card, groupName: string) => {
    setCustomGroups(prev => ({
      ...prev,
      [groupName]: prev[groupName]?.filter(c => c.name !== card.name),
    }));
  };

  return (
    <Wrapper>
      <GroupControl>
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Add custom group (e.g. Finisher)"
        />
        <button onClick={addCustomGroup}>Add Group</button>
      </GroupControl>

      {Object.entries(customGroups).map(([groupName, cards]) => (
        <Group key={groupName}>
          <h2>{groupName}</h2>
          <CardGrid>
            {cards.map((card) => (
              <CardItem obj={card} key={card.name + groupName} />
            ))}
          </CardGrid>
        </Group>
      ))}
    </Wrapper>
  );
};

export default CardGroupByCustom;

const Wrapper = styled.div`
  margin-top: 2rem;
`;

const GroupControl = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;

  input {
    padding: 0.5rem;
    font-size: 1rem;
    flex: 1;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #0077cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #005fa3;
    }
  }
`;

const Group = styled.div`
  margin-bottom: 2rem;
`;

const CardGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;
