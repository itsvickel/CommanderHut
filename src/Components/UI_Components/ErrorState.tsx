interface Props {
  message: string;
  retry?: () => void;
}

const ErrorState = ({ message, retry }: Props) => (
  <div role="alert" className="flex flex-col items-center justify-center gap-3 p-8 text-center">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 m-0">
      Something went wrong
    </h2>
    <p className="text-gray-500 dark:text-gray-400 m-0">{message}</p>
    {retry && (
      <button
        onClick={retry}
        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md text-sm cursor-pointer transition-colors border-none"
      >
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;
