import React, { ReactElement, useEffect, useState } from 'react';

import styled from 'styled-components';

// Define the Props interface outside the component for better readability
interface TabProps {
  obj : { 
    key: number,
    title?: String;
    component: React.ReactElement
  }[];
}

// Update the component to accept props of type CardProps
const Tabs = ({ obj }: TabProps) => {
  const [tabCurrent, setCurrentTab] =  useState<number>(0);

  return (
    <Container>
        <TabContainer>
          {obj.map((item)=>{ 
            return <TabName onClick={()=>setCurrentTab(item.key)}>{item.title}</TabName>
          })}
        </TabContainer>

        {obj.map((item)=>{
          if(item.key === tabCurrent){
              return item.component 
          }
        })}

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