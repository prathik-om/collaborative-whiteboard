'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import RecentSessionsList from '@/components/RecentSessionsList';

export default function HomePage() {
  return (
    <>
      <Header />
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 pt-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Collaborative Whiteboard</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Free whiteboard for students and teachers with real-time collaboration,
          templates, and productivity tools
        </p>
      </div>

      <div className="flex flex-col gap-4 min-w-[300px]">
        <Link
          href="/board"
          className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold text-lg"
        >
          Create Whiteboard
        </Link>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>✓ No account required</p>
          <p>✓ Real-time collaboration</p>
          <p>✓ Educational templates & prompts</p>
        </div>
      </div>

      {/* Recent sessions list */}
      <RecentSessionsList />
      </div>
    </>
  );
}
