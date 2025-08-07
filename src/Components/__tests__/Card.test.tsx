import { render } from "@testing-library/react";
import CardItem from "../Card/CardItem";

test("renders CardItem without crashing", () => {
  const card = {
    name: "Test Card",
    image_uris: { normal: "https://example.com/test.jpg" },
    oracle_text: "Some text",
  } as any;

  const { getByAltText } = render(<CardItem obj={card} />);
  expect(getByAltText("Test Card")).toBeInTheDocument();
});
