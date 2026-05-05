interface Props {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  placeholder?: string;
  type?: string;
}

const Input = ({ onChange, value, placeholder, type }: Props) => (
  <input
    type={type ?? 'text'}
    onChange={onChange}
    value={value}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
);

export default Input;
