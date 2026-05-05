interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

const Spinner = ({ size = 'md', label = 'Loading' }: Props) => (
  <div role="status" aria-live="polite" className="flex items-center justify-center p-4">
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400`}
    />
    {label && <span className="sr-only">{label}</span>}
  </div>
);

export default Spinner;
