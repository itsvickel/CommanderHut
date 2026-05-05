interface Props {
  name: string;
}

const Label = ({ name }: Props) => {
  return (
    <div className="text-[2em]">{name}</div>
  );
};

export default Label;
