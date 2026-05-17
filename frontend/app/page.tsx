"use client";

import { useState, useEffect } from "react";
import { useRouter }     from "next/navigation";
import { supabase }      from "@/lib/supabase";
import UploadZone        from "@/components/UploadZone";
import SummaryCard       from "@/components/SummaryCard";
import ChatBox           from "@/components/ChatBox";
import NoticeSidebar     from "@/components/NoticeSidebar";

export default function Home() {
  const router = useRouter();

  const [userEmail,      setUserEmail]      = useState<string | null>(null);
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [summary,        setSummary]        = useState<any>(null);
  const [notices,        setNotices]        = useState<any[]>([]);
  const [isRestoring,    setIsRestoring]    = useState(true);

  // ── Auth guard — check session on load ──
  useEffect(() => {
    checkSession();

    // listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.push("/login");
        } else {
          setUserEmail(session.user.email ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUserEmail(session.user.email ?? null);
    restoreSession(session.user.email!);
  };

  const restoreSession = async (email: string) => {
    setIsRestoring(true);
    try {
      // get or create user
      const userRes  = await fetch("https://sushanSht-nepali-notice-reader.hf.space/embed/user?email=" + encodeURIComponent(email));
      const userData = await userRes.json();
      const uid      = userData.user_id;

      // load all notices
      const noticesRes  = await fetch(`https://sushanSht-nepali-notice-reader.hf.space/embed/notices/${uid}`);
      const noticesData = await noticesRes.json();

      if (noticesData.notices && noticesData.notices.length > 0) {
        setNotices(noticesData.notices);

        const latest = noticesData.notices[0];
        setActiveNoticeId(latest.id);

        const sumRes  = await fetch(`https://sushanSht-nepali-notice-reader.hf.space/summarize/${latest.id}`);
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleUploadSuccess = (noticeId: string, noticeSummary: any) => {
    setActiveNoticeId(noticeId);
    setSummary(noticeSummary);
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
    try {
      const res  = await fetch(`https://sushanSht-nepali-notice-reader.hf.space/summarize/${noticeId}`);
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Failed to switch notice:", err);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      await fetch(`https://sushanSht-nepali-notice-reader.hf.space/notices/${noticeId}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Failed to delete notice:", err);
    } finally {
      const remaining = notices.filter((n) => n.id !== noticeId);
      setNotices(remaining);

      if (activeNoticeId === noticeId) {
        if (remaining.length > 0) {
          handleSwitchNotice(remaining[0].id);
        } else {
          setActiveNoticeId(null);
          setSummary(null);
        }
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // still checking session
  if (!userEmail && isRestoring) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇳🇵</span>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Nepali Notice Reader</h1>
              <p className="text-xs text-gray-400">
                Upload any government notice — get instant English summary
              </p>
            </div>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">{userEmail}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-400 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Log out
            </button>
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
            onDelete       = {handleDeleteNotice}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          <UploadZone
            onUploadSuccess = {handleUploadSuccess}
            userEmail       = {userEmail ?? ""}
          />

          {isRestoring ? (
            <div className="flex justify-center py-16 text-gray-400">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Restoring your session...</p>
              </div>
            </div>
          ) : activeNoticeId && summary ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SummaryCard summary={summary} />
              <ChatBox key={activeNoticeId} noticeId={activeNoticeId} />
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-4">☝️</p>
              <p className="text-lg font-medium">Upload a notice to get started</p>
              <p className="text-sm mt-1">Supports any Nepali government notice image or PDF</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}