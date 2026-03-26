import Link from "next/link";

export default function AudioLibraryPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Audio Library</h1>

      <p className="text-gray-400 mb-6">
        Convert PDFs or pasted text into audio.
      </p>

      <Link
        href="/dashboard/audio-library/create"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg"
      >
        Create Audio
      </Link>
    </div>
  );
}