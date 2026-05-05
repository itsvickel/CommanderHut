const DeckPanelEmpty = () => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-8 bg-white dark:bg-gray-900">
    <div className="text-4xl">🃏</div>
    <p className="font-semibold text-gray-700 dark:text-gray-200 text-base m-0">Your deck will appear here</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
      Try: "Build me a Selesnya tokens Commander deck with Rhys the Redeemed"
    </p>
  </div>
);

export default DeckPanelEmpty;
