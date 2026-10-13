import React from 'react';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import type { TextbookTreeItem, TextbookUnit } from '@shared/api.interface';

const GRADE_LABELS: Record<string, string> = {
  grade1: '一年级', grade2: '二年级', grade3: '三年级',
  grade4: '四年级', grade5: '五年级', grade6: '六年级',
  grade7: '七年级', grade8: '八年级', grade9: '九年级',
  grade10: '高一', grade11: '高二', grade12: '高三',
};

const SEMESTER_LABELS: Record<string, string> = {
  upper: '上册', lower: '下册',
};

type TreeNodeLevel =
  | 'stage'
  | 'publisher'
  | 'grade'
  | 'semester'
  | 'textbook'
  | 'unit';

interface TreeNode {
  id: string;
  level: TreeNodeLevel;
  label: string;
  children?: TreeNode[];
  textbook?: TextbookTreeItem;
  unit?: TextbookUnit;
}

interface TextbookTreeProps {
  items: TextbookTreeItem[];
  selectedTextbookId: string | null;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectTextbook: (tb: TextbookTreeItem) => void;
  onSelectUnit: (unit: TextbookUnit, tb: TextbookTreeItem) => void;
}

const buildTree = (items: TextbookTreeItem[]): TreeNode[] => {
  const stageMap = new Map<string, Map<string, Map<string, Map<string, TextbookTreeItem[]>>>>();

  for (const item of items) {
    const gradeNum = Number(item.grade.replace('grade', ''));
    const stage =
      gradeNum <= 6 ? '小学' : gradeNum <= 9 ? '初中' : '高中';
    if (!stageMap.has(stage)) stageMap.set(stage, new Map());
    const pubMap = stageMap.get(stage)!;
    if (!pubMap.has(item.publisher)) pubMap.set(item.publisher, new Map());
    const gradeMap = pubMap.get(item.publisher)!;
    if (!gradeMap.has(item.grade)) gradeMap.set(item.grade, new Map());
    const semMap = gradeMap.get(item.grade)!;
    if (!semMap.has(item.semester)) semMap.set(item.semester, []);
    semMap.get(item.semester)!.push(item);
  }

  const result: TreeNode[] = [];
  const sortedStages = ['小学', '初中', '高中'];
  for (const stage of sortedStages) {
    const pubMap = stageMap.get(stage);
    if (!pubMap || pubMap.size === 0) continue;
    const stageNode: TreeNode = {
      id: `stage-${stage}`,
      level: 'stage',
      label: stage,
      children: [],
    };
    for (const [pub, gradeMap] of pubMap) {
      const pubNode: TreeNode = {
        id: `pub-${stage}-${pub}`,
        level: 'publisher',
        label: pub,
        children: [],
      };
      const gradeKeys = Array.from(gradeMap.keys()).sort(
        (a, b) => Number(a.replace('grade', '')) - Number(b.replace('grade', '')),
      );
      for (const grade of gradeKeys) {
        const semMap = gradeMap.get(grade)!;
        const gradeNode: TreeNode = {
          id: `grade-${stage}-${pub}-${grade}`,
          level: 'grade',
          label: GRADE_LABELS[grade] ?? grade,
          children: [],
        };
        for (const [sem, tbList] of semMap) {
          const semNode: TreeNode = {
            id: `sem-${stage}-${pub}-${grade}-${sem}`,
            level: 'semester',
            label: SEMESTER_LABELS[sem] ?? sem,
            children: tbList
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((tb) => ({
                id: `tb-${tb.id}`,
                level: 'textbook' as TreeNodeLevel,
                label: tb.title,
                textbook: tb,
                children: (tb.units ?? [])
                  .sort((a, b) => a.unitOrder - b.unitOrder)
                  .map((u) => ({
                    id: `unit-${u.id}`,
                    level: 'unit' as TreeNodeLevel,
                    label: u.title,
                    unit: u,
                  })),
              })),
          };
          gradeNode.children!.push(semNode);
        }
        pubNode.children!.push(gradeNode);
      }
      stageNode.children!.push(pubNode);
    }
    result.push(stageNode);
  }
  return result;
};

const TextbookTree: React.FC<TextbookTreeProps> = ({
  items,
  selectedTextbookId,
  expanded,
  onToggleExpand,
  onSelectTextbook,
  onSelectUnit,
}) => {
  const treeData = buildTree(items);

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected =
      node.level === 'textbook' &&
      selectedTextbookId === node.textbook?.id;

    const handleClick = (): void => {
      if (node.level === 'textbook' && node.textbook) {
        onSelectTextbook(node.textbook);
      } else if (node.level === 'unit' && node.unit && node.textbook) {
        onSelectUnit(node.unit, node.textbook);
      }
      if (hasChildren) {
        onToggleExpand(node.id);
      }
    };

    const getIcon = (): React.ReactNode => {
      switch (node.level) {
        case 'textbook':
          return <BookOpen size={14} className="text-[#FF6B35]" />;
        case 'unit':
          return <span className="w-3.5 h-0.5 bg-gray-300 rounded" />;
        default:
          return null;
      }
    };

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#4361EE]/10 text-[#4361EE] font-medium'
              : node.level === 'textbook'
              ? 'hover:bg-gray-100 text-[#1A1A2E]'
              : node.level === 'unit'
              ? 'hover:bg-gray-100 text-gray-600'
              : 'hover:bg-gray-100 text-gray-700 font-medium'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={handleClick}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
            )
          ) : (
            <span className="w-3.5 flex-shrink-0" />
          )}
          {getIcon()}
          <span className="truncate">{node.label}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child: TreeNode) =>
              child.level === 'unit' && node.textbook
                ? renderNode({ ...child, textbook: node.textbook }, depth + 1)
                : renderNode(child, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {treeData.map((node: TreeNode) => renderNode(node, 0))}
    </div>
  );
};

export default TextbookTree;
