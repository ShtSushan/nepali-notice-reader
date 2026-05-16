"use client";

import { useState, useRef, useEffect } from "react";

interface Notice {
  id:         string;
  summary:    { topic: string };
  created_at: string;
}

interface Props {
  notices:        Notice[];
  activeNoticeId: string | null;
  onSwitch:       (noticeId: string) => void;
  onDelete:       (noticeId: string) => void;
}

export default function NoticeSidebar({
  notices,
  activeNoticeId,
  onSwitch,
  onDelete
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (notices.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        No notices uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-1" ref={menuRef}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Uploaded Notices
      </p>

      {notices.map((notice) => (
        <div
          key={notice.id}
          className={`
            group relative flex items-center gap-2 p-3 rounded-xl cursor-pointer
            transition-all duration-150 border
            ${activeNoticeId === notice.id
              ? "bg-blue-50 border-blue-300"
              : "bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50"
            }
          `}
        >
          {/* Notice title — clicking switches notice */}
          <div
            className="flex-1 min-w-0"
            onClick={() => onSwitch(notice.id)}
          >
            <p className={`
              text-sm font-medium line-clamp-2
              ${activeNoticeId === notice.id ? "text-blue-700" : "text-gray-700"}
            `}>
              📄 {notice.summary?.topic || "Untitled Notice"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(notice.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* 3-dot button — visible on hover or when menu open */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === notice.id ? null : notice.id);
              }}
              className={`
                p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200
                transition-opacity duration-150
                ${openMenuId === notice.id
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
                }
              `}
            >
              {/* 3 dots icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {openMenuId === notice.id && (
              <div className="absolute right-0 top-7 z-50 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    onDelete(notice.id);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}