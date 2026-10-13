import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Label } from '@client/src/components/ui/label';
import { SAMPLE_JSON } from '../utils/batchImport';

interface FileUploadZoneProps {
  fileName: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  fileName,
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label className="text-sm">上传 JSON 文件</Label>
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#6366F1] hover:bg-[#EEF2FF]/30 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={onFileSelect}
          className="hidden"
        />
        <Upload size={32} className="mx-auto text-[#6366F1] mb-2" />
        {fileName ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#1A1A2E]">{fileName}</p>
            <p className="text-xs text-[#6B7280]">点击重新选择文件</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#1A1A2E]">点击上传 JSON 文件</p>
            <p className="text-xs text-[#6B7280]">支持 .json 格式，数组结构</p>
          </div>
        )}
      </div>

      <div className="bg-[#F8FAFC] rounded-lg p-3 border border-gray-100">
        <p className="text-xs font-medium text-[#475569] mb-2">JSON 格式示例：</p>
        <pre className="text-[10px] text-[#6B7280] font-mono overflow-x-auto whitespace-pre-wrap">
          {SAMPLE_JSON}
        </pre>
        <p className="text-xs text-[#6B7280] mt-2">
          必填字段：sentence（英文原句）、translation（中文翻译）。可选字段：
          difficulty（难度 1-5）、wordParses（核心词数组）、grammarComponents（语法成分）、
          tags（标签数组）、puzzleOrder（排序号）、sentenceType（句型）。
        </p>
      </div>
    </div>
  );
};

export default FileUploadZone;
