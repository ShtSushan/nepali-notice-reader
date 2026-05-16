"use client";

import { useState, useEffect } from "react";
import UploadZone     from "@/components/UploadZone";
import SummaryCard    from "@/components/SummaryCard";
import ChatBox        from "@/components/ChatBox";
import NoticeSidebar  from "@/components/NoticeSidebar";

// hardcoded email for now — replace with auth later
const USER_EMAIL = "test@gmail.com";

export default function Home() {
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [summary,        setSummary]        = useState<any>(null);
  const [notices,        setNotices]        = useState<any[]>([]);
  const [userId,         setUserId]         = useState<string | null>(null);

  // fetch user and their notices on load
  useEffect(() => {
    fetchUserNotices();
  }, []);

  const fetchUserNotices = async () => {
    try {
      // get or create user
      const userRes = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body:   (() => {
          // we just need the user_id — use a dummy approach
          // in production this would be a separate /user endpoint
          return new FormData();
        })()
      });

      // fetch notices for this user via email lookup
      // for now load from local state — sidebar updates on upload
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const handleUploadSuccess = (noticeId: string, noticeSummary: any) => {
    setActiveNoticeId(noticeId);
    setSummary(noticeSummary);

    // add to sidebar
    setNotices((prev) => [
      {
        id:         noticeId,
        summary:    noticeSummary,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleSwitchNotice = async (noticeId: string) => {
    setActiveNoticeId(noticeId);

    // fetch summary for switched notice
    try {
      const res  = await fetch(`http://127.0.0.1:8000/summarize/${noticeId}`);
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Failed to switch notice:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🇳🇵</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Nepali Notice Reader
            </h1>
            <p className="text-xs text-gray-400">
              Upload any government notice — get instant English summary
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">

        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <NoticeSidebar
            notices        = {notices}
            activeNoticeId = {activeNoticeId}
            onSwitch       = {handleSwitchNotice}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6">

          {/* Upload zone — always visible */}
          <UploadZone
            onUploadSuccess = {handleUploadSuccess}
            userEmail       = {USER_EMAIL}
          />

          {/* Summary + Chat — only after upload */}
          {activeNoticeId && summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SummaryCard summary={summary} />
              <ChatBox key={activeNoticeId} noticeId={activeNoticeId} />
            </div>
          )}

          {/* Empty state */}
          {!activeNoticeId && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-4">☝️</p>
              <p className="text-lg font-medium">Upload a notice to get started</p>
              <p className="text-sm mt-1">
                Supports any Nepali government notice image
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}