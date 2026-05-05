interface Props {
  name?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const Button = ({ name, onClick }: Props) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-base font-medium cursor-pointer transition-colors border-none"
  >
    {name}
  </button>
);

export default Button;
