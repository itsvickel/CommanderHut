interface Props {
  name?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({ name, onClick, disabled, type = 'button' }: Props) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-base font-medium cursor-pointer transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {name}
  </button>
);

export default Button;
