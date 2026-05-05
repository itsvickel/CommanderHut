import React, { useState } from 'react';

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
    <div className="flex flex-col">
      <div className="flex flex-row">
        {obj.map((item) => {
          return (
            <div
              key={item.key}
              onClick={() => setCurrentTab(item.key)}
              className="mx-[4%] my-[2%] w-full"
            >
              {item.title}
            </div>
          );
        })}
      </div>

      {obj.map((item) => {
        if (item.key === tabCurrent) {
          return item.component;
        }
      })}
    </div>
  );
};

export default Tabs;
