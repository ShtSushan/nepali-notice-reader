"use client";

import { useState, useEffect } from "react";
import { useRouter }     from "next/navigation";
import { supabase }      from "@/lib/supabase";
import UploadZone        from "@/components/UploadZone";
import SummaryCard       from "@/components/SummaryCard";
import ChatBox           from "@/components/ChatBox";
import NoticeSidebar     from "@/components/NoticeSidebar";

const API = "https://sushanSht-nepali-notice-reader.hf.space";

export default function Home() {
  const router = useRouter();

  const [userEmail,      setUserEmail]      = useState<string | null>(null);
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [summary,        setSummary]        = useState<any>(null);
  const [notices,        setNotices]        = useState<any[]>([]);
  const [isRestoring,    setIsRestoring]    = useState(true);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.push("/login");
        else setUserEmail(session.user.email ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUserEmail(session.user.email ?? null);
    restoreSession(session.user.email!);
  };

  const restoreSession = async (email: string) => {
    setIsRestoring(true);
    try {
      const userRes  = await fetch(`${API}/embed/user?email=` + encodeURIComponent(email));
      const userData = await userRes.json();
      const uid      = userData.user_id;

      const noticesRes  = await fetch(`${API}/embed/notices/${uid}`);
      const noticesData = await noticesRes.json();

      if (noticesData.notices && noticesData.notices.length > 0) {
        setNotices(noticesData.notices);
        const latest = noticesData.notices[0];
        setActiveNoticeId(latest.id);
        const sumRes  = await fetch(`${API}/summarize/${latest.id}`);
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
    setSidebarOpen(false);
    setNotices((prev) => [
      { id: noticeId, summary: noticeSummary, created_at: new Date().toISOString() },
      ...prev
    ]);
  };

  const handleSwitchNotice = async (noticeId: string) => {
    setActiveNoticeId(noticeId);
    setSidebarOpen(false); // close sidebar on mobile after switching
    try {
      const res  = await fetch(`${API}/summarize/${noticeId}`);
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Failed to switch notice:", err);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      await fetch(`${API}/notices/${noticeId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete notice:", err);
    } finally {
      const remaining = notices.filter((n) => n.id !== noticeId);
      setNotices(remaining);
      if (activeNoticeId === noticeId) {
        if (remaining.length > 0) handleSwitchNotice(remaining[0].id);
        else { setActiveNoticeId(null); setSummary(null); }
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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

      {/* ── Header ── */}
      <header className="bg-white border-b shadow-sm px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">

          {/* Left — hamburger + title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <img
              src="https://flagcdn.com/w40/np.png"
              alt="Nepal"
              className="w-7 h-auto shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-800 leading-tight">Nepali Notice Reader</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Upload any government notice — get instant English summary</p>
            </div>
          </div>

          {/* Right — email + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-xs text-gray-500 hidden sm:block truncate max-w-[180px]">{userEmail}</p>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-400 border border-gray-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 md:hidden
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <p className="text-sm font-semibold text-gray-700">My Notices</p>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-full pb-20">
          <NoticeSidebar
            notices        = {notices}
            activeNoticeId = {activeNoticeId}
            onSwitch       = {handleSwitchNotice}
            onDelete       = {handleDeleteNotice}
          />
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:flex md:gap-6">

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden md:block w-64 shrink-0">
          <NoticeSidebar
            notices        = {notices}
            activeNoticeId = {activeNoticeId}
            onSwitch       = {handleSwitchNotice}
            onDelete       = {handleDeleteNotice}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-5 min-w-0">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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