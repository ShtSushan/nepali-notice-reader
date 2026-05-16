"use client";

interface Summary {
  topic:           string;
  who_affected:    string;
  key_dates:       string[];
  action_required: string;
  office:          string;
}

interface Props {
  summary: Summary;
}

export default function SummaryCard({ summary }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">
        📋 Notice Summary
      </h2>

      {/* Topic */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
          What is this about?
        </p>
        <p className="text-gray-800 font-medium">{summary.topic}</p>
      </div>

      {/* Who affected */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Who is affected?
        </p>
        <p className="text-gray-700">{summary.who_affected}</p>
      </div>

      {/* Key dates */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Key Dates
        </p>
        <div className="flex flex-wrap gap-2">
          {summary.key_dates.map((date, index) => (
            <span
              key={index}
              className="bg-amber-100 text-amber-700 text-sm font-medium px-3 py-1 rounded-full"
            >
              📅 {date}
            </span>
          ))}
        </div>
      </div>

      {/* Action required */}
      <div className="bg-green-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
          What do you need to do?
        </p>
        <p className="text-gray-800">{summary.action_required}</p>
      </div>

      {/* Office */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Issued by
        </p>
        <p className="text-gray-600 text-sm">{summary.office}</p>
      </div>
    </div>
  );
}