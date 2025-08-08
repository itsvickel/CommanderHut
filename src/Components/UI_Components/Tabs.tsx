import styled from 'styled-components';
import { useState } from 'react';

interface TabProps {
  obj : { 
    key: number,
    title?: string;
    component: React.ReactElement
  }[];
}

const Tabs = ({ obj }: TabProps) => {
  const [tabCurrent, setCurrentTab] =  useState<number>(0);

  return (
    <Container>
      <TabContainer>
        {obj.map((item)=> (
          <TabName key={item.key} onClick={()=>setCurrentTab(item.key)}>{item.title}</TabName>
        ))}
      </TabContainer>

      {obj.map((item)=> (
        item.key === tabCurrent ? <div key={item.key}>{item.component}</div> : null
      ))}
    </Container>
  );
};

export default Tabs;

const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

 const TabContainer = styled.div`
  display: flex;
  flex-direction: row;
 `;

 const TabName = styled.div`
  margin: 2% 4%;
  width: 100%;
 `;