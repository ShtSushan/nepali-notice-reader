"use client";

interface Notice {
  id:         string;
  summary:    { topic: string };
  created_at: string;
}

interface Props {
  notices:         Notice[];
  activeNoticeId:  string | null;
  onSwitch:        (noticeId: string) => void;
}

export default function NoticeSidebar({ notices, activeNoticeId, onSwitch }: Props) {
  if (notices.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        No notices uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Uploaded Notices
      </p>
      {notices.map((notice) => (
        <div
          key={notice.id}
          onClick={() => onSwitch(notice.id)}
          className={`
            p-3 rounded-xl cursor-pointer transition-all duration-150 border
            ${activeNoticeId === notice.id
              ? "bg-blue-50 border-blue-300"
              : "bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50"
            }
          `}
        >
          <p className={`text-sm font-medium line-clamp-2 ${activeNoticeId === notice.id ? "text-blue-700" : "text-gray-700"}`}>
            📄 {notice.summary?.topic || "Untitled Notice"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notice.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}