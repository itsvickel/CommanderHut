interface Stage {
  id: string;
  label: string;
}

interface Props {
  stages: Stage[];
  activeStage: string | null;
  activeMessage?: string;
  completedStages: string[];
  error: { stage: string; message: string } | null;
}

const GenerationProgress = ({ stages, activeStage, activeMessage, completedStages, error }: Props) => {
  return (
    <div className="flex flex-col gap-3 p-4">
      {stages.map(stage => {
        const isCompleted = completedStages.includes(stage.id);
        const isActive = stage.id === activeStage;
        const isFailed = error?.stage === stage.id;

        return (
          <div key={stage.id} className="flex items-start gap-3">
            <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
              {isFailed && <span className="text-red-500 text-base leading-none">✕</span>}
              {!isFailed && isCompleted && <span className="text-green-500 text-base leading-none">✓</span>}
              {!isFailed && !isCompleted && isActive && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              {!isFailed && !isCompleted && !isActive && (
                <div className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-tight ${
                isFailed ? 'text-red-600 dark:text-red-400' :
                isCompleted ? 'text-green-600 dark:text-green-400' :
                isActive ? 'text-blue-600 dark:text-blue-400 font-medium' :
                'text-gray-400 dark:text-gray-500'
              }`}>
                {stage.label}
              </p>
              {isActive && activeMessage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activeMessage}</p>
              )}
              {isFailed && (
                <p className="text-xs text-red-500 mt-0.5">{error!.message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GenerationProgress;
