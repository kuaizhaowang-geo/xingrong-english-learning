import React, { useState } from 'react';
import EnglishSubjectView from './EnglishSubjectView';
import AIQuestionPanel from './AIQuestionPanel';

const TextbookPage: React.FC = () => {
  // AI 出题弹窗
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [aiPanelConfig, setAiPanelConfig] = useState<{
    unitId: string;
    unitTitle: string;
    knowledgePoint?: string;
  }>({ unitId: '', unitTitle: '' });

  const handleOpenAIQuiz = (unit: {
    id: string;
    title: string;
    topic?: string;
  }): void => {
    setAiPanelConfig({
      unitId: unit.id,
      unitTitle: unit.title,
      knowledgePoint: unit.topic,
    });
    setAiPanelOpen(true);
  };

  return (
     <div className="max-w-6xl mx-auto min-h-screen px-0">
      <EnglishSubjectView onAIQuiz={handleOpenAIQuiz} />

      {/* AI 出题弹窗 */}
      {aiPanelOpen && (
        <AIQuestionPanel
          subject="english"
          grade="grade3"
          semester="upper"
          unitId={aiPanelConfig.unitId}
          unitTitle={aiPanelConfig.unitTitle}
          knowledgePoint={aiPanelConfig.knowledgePoint}
          onClose={() => setAiPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default TextbookPage;
